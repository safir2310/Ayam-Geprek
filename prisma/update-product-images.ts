import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🖼️ Updating product images...')

  const productImages: Record<string, string> = {
    'AGP-001': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=400&fit=crop', // Ayam Geprek Original
    'AGP-002': 'https://images.unsplash.com/photo-1615557960916-5f4791effe9d?w=400&h=400&fit=crop', // Ayam Geprek Jumbo
    'AGP-003': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=400&fit=crop', // Ayam Geprek Super Pedas
    'AGP-004': 'https://images.unsplash.com/photo-1527477396000-64ca9c00173c?w=400&h=400&fit=crop', // Ayam Geprek Keju
    'ABK-001': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=400&fit=crop', // Ayam Bakar Madu
    'ABK-002': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=400&fit=crop', // Ayam Bakar Bumbu Rujak
    'ABK-003': 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=400&fit=crop', // Ayam Bakar Spesial
    'NAS-001': 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=400&fit=crop', // Nasi Putih
    'NAS-002': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop', // Nasi Uduk
    'NAS-003': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop', // Nasi Kuning
    'MIN-001': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop', // Es Teh Manis
    'MIN-002': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop', // Es Jeruk
    'MIN-003': 'https://images.unsplash.com/photo-1513639776629-9269d0522c32?w=400&h=400&fit=crop', // Es Campur
    'MIN-004': 'https://images.unsplash.com/photo-1523049673856-638898058498?w=400&h=400&fit=crop', // Jus Alpukat
    'MIN-005': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop', // Kopi Susu
    'MIN-006': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop', // Air Mineral
    'TAM-001': 'https://images.unsplash.com/photo-1599554473865-4cdda84dc561?w=400&h=400&fit=crop', // Tempe Goreng
    'TAM-002': 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400&h=400&fit=crop', // Tahu Goreng
    'TAM-003': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop', // Sambal Ijo Extra
    'TAM-004': 'https://images.unsplash.com/photo-1626803775151-61d756612f97?w=400&h=400&fit=crop', // Kerupuk
    'TAM-005': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop', // Lalapan Sayur
    'DST-001': 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&h=400&fit=crop', // Pisang Goreng
    'DST-002': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400&fit=crop', // Pisang Keju Coklat
    'DST-003': 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&h=400&fit=crop', // Roti Bakar
  }

  let updated = 0

  for (const [sku, imageUrl] of Object.entries(productImages)) {
    try {
      const product = await prisma.product.findUnique({
        where: { sku }
      })

      if (product) {
        await prisma.product.update({
          where: { sku },
          data: { image: imageUrl }
        })
        console.log(`✓ Updated: ${product.name}`)
        updated++
      } else {
        console.log(`✗ Not found: ${sku}`)
      }
    } catch (error) {
      console.error(`✗ Error updating ${sku}:`, error)
    }
  }

  console.log(`\n🎉 Successfully updated ${updated} products with images!`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
