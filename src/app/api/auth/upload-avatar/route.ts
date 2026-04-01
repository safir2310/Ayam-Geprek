'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

// POST /api/auth/upload-avatar - Upload user avatar
export async function POST(request: NextRequest) {
  try {
    console.log('[Upload Avatar] Starting upload...')
    
    const token = request.cookies.get('auth-token')?.value
    console.log('[Upload Avatar] Token found:', !!token)

    if (!token) {
      console.log('[Upload Avatar] No token found')
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    console.log('[Upload Avatar] Token decoded:', !!decoded, 'User ID:', decoded?.userId)

    if (!decoded || !decoded.userId) {
      console.log('[Upload Avatar] Invalid token')
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    console.log('[Upload Avatar] File received:', !!file, 'Name:', file?.name, 'Size:', file?.size, 'Type:', file?.type)

    if (!file) {
      console.log('[Upload Avatar] No file in form data')
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.log('[Upload Avatar] Invalid file type:', file.type)
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      console.log('[Upload Avatar] File too large:', file.size, 'Max:', maxSize)
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum 5MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('[Upload Avatar] File converted to buffer, size:', buffer.length)

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars')
    console.log('[Upload Avatar] Uploads directory:', uploadsDir)
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)
    console.log('[Upload Avatar] File path:', filePath)

    // Write file to disk
    await writeFile(filePath, buffer)
    console.log('[Upload Avatar] File written successfully')

    // Generate public URL
    const avatarUrl = `/uploads/avatars/${fileName}`
    console.log('[Upload Avatar] Avatar URL:', avatarUrl)

    // Update user avatar in database
    console.log('[Upload Avatar] Updating database for user:', decoded.userId)
    const user = await db.user.update({
      where: { id: decoded.userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    })
    console.log('[Upload Avatar] User updated:', user.id, 'Avatar:', user.avatar)

    return NextResponse.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl,
        user,
      },
    })
  } catch (error) {
    console.error('[Upload Avatar] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
