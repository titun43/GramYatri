import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
// Ride lifecycle: PENDING → ACCEPTED → IN_PROGRESS → COMPLETED or CANCELLED

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const ride = await db.ride.findUnique({
      where: { id },
      include: {
        user: true,
        driver: { include: { user: true } },
        ratings: true,
        emergencyAlerts: true,
        commission: true,
        disputes: true,
        sharedRide: { include: { route: true, passengers: { include: { user: true } } } },
      },
    })

    if (!ride) {
      return NextResponse.json({ success: false, message: 'Ride not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, ride })
  } catch (error) {
    console.error('Get ride error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get ride' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, driverId, cancelledBy, cancelReason, paymentStatus } = body

    // Fetch the current ride first
    const currentRide = await db.ride.findUnique({
      where: { id },
      include: {
        user: true,
        driver: { include: { user: true } },
      },
    })

    if (!currentRide) {
      return NextResponse.json({ success: false, message: 'Ride not found' }, { status: 404 })
    }

    // Validate status transition
    if (status) {
      const allowedTransitions = VALID_TRANSITIONS[currentRide.status]
      if (!allowedTransitions || !allowedTransitions.includes(status)) {
        return NextResponse.json(
          { success: false, message: `Invalid transition: ${currentRide.status} → ${status}` },
          { status: 400 }
        )
      }
    }

    // ─── PENDING → ACCEPTED ──────────────────────────────────────────────
    if (status === 'ACCEPTED') {
      if (!driverId) {
        return NextResponse.json(
          { success: false, message: 'driverId is required when accepting a ride' },
          { status: 400 }
        )
      }

      // Verify the driver exists and is approved
      const driver = await db.driver.findUnique({ where: { id: driverId } })
      if (!driver) {
        return NextResponse.json(
          { success: false, message: 'Driver not found' },
          { status: 404 }
        )
      }
      if (!driver.isApproved) {
        return NextResponse.json(
          { success: false, message: 'Driver is not approved' },
          { status: 403 }
        )
      }

      const updatedRide = await db.ride.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          driverId,
        },
        include: {
          user: true,
          driver: { include: { user: true } },
        },
      })

      // Update driver's totalRides count
      await db.driver.update({
        where: { id: driverId },
        data: { totalRides: driver.totalRides + 1 },
      })

      return NextResponse.json({ success: true, ride: updatedRide })
    }

    // ─── ACCEPTED → IN_PROGRESS ──────────────────────────────────────────
    if (status === 'IN_PROGRESS') {
      const updatedRide = await db.ride.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
        include: {
          user: true,
          driver: { include: { user: true } },
        },
      })

      return NextResponse.json({ success: true, ride: updatedRide })
    }

    // ─── IN_PROGRESS → COMPLETED ─────────────────────────────────────────
    if (status === 'COMPLETED') {
      const rideDriverId = currentRide.driverId
      if (!rideDriverId) {
        return NextResponse.json(
          { success: false, message: 'Cannot complete a ride without a driver' },
          { status: 400 }
        )
      }

      // Get the driver record to access their userId for wallet lookup
      const driverRecord = await db.driver.findUnique({ where: { id: rideDriverId } })
      if (!driverRecord) {
        return NextResponse.json(
          { success: false, message: 'Driver record not found' },
          { status: 404 }
        )
      }
      const driverUserId = driverRecord.userId

      // Get commission percentage from AppSettings
      const commissionSetting = await db.appSetting.findUnique({
        where: { key: 'commission_percentage' },
      })
      const commissionPercentage = commissionSetting ? parseFloat(commissionSetting.value) : 15
      const commissionAmount = (currentRide.fare * commissionPercentage) / 100
      const driverEarning = currentRide.fare - commissionAmount

      // Use a transaction for all the financial operations
      await db.$transaction(async (tx) => {
        // Update ride status - completedAt is tracked via updatedAt
        await tx.ride.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            paymentStatus: currentRide.paymentMethod === 'CASH' ? 'PAID' : currentRide.paymentStatus,
          },
        })

        // Create commission record
        await tx.commission.create({
          data: {
            driverId: rideDriverId,
            rideId: id,
            amount: commissionAmount,
            percentage: commissionPercentage,
          },
        })

        // Update driver stats
        await tx.driver.update({
          where: { id: rideDriverId },
          data: {
            totalEarnings: driverRecord.totalEarnings + driverEarning,
          },
        })

        // Handle wallet payments
        if (currentRide.paymentMethod === 'WALLET') {
          // Deduct from user's wallet
          const userWallet = await tx.wallet.findUnique({ where: { userId: currentRide.userId } })
          if (userWallet) {
            const amountToDeduct = currentRide.fare - currentRide.discount
            await tx.wallet.update({
              where: { userId: currentRide.userId },
              data: { balance: userWallet.balance - amountToDeduct },
            })
            // Create debit transaction for user
            await tx.transaction.create({
              data: {
                walletId: userWallet.id,
                amount: amountToDeduct,
                type: 'DEBIT',
                description: `Ride payment - ${currentRide.pickupAddress} to ${currentRide.dropAddress}`,
                referenceId: id,
              },
            })
          }

          // Add to driver's wallet (minus commission) - use driver's userId
          const driverWallet = await tx.wallet.findUnique({ where: { userId: driverUserId } })
          if (driverWallet) {
            await tx.wallet.update({
              where: { userId: driverUserId },
              data: { balance: driverWallet.balance + driverEarning },
            })
            // Create credit transaction for driver
            await tx.transaction.create({
              data: {
                walletId: driverWallet.id,
                amount: driverEarning,
                type: 'CREDIT',
                description: `Ride earning - ${currentRide.pickupAddress} to ${currentRide.dropAddress}`,
                referenceId: id,
              },
            })
          }
        } else if (currentRide.paymentMethod === 'CASH') {
          // For cash payments, commission is deducted from driver's earnings
          // The driver collects full fare from user in cash, then owes commission
          // We deduct commission from driver's wallet if they have balance
          const driverWallet = await tx.wallet.findUnique({ where: { userId: driverUserId } })
          if (driverWallet && driverWallet.balance >= commissionAmount) {
            await tx.wallet.update({
              where: { userId: driverUserId },
              data: { balance: driverWallet.balance - commissionAmount },
            })
            await tx.transaction.create({
              data: {
                walletId: driverWallet.id,
                amount: commissionAmount,
                type: 'DEBIT',
                description: `Commission for ride - ${currentRide.pickupAddress} to ${currentRide.dropAddress}`,
                referenceId: id,
              },
            })
          }
        }
      })

      // Fetch the updated ride to return
      const updatedRide = await db.ride.findUnique({
        where: { id },
        include: {
          user: true,
          driver: { include: { user: true } },
        },
      })

      return NextResponse.json({ success: true, ride: updatedRide })
    }

    // ─── Any → CANCELLED ─────────────────────────────────────────────────
    if (status === 'CANCELLED') {
      await db.$transaction(async (tx) => {
        // Update ride status
        await tx.ride.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            cancelledBy: cancelledBy || null,
            cancelReason: cancelReason || null,
          },
        })

        // Handle refund if wallet payment was used
        if (currentRide.paymentMethod === 'WALLET' && currentRide.paymentStatus === 'PAID') {
          const userWallet = await tx.wallet.findUnique({ where: { userId: currentRide.userId } })
          if (userWallet) {
            const refundAmount = currentRide.fare - currentRide.discount
            await tx.wallet.update({
              where: { userId: currentRide.userId },
              data: { balance: userWallet.balance + refundAmount },
            })
            // Create credit transaction for refund
            await tx.transaction.create({
              data: {
                walletId: userWallet.id,
                amount: refundAmount,
                type: 'CREDIT',
                description: `Refund for cancelled ride - ${currentRide.pickupAddress} to ${currentRide.dropAddress}`,
                referenceId: id,
              },
            })
          }
        }

        // If a driver was assigned and ride was ACCEPTED, revert driver's totalRides
        if (currentRide.driverId && (currentRide.status === 'ACCEPTED' || currentRide.status === 'PENDING')) {
          const driver = await tx.driver.findUnique({ where: { id: currentRide.driverId } })
          if (driver && driver.totalRides > 0) {
            await tx.driver.update({
              where: { id: currentRide.driverId },
              data: { totalRides: driver.totalRides - 1 },
            })
          }
        }
      })

      const updatedRide = await db.ride.findUnique({
        where: { id },
        include: {
          user: true,
          driver: { include: { user: true } },
        },
      })

      return NextResponse.json({ success: true, ride: updatedRide })
    }

    // ─── Fallback: simple update (e.g., just paymentStatus) ─────────────
    const updateData: Record<string, unknown> = {}
    if (paymentStatus) updateData.paymentStatus = paymentStatus

    const ride = await db.ride.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        driver: { include: { user: true } },
      },
    })

    return NextResponse.json({ success: true, ride })
  } catch (error) {
    console.error('Update ride error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update ride' }, { status: 500 })
  }
}
