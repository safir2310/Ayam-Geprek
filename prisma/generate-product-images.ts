import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

// Product data with prompts
const products = [
  { name: 'Ayam Geprek Original', prompt: 'Indonesian fried chicken with green chili sambal, professional food photography, warm lighting, appetizing, restaurant quality' },
  { name: 'Ayam Geprek Jumbo', prompt: 'Large portion Indonesian fried chicken with spicy green chili sambal, generous serving, professional food photography, delicious' },
  { name: 'Ayam Geprek Super Pedas', prompt: 'Indonesian fried chicken with extra spicy green chili sambal, steam rising, vibrant green chilies, professional food photography' },
  { name: 'Ayam Geprek Keju', prompt: 'Indonesian fried chicken with green chili sambal and melted cheese on top, cheese dripping, professional food photography, appetizing' },
  { name: 'Ayam Bakar Madu', prompt: 'Indonesian grilled chicken with honey glaze, char marks, glistening honey, professional food photography, warm brown tones' },
  { name: 'Ayam Bakar Bumbu Rujak', prompt: 'Indonesian grilled chicken with spicy sweet sauce, vibrant red sauce, professional food photography, appetizing' },
  { name: 'Ayam Bakar Spesial', prompt: 'Indonesian grilled chicken special with shrimp paste sambal, garnish with herbs, professional food photography' },
  { name: 'Nasi Putih', prompt: 'Steaming white rice in a bowl, simple and clean, professional food photography, white background' },
  { name: 'Nasi Uduk', prompt: 'Indonesian coconut rice with fried chicken, tempeh, and sambal, colorful plate, professional food photography' },
  { name: 'Nasi Kuning', prompt: 'Indonesian yellow rice with side dishes, turmeric color, festive presentation, professional food photography' },
  { name: 'Es Teh Manis', prompt: 'Iced sweet tea in a glass with ice cubes, tea color with condensation, professional food photography, refreshing' },
  { name: 'Es Jeruk', prompt: 'Fresh orange juice with ice cubes, orange color, citrus slice garnish, professional food photography, refreshing' },
  { name: 'Es Campur', prompt: 'Indonesian mixed ice dessert with colorful fruits, shaved ice, condensed milk, vibrant and colorful, professional food photography' },
  { name: 'Jus Alpukat', prompt: 'Fresh avocado juice with chocolate syrup, green color with chocolate drizzle, glass with ice, professional food photography' },
  { name: 'Kopi Susu', prompt: 'Indonesian coffee with palm sugar milk, layered drink, warm brown tones, professional food photography' },
  { name: 'Air Mineral', prompt: 'Bottled mineral water on white background, clean and simple, professional product photography, 600ml bottle' },
  { name: 'Tempe Goreng', prompt: 'Fried Indonesian tempeh, golden brown crispy texture, professional food photography, traditional snack' },
  { name: 'Tahu Goreng', prompt: 'Fried Indonesian tofu, golden brown, crispy, professional food photography, simple and delicious' },
  { name: 'Sambal Ijo Extra', prompt: 'Indonesian green chili sambal in a small bowl, vibrant green color, spicy, professional food photography' },
  { name: 'Kerupuk', prompt: 'Indonesian shrimp crackers, stacked pile, golden and crispy, professional food photography, traditional snack' },
  { name: 'Lalapan Sayur', prompt: 'Indonesian fresh vegetable salad with various greens, fresh and healthy, professional food photography' },
  { name: 'Pisang Goreng', prompt: 'Fried bananas, golden brown crispy, on a plate, professional food photography, traditional snack' },
  { name: 'Pisang Keju Coklat', prompt: 'Fried bananas with cheese and chocolate topping, melted cheese drizzle, chocolate sauce, professional food photography, dessert' },
  { name: 'Roti Bakar', prompt: 'Indonesian grilled toast with jam and butter, warm golden brown, professional food photography, breakfast' },
]

const outputDir = path.join(process.cwd(), 'public', 'product-images')

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
  console.log(`Created directory: ${outputDir}`)
}

async function generateImage(prompt, filename) {
  const zai = await ZAI.create()

  const response = await zai.images.generations.create({
    prompt: prompt,
    size: '1024x1024'
  })

  const imageBase64 = response.data[0].base64
  const buffer = Buffer.from(imageBase64, 'base64')

  const outputPath = path.join(outputDir, filename)
  fs.writeFileSync(outputPath, buffer)

  console.log(`✓ Generated: ${filename}`)
  return `/product-images/${filename}`
}

async function main() {
  console.log('🎨 Generating product images...\n')

  const imageUrls: Record<string, string> = {}

  for (const product of products) {
    try {
      // Create a safe filename from product name
      const safeName = product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const filename = `${safeName}.png`

      const imageUrl = await generateImage(product.prompt, filename)
      imageUrls[product.name] = imageUrl

      // Small delay between generations
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`✗ Failed to generate image for ${product.name}:`, error.message)
      imageUrls[product.name] = ''
    }
  }

  console.log('\n📝 Image URLs:')
  console.log(JSON.stringify(imageUrls, null, 2))

  // Save to a JSON file for reference
  const outputPath = path.join(process.cwd(), 'prisma', 'product-images.json')
  fs.writeFileSync(outputPath, JSON.stringify(imageUrls, null, 2))
  console.log(`\n💾 Saved image URLs to: ${outputPath}`)
}

main().catch(console.error)
