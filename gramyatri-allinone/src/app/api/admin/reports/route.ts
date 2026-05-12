import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

function getDateRange(period: string): Date {
  const now = new Date()
  switch (period) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return start
    }
    case 'week': {
      const start = new Date(now)
      start.setDate(now.getDate() - 7)
      start.setHours(0, 0, 0, 0)
      return start
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return start
    }
    default:
      return new Date(0) // all time
  }
}

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type') ?? 'rides'
    const period = req.nextUrl.searchParams.get('period') ?? 'month'
    const startDate = getDateRange(period)

    switch (type) {
      case 'rides':
        return await handleRidesReport(startDate)
      case 'revenue':
        return await handleRevenueReport(startDate)
      case 'drivers':
        return await handleDriversReport(startDate)
      case 'users':
        return await handleUsersReport(startDate)
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid report type. Use: rides, revenue, drivers, users' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Generate report error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

async function handleRidesReport(startDate: Date) {
  const [totalRides, completedRides, cancelledRides, ridesInPeriod] = await Promise.all([
    db.ride.count({ where: { createdAt: { gte: startDate } } }),
    db.ride.count({ where: { status: 'COMPLETED', createdAt: { gte: startDate } } }),
    db.ride.count({ where: { status: 'CANCELLED', createdAt: { gte: startDate } } }),
    db.ride.findMany({
      where: { createdAt: { gte: startDate } },
      select: {
        fare: true,
        discount: true,
        distance: true,
        status: true,
        vehicleType: false,
        paymentMethod: true,
        driver: { select: { vehicleType: true } },
      },
    }),
  ])

  const completedRidesData = ridesInPeriod.filter((r) => r.status === 'COMPLETED')
  const totalFare = completedRidesData.reduce((sum, r) => sum + r.fare, 0)
  const totalDistance = completedRidesData.reduce((sum, r) => sum + r.distance, 0)

  const avgFare = completedRidesData.length > 0
    ? Math.round((totalFare / completedRidesData.length) * 100) / 100
    : 0
  const avgDistance = completedRidesData.length > 0
    ? Math.round((totalDistance / completedRidesData.length) * 100) / 100
    : 0

  // Rides by status
  const ridesByStatus: Record<string, number> = {}
  for (const ride of ridesInPeriod) {
    ridesByStatus[ride.status] = (ridesByStatus[ride.status] ?? 0) + 1
  }

  // Rides by vehicle type
  const ridesByVehicleType: Record<string, number> = {}
  for (const ride of ridesInPeriod) {
    const vType = ride.driver?.vehicleType ?? 'UNASSIGNED'
    ridesByVehicleType[vType] = (ridesByVehicleType[vType] ?? 0) + 1
  }

  // Rides by payment method
  const ridesByPaymentMethod: Record<string, number> = {}
  for (const ride of ridesInPeriod) {
    ridesByPaymentMethod[ride.paymentMethod] = (ridesByPaymentMethod[ride.paymentMethod] ?? 0) + 1
  }

  return NextResponse.json({
    success: true,
    report: {
      totalRides,
      completedRides,
      cancelledRides,
      avgFare,
      avgDistance,
      ridesByStatus,
      ridesByVehicleType,
      ridesByPaymentMethod,
    },
  })
}

async function handleRevenueReport(startDate: Date) {
  const [commissions, completedRides, transactions] = await Promise.all([
    db.commission.findMany({
      where: { createdAt: { gte: startDate } },
      select: { amount: true, percentage: true },
    }),
    db.ride.findMany({
      where: { status: 'COMPLETED', createdAt: { gte: startDate } },
      select: {
        fare: true,
        discount: true,
        paymentMethod: true,
        createdAt: true,
        driver: { select: { vehicleType: true } },
      },
    }),
    db.transaction.findMany({
      where: { createdAt: { gte: startDate } },
      select: { amount: true, type: true },
    }),
  ])

  const totalRevenue = completedRides.reduce((sum, r) => sum + r.fare - r.discount, 0)
  const commissionEarned = commissions.reduce((sum, c) => sum + c.amount, 0)
  const driverEarnings = totalRevenue - commissionEarned
  const walletTransactions = transactions.length

  // Revenue by day
  const revenueByDay: Record<string, number> = {}
  for (const ride of completedRides) {
    const day = ride.createdAt.toISOString().split('T')[0] ?? 'unknown'
    revenueByDay[day] = (revenueByDay[day] ?? 0) + ride.fare - ride.discount
  }

  // Revenue by vehicle type
  const revenueByVehicleType: Record<string, number> = {}
  for (const ride of completedRides) {
    const vType = ride.driver?.vehicleType ?? 'UNASSIGNED'
    revenueByVehicleType[vType] = (revenueByVehicleType[vType] ?? 0) + ride.fare - ride.discount
  }

  return NextResponse.json({
    success: true,
    report: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      commissionEarned: Math.round(commissionEarned * 100) / 100,
      driverEarnings: Math.round(driverEarnings * 100) / 100,
      walletTransactions,
      revenueByDay,
      revenueByVehicleType,
    },
  })
}

async function handleDriversReport(startDate: Date) {
  const [
    totalDrivers,
    approvedDrivers,
    pendingDrivers,
    suspendedDrivers,
    onlineDrivers,
    driverStats,
  ] = await Promise.all([
    db.driver.count(),
    db.driver.count({ where: { isApproved: true } }),
    db.driver.count({ where: { isApproved: false } }),
    db.driver.count({ where: { isApproved: true, isSuspended: true } }),
    db.driver.count({ where: { isOnline: true } }),
    db.driver.findMany({
      where: { isApproved: true },
      include: {
        user: { select: { name: true } },
        rides: {
          where: { status: 'COMPLETED', createdAt: { gte: startDate } },
          select: { fare: true },
        },
      },
    }),
  ])

  const ratedDrivers = driverStats.filter((d) => d.rating > 0)
  const avgRating = ratedDrivers.length > 0
    ? Math.round((ratedDrivers.reduce((sum, d) => sum + d.rating, 0) / ratedDrivers.length) * 100) / 100
    : 0

  // Top performers by ride count and earnings
  const performers = driverStats
    .map((d) => ({
      name: d.user.name ?? 'Unknown',
      rides: d.rides.length,
      earnings: d.rides.reduce((sum, r) => sum + r.fare, 0),
      rating: d.rating,
    }))
    .sort((a, b) => b.rides - a.rides)
    .slice(0, 10)

  return NextResponse.json({
    success: true,
    report: {
      totalDrivers,
      approvedDrivers,
      pendingDrivers,
      suspendedDrivers,
      onlineDrivers,
      avgRating,
      topPerformers: performers,
    },
  })
}

async function handleUsersReport(startDate: Date) {
  const [totalUsers, verifiedUsers, blockedUsers, wallets, newUsers] = await Promise.all([
    db.user.count({ where: { role: 'USER' } }),
    db.user.count({ where: { role: 'USER', isVerified: true } }),
    db.user.count({ where: { role: 'USER', isBlocked: true } }),
    db.wallet.findMany({
      where: { user: { role: 'USER' } },
      select: { balance: true },
    }),
    db.user.count({
      where: {
        role: 'USER',
        createdAt: { gte: startDate },
      },
    }),
  ])

  const totalWalletBalance = wallets.reduce((sum, w) => sum + w.balance, 0)
  const avgWalletBalance = wallets.length > 0
    ? Math.round((totalWalletBalance / wallets.length) * 100) / 100
    : 0

  return NextResponse.json({
    success: true,
    report: {
      totalUsers,
      verifiedUsers,
      blockedUsers,
      avgWalletBalance,
      totalWalletBalance: Math.round(totalWalletBalance * 100) / 100,
      newUsersThisPeriod: newUsers,
    },
  })
}
