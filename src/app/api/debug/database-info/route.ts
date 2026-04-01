import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get all users (without passwords)
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get all categories
    const categories = await db.category.findMany({
      orderBy: { order: 'asc' },
    })

    // Get all products with category
    const products = await db.product.findMany({
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get all members
    const members = await db.member.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        users,
        categories,
        products,
        members,
        summary: {
          totalUsers: users.length,
          totalCategories: categories.length,
          totalProducts: products.length,
          totalMembers: members.length,
        },
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch database info',
      },
      { status: 500 }
    )
  }
}
