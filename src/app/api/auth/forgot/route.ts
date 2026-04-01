import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  console.log('[Forgot Password API] Request received')
  try {
    const { email } = await request.json()

    if (!email) {
      console.log('[Forgot Password API] Email is missing')
      return NextResponse.json(
        { success: false, error: 'Email diperlukan' },
        { status: 400 }
      )
    }

    console.log('[Forgot Password API] Checking email:', email)

    // Check if user exists with this email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      console.log('[Forgot Password API] Email not found:', email)
      return NextResponse.json({
        success: false,
        error: 'Email tidak terdaftar'
      }, { status: 404 })
    }

    console.log('[Forgot Password API] User found:', user.id, user.name)

    // TODO: Implement actual email sending with reset link
    console.log('[Forgot Password API] Password reset requested for email:', email)

    return NextResponse.json({
      success: true,
      message: 'Link reset password telah dikirim ke email Anda'
    })
  } catch (error: any) {
    console.error('[Forgot Password API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memproses permintaan' },
      { status: 500 }
    )
  }
}
