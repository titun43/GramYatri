import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json()

    if (!phone || !password) {
      return NextResponse.json(
        { success: false, message: 'Phone and password are required' },
        { status: 400 }
      )
    }

    // Normalize phone: remove +91 prefix for comparison
    const normalizedPhone = phone.replace(/^\+91/, '')

    // ── STEP 1: Check env vars FIRST (works even if DB is down) ──
    const adminPhone = process.env.ADMIN_PHONE
    const adminPassword = process.env.ADMIN_PASSWORD

    if (adminPhone && adminPassword) {
      const normalizedAdminPhone = adminPhone.replace(/^\+91/, '')

      if (normalizedPhone === normalizedAdminPhone && password === adminPassword) {
        // Env vars match — find or create the admin user in the database
        try {
          let user = await db.user.findFirst({
            where: {
              OR: [
                { phone },
                { phone: `+91${normalizedPhone}` },
                { phone: normalizedPhone },
              ],
            },
          })

          if (user) {
            // Update existing user's password and role if needed
            if (user.role !== 'ADMIN' || user.adminPassword !== adminPassword) {
              await db.user.update({
                where: { id: user.id },
                data: { role: 'ADMIN', adminPassword: adminPassword },
              })
            }

            if (user.isBlocked) {
              return NextResponse.json(
                { success: false, message: 'Admin account is blocked' },
                { status: 403 }
              )
            }

            return NextResponse.json({
              success: true,
              user: {
                id: user.id,
                phone: user.phone,
                name: user.name || 'Admin',
                role: 'ADMIN',
                isVerified: user.isVerified,
              },
            })
          } else {
            // Create new admin user
            const fullPhone = `+91${normalizedPhone}`
            const newAdmin = await db.user.create({
              data: {
                phone: fullPhone,
                name: 'Admin',
                role: 'ADMIN',
                isVerified: true,
                adminPassword: adminPassword,
                wallet: {
                  create: { balance: 0 },
                },
              },
            })

            return NextResponse.json({
              success: true,
              user: {
                id: newAdmin.id,
                phone: newAdmin.phone,
                name: newAdmin.name,
                role: newAdmin.role,
                isVerified: newAdmin.isVerified,
              },
            })
          }
        } catch (dbError) {
          // DB operations failed, but env vars matched — allow login without DB
          console.error('Admin login DB error (env vars matched, allowing login):', dbError)
          return NextResponse.json({
            success: true,
            user: {
              id: `admin-${normalizedPhone}`,
              phone: `+91${normalizedPhone}`,
              name: 'Admin',
              role: 'ADMIN',
              isVerified: true,
            },
          })
        }
      }

      // Env vars are set but don't match — wrong credentials
      return NextResponse.json(
        { success: false, message: 'Invalid admin credentials' },
        { status: 401 }
      )
    }

    // ── STEP 2: Fallback — check DB if env vars are not set ──
    try {
      let user = await db.user.findFirst({
        where: {
          OR: [
            { phone },
            { phone: `+91${normalizedPhone}` },
            { phone: normalizedPhone },
          ],
        },
      })

      if (user && user.role === 'ADMIN') {
        if (!user.adminPassword || user.adminPassword !== password) {
          return NextResponse.json(
            { success: false, message: 'Invalid admin credentials' },
            { status: 401 }
          )
        }

        if (user.isBlocked) {
          return NextResponse.json(
            { success: false, message: 'Admin account is blocked' },
            { status: 403 }
          )
        }

        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
            role: user.role,
            isVerified: user.isVerified,
          },
        })
      }
    } catch (dbError) {
      console.error('Admin login DB error:', dbError)
    }

    return NextResponse.json(
      { success: false, message: 'Invalid admin credentials' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ success: false, message: 'Login failed' }, { status: 500 })
  }
}
