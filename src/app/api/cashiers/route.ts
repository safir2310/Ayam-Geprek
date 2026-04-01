import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

// GET - Fetch all cashiers
export async function GET(request: NextRequest) {
  try {
    const cashiers = await db.user.findMany({
      where: {
        role: 'CASHIER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Map to cashier format
    const formattedCashiers = cashiers.map((cashier) => ({
      id: cashier.id,
      name: cashier.name,
      email: cashier.email,
      phone: cashier.phone,
      avatar: cashier.avatar,
      createdAt: cashier.createdAt,
    }))

    return NextResponse.json({
      success: true,
      data: formattedCashiers,
    })
  } catch (error) {
    console.error('Error fetching cashiers:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data kasir',
      },
      { status: 500 }
    )
  }
}

// POST - Register new cashier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, password, role = 'CASHIER' } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nama, email, dan password wajib diisi',
        },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email sudah terdaftar',
        },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create cashier
    const newCashier = await db.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        password: hashedPassword,
        role: role,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newCashier.id,
          name: newCashier.name,
          email: newCashier.email,
          phone: newCashier.phone,
          role: newCashier.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error registering cashier:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mendaftarkan kasir',
      },
      { status: 500 }
    )
  }
}
