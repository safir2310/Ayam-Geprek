import { db } from '@/lib/db'

/**
 * Stock Management Helper Functions
 * These functions handle stock operations for products
 */

/**
 * Decrement product stock when an order/transaction is made
 * @param productId - The ID of the product
 * @param quantity - The quantity to decrement
 * @param reference - Reference ID (e.g., order ID or transaction ID)
 * @returns Updated product with new stock
 */
export async function decrementProductStock(
  productId: string,
  quantity: number,
  reference?: string
) {
  try {
    // Validate inputs
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0')
    }

    // Get current product
    const product = await db.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    // Check if there's enough stock
    if (product.stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`)
    }

    // Update stock
    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: {
        stock: {
          decrement: quantity
        }
      }
    })

    // Create stock log
    await db.stockLog.create({
      data: {
        productId,
        quantity,
        type: 'OUT',
        reason: 'Stock used in order/transaction',
        reference
      }
    })

    // Check if stock is now below minimum and could trigger alert
    if (updatedProduct.stock <= updatedProduct.minStock) {
      console.warn(`Low stock alert: ${product.name} (ID: ${productId}) has ${updatedProduct.stock} items (min: ${updatedProduct.minStock})`)
    }

    return updatedProduct
  } catch (error) {
    console.error('Error decrementing product stock:', error)
    throw error
  }
}

/**
 * Increment product stock (e.g., when order is cancelled or restocked)
 * @param productId - The ID of the product
 * @param quantity - The quantity to increment
 * @param reference - Reference ID (e.g., order ID or transaction ID)
 * @returns Updated product with new stock
 */
export async function incrementProductStock(
  productId: string,
  quantity: number,
  reason: string = 'Stock adjustment',
  reference?: string
) {
  try {
    // Validate inputs
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0')
    }

    // Get current product
    const product = await db.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    // Update stock
    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: {
        stock: {
          increment: quantity
        }
      }
    })

    // Create stock log
    await db.stockLog.create({
      data: {
        productId,
        quantity,
        type: 'IN',
        reason,
        reference
      }
    })

    return updatedProduct
  } catch (error) {
    console.error('Error incrementing product stock:', error)
    throw error
  }
}

/**
 * Check product availability before creating an order
 * @param items - Array of items with productId and quantity
 * @returns Object with availability status and any out-of-stock items
 */
export async function checkProductAvailability(items: Array<{ productId: string; quantity: number }>) {
  try {
    const unavailableItems: Array<{
      productId: string
      name: string
      requested: number
      available: number
    }> = []

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          stock: true
        }
      })

      if (!product) {
        unavailableItems.push({
          productId: item.productId,
          name: 'Unknown Product',
          requested: item.quantity,
          available: 0
        })
      } else if (product.stock < item.quantity) {
        unavailableItems.push({
          productId: product.id,
          name: product.name,
          requested: item.quantity,
          available: product.stock
        })
      }
    }

    return {
      available: unavailableItems.length === 0,
      unavailableItems
    }
  } catch (error) {
    console.error('Error checking product availability:', error)
    throw error
  }
}

/**
 * Adjust stock for multiple items in a transaction
 * @param items - Array of items with productId and quantity
 * @param reference - Reference ID (e.g., transaction ID)
 * @param type - 'decrement' or 'increment'
 * @returns Array of updated products
 */
export async function adjustStockForItems(
  items: Array<{ productId: string; quantity: number }>,
  reference?: string,
  type: 'decrement' | 'increment' = 'decrement'
) {
  const updatedProducts = []

  for (const item of items) {
    try {
      if (type === 'decrement') {
        const updated = await decrementProductStock(item.productId, item.quantity, reference)
        updatedProducts.push(updated)
      } else {
        const updated = await incrementProductStock(
          item.productId,
          item.quantity,
          'Stock adjustment for transaction',
          reference
        )
        updatedProducts.push(updated)
      }
    } catch (error) {
      console.error(`Error adjusting stock for product ${item.productId}:`, error)
      throw error
    }
  }

  return updatedProducts
}
