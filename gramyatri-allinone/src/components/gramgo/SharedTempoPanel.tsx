'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, MapPin, Clock, IndianRupee, Users, CheckCircle2,
  Truck, CircleDot, Route, Calendar, ChevronRight, Bus, Bike
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import FixedRouteCard, { type RouteData, type TempoData } from './FixedRouteCard'

// Mock data
const MOCK_ROUTES: RouteData[] = [
  {
    id: 'route-1',
    name: 'লঙ্কা → হোজাই এক্সপ্রেস',
    from: 'লঙ্কা',
    to: 'হোজাই',
    stops: ['লঙ্কা বাজার', 'বরদোয়া', 'হোজাই বাস স্ট্যান্ড'],
    fares: [0, 15, 30],
    distance: 25,
    duration: 45,
    availableTempos: 3,
    nextDeparture: '10:30 AM',
  },
  {
    id: 'route-2',
    name: 'হোজাই → নগাঁও সার্ভিস',
    from: 'হোজাই',
    to: 'নগাঁও',
    stops: ['হোজাই বাস স্ট্যান্ড', 'কাপিলী', 'জাগীরোড', 'নগাঁও টাউন'],
    fares: [0, 20, 35, 50],
    distance: 40,
    duration: 70,
    availableTempos: 2,
    nextDeparture: '11:00 AM',
  },
  {
    id: 'route-3',
    name: 'গ্রাম → জেলা শাটল',
    from: 'গ্রাম বাজার',
    to: 'জেলা সদর',
    stops: ['গ্রাম বাজার', 'মফস্বল চেরি', 'কলেজ মোড়', 'জেলা সদর'],
    fares: [0, 10, 20, 30],
    distance: 18,
    duration: 35,
    availableTempos: 5,
    nextDeparture: '9:45 AM',
  },
]

const MOCK_AVAILABLE_TEMPOS: TempoData[] = [
  { id: 't-1', routeId: 'route-1', driverName: 'রামু দাস', vehicleNumber: 'AS-01-AB-1234', vehicleType: 'TEMPO', totalSeats: 6, availableSeats: 4, departureTime: '10:30 AM', currentStop: 0 },
  { id: 't-2', routeId: 'route-1', driverName: 'সুরেন কুমার', vehicleNumber: 'AS-02-CD-5678', vehicleType: 'TEMPO', totalSeats: 6, availableSeats: 2, departureTime: '11:15 AM', currentStop: 0 },
  { id: 't-3', routeId: 'route-2', driverName: 'মোহন বর্মণ', vehicleNumber: 'AS-03-EF-9012', vehicleType: 'AUTO', totalSeats: 4, availableSeats: 3, departureTime: '11:00 AM', currentStop: 0 },
  { id: 't-4', routeId: 'route-3', driverName: 'বিমল দাস', vehicleNumber: 'AS-04-GH-3456', vehicleType: 'E_RICKSHAW', totalSeats: 6, availableSeats: 5, departureTime: '9:45 AM', currentStop: 0 },
]

const MOCK_MY_RIDES = [
  {
    id: 'my-sr-1',
    routeName: 'লঙ্কা → হোজাই এক্সপ্রেস',
    pickup: 'লঙ্কা বাজার',
    drop: 'বরদোয়া',
    fare: 15,
    departureTime: 'আজ, 10:30 AM',
    driverName: 'রামু দাস',
    vehicleNumber: 'AS-01-AB-1234',
    status: 'UPCOMING' as const,
    seatsBooked: 1,
  },
  {
    id: 'my-sr-2',
    routeName: 'গ্রাম → জেলা শাটল',
    pickup: 'গ্রাম বাজার',
    drop: 'জেলা সদর',
    fare: 30,
    departureTime: 'আগামীকাল, 9:45 AM',
    driverName: 'বিমল দাস',
    vehicleNumber: 'AS-04-GH-3456',
    status: 'UPCOMING' as const,
    seatsBooked: 2,
  },
]

function toBengaliNum(num: number): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return num.toString().split('').map(d => bengaliDigits[parseInt(d)] || d).join('')
}

const vehicleEmoji: Record<string, string> = {
  TEMPO: '🛺',
  AUTO: '🚗',
  E_RICKSHAW: '🛵',
}

type ViewMode = 'routes' | 'booking' | 'my-rides'

interface BookingState {
  route: RouteData | null
  tempo: TempoData | null
  pickupStop: number
  dropStop: number
  seats: number
  confirmed: boolean
}

interface SharedTempoPanelProps {
  onBack?: () => void
}

export default function SharedTempoPanel({ onBack }: SharedTempoPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('routes')
  const [booking, setBooking] = useState<BookingState>({
    route: null,
    tempo: null,
    pickupStop: -1,
    dropStop: -1,
    seats: 1,
    confirmed: false,
  })

  const segmentFare = useMemo(() => {
    if (!booking.route || booking.pickupStop < 0 || booking.dropStop < 0) return 0
    return booking.route.fares[booking.dropStop] - booking.route.fares[booking.pickupStop]
  }, [booking.route, booking.pickupStop, booking.dropStop])

  const handleSelectTempo = (tempo: TempoData, route: RouteData) => {
    setBooking({
      route,
      tempo,
      pickupStop: -1,
      dropStop: -1,
      seats: 1,
      confirmed: false,
    })
    setViewMode('booking')
  }

  const handleSelectRoute = (route: RouteData) => {
    setBooking({
      route,
      tempo: null,
      pickupStop: -1,
      dropStop: -1,
      seats: 1,
      confirmed: false,
    })
    setViewMode('booking')
  }

  const handleConfirmBooking = () => {
    setBooking(prev => ({ ...prev, confirmed: true }))
  }

  const handleBookingBack = () => {
    if (booking.confirmed) {
      setBooking({
        route: null,
        tempo: null,
        pickupStop: -1,
        dropStop: -1,
        seats: 1,
        confirmed: false,
      })
      setViewMode('routes')
    } else if (booking.tempo) {
      setViewMode('routes')
    } else {
      setViewMode('routes')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={viewMode === 'routes' ? onBack : handleBookingBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="font-bold text-base">
              {viewMode === 'routes' && 'শেয়ার টেম্পো'}
              {viewMode === 'booking' && !booking.confirmed && 'বুকিং করুন'}
              {viewMode === 'booking' && booking.confirmed && 'বুকিং নিশ্চিত'}
              {viewMode === 'my-rides' && 'আমার শেয়ার যাত্রা'}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {viewMode === 'routes' && 'নির্দিষ্ট রুটে শেয়ার টেম্পো'}
              {viewMode === 'booking' && !booking.confirmed && booking.route?.name}
              {viewMode === 'booking' && booking.confirmed && 'আপনার আসন সংরক্ষিত হয়েছে'}
              {viewMode === 'my-rides' && 'আপনার আসন্ন শেয়ার যাত্রা'}
            </p>
          </div>
          {viewMode === 'routes' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-600"
              onClick={() => setViewMode('my-rides')}
            >
              <Calendar className="h-4 w-4 mr-1" />
              আমার যাত্রা
            </Button>
          )}
        </div>

        {/* Tab bar for routes view */}
        {viewMode === 'routes' && (
          <div className="flex px-4 pb-2 gap-2">
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-[11px]">
              <Route className="h-3 w-3 mr-1" />
              {toBengaliNum(MOCK_ROUTES.length)} রুট
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              <Truck className="h-3 w-3 mr-1" />
              {toBengaliNum(MOCK_AVAILABLE_TEMPOS.length)} টেম্পো
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-6">
        <AnimatePresence mode="wait">
          {/* Routes View */}
          {viewMode === 'routes' && (
            <motion.div
              key="routes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-4 space-y-4"
            >
              {/* Route selector tabs */}
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                {MOCK_ROUTES.map((route) => (
                  <button
                    key={route.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-card border border-border shadow-sm whitespace-nowrap hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {route.from}
                    <ChevronRight className="h-3 w-3" />
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    {route.to}
                  </button>
                ))}
              </div>

              {/* Route Cards */}
              {MOCK_ROUTES.map((route) => (
                <FixedRouteCard
                  key={route.id}
                  route={route}
                  tempos={MOCK_AVAILABLE_TEMPOS}
                  onSelectTempo={handleSelectTempo}
                  onSelectRoute={handleSelectRoute}
                />
              ))}
            </motion.div>
          )}

          {/* Booking View */}
          {viewMode === 'booking' && (
            <motion.div
              key="booking"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              {!booking.confirmed ? (
                <>
                  {/* Route Summary */}
                  {booking.route && (
                    <Card className="border-0 shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Route className="h-4 w-4 text-emerald-600" />
                          <h3 className="font-bold text-sm">{booking.route.name}</h3>
                        </div>

                        {/* Stop selection visualization */}
                        <div className="relative pl-2">
                          <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-emerald-500 via-emerald-400 to-orange-500" />
                          <div className="space-y-0">
                            {booking.route.stops.map((stop, idx) => {
                              const isPickup = booking.pickupStop === idx
                              const isDrop = booking.dropStop === idx
                              const isSelected = isPickup || isDrop
                              const isBetween = booking.pickupStop >= 0 && booking.dropStop >= 0 &&
                                idx > Math.min(booking.pickupStop, booking.dropStop) &&
                                idx < Math.max(booking.pickupStop, booking.dropStop)

                              return (
                                <div key={idx} className="relative">
                                  <button
                                    className="flex items-center gap-3 py-2.5 w-full text-left group"
                                    onClick={() => {
                                      if (booking.pickupStop < 0 || (booking.pickupStop >= 0 && booking.dropStop >= 0)) {
                                        // Start fresh selection
                                        setBooking(prev => ({ ...prev, pickupStop: idx, dropStop: -1 }))
                                      } else if (idx !== booking.pickupStop) {
                                        // Set drop stop
                                        const newPickup = Math.min(booking.pickupStop, idx)
                                        const newDrop = Math.max(booking.pickupStop, idx)
                                        setBooking(prev => ({ ...prev, pickupStop: newPickup, dropStop: newDrop }))
                                      }
                                    }}
                                  >
                                    <motion.div
                                      className={`relative z-10 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                                        isPickup
                                          ? 'bg-emerald-500 border-emerald-500'
                                          : isDrop
                                          ? 'bg-orange-500 border-orange-500'
                                          : isBetween
                                          ? 'bg-emerald-200 border-emerald-400 dark:bg-emerald-800 dark:border-emerald-600'
                                          : 'bg-white dark:bg-card border-muted-foreground/30 group-hover:border-emerald-400'
                                      }`}
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      {isSelected && (
                                        <CheckCircle2 className="h-3 w-3 text-white" />
                                      )}
                                    </motion.div>
                                    <div className="flex-1">
                                      <span className={`text-sm ${
                                        isSelected ? 'font-bold' : isBetween ? 'font-medium' : ''
                                      }`}>
                                        {stop}
                                      </span>
                                      {isPickup && (
                                        <span className="ml-2 text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                                          পিকআপ
                                        </span>
                                      )}
                                      {isDrop && (
                                        <span className="ml-2 text-[10px] text-orange-600 bg-orange-50 dark:bg-orange-950 px-1.5 py-0.5 rounded">
                                          ড্রপ
                                        </span>
                                      )}
                                    </div>
                                    {idx < booking.route.stops.length - 1 && (
                                      <span className="text-[10px] text-muted-foreground">
                                        ₹{toBengaliNum(booking.route.fares[idx + 1] - booking.route.fares[idx])}
                                      </span>
                                    )}
                                  </button>

                                  {/* Fare segment line */}
                                  {idx < booking.route.stops.length - 1 && (
                                    <div className="flex items-center gap-3 pl-2.5 pb-1">
                                      <div className={`w-5 flex justify-center ${
                                        isBetween ? '' : ''
                                      }`}>
                                        <div className={`w-0.5 h-3 ${
                                          isBetween ? 'bg-emerald-400' : 'bg-muted-foreground/20'
                                        }`} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {booking.pickupStop < 0 && (
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            পিকআপ স্টপ নির্বাচন করুন
                          </p>
                        )}
                        {booking.pickupStop >= 0 && booking.dropStop < 0 && (
                          <p className="text-xs text-center text-emerald-600 mt-2">
                            এখন ড্রপ স্টপ নির্বাচন করুন
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Fare and Seats */}
                  {booking.pickupStop >= 0 && booking.dropStop >= 0 && (
                    <>
                      <Card className="border-0 shadow-md">
                        <CardContent className="p-4 space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-emerald-600" />
                            ভাড়া বিবরণ
                          </h4>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">পিকআপ</span>
                              <span className="font-medium">{booking.route?.stops[booking.pickupStop]}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">ড্রপ</span>
                              <span className="font-medium">{booking.route?.stops[booking.dropStop]}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">প্রতি আসন ভাড়া</span>
                              <span>₹{toBengaliNum(segmentFare)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">আসন সংখ্যা</span>
                              <div className="flex items-center gap-2">
                                <button
                                  className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm hover:bg-muted"
                                  onClick={() => setBooking(prev => ({ ...prev, seats: Math.max(1, prev.seats - 1) }))}
                                >
                                  −
                                </button>
                                <span className="font-bold w-6 text-center">{toBengaliNum(booking.seats)}</span>
                                <button
                                  className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm hover:bg-muted"
                                  onClick={() => {
                                    const maxSeats = booking.tempo?.availableSeats || 6
                                    setBooking(prev => ({ ...prev, seats: Math.min(maxSeats, prev.seats + 1) }))
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-base">
                              <span>মোট ভাড়া</span>
                              <span className="text-emerald-600">₹{toBengaliNum(segmentFare * booking.seats)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Tempo info if selected */}
                      {booking.tempo && (
                        <Card className="border-0 shadow-md">
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                              <Truck className="h-4 w-4 text-emerald-600" />
                              টেম্পো তথ্য
                            </h4>
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-lg">
                                  {vehicleEmoji[booking.tempo.vehicleType] || '🛺'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-medium text-sm">{booking.tempo.driverName}</div>
                                <div className="text-xs text-muted-foreground">{booking.tempo.vehicleNumber}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-emerald-600">
                                  {toBengaliNum(booking.tempo.availableSeats)}/{toBengaliNum(booking.tempo.totalSeats)} আসন খালি
                                </div>
                                <div className="text-[10px] text-muted-foreground">{booking.tempo.departureTime}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Confirm Button */}
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-bold"
                        onClick={handleConfirmBooking}
                      >
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        ₹{toBengaliNum(segmentFare * booking.seats)} - বুকিং নিশ্চিত করুন
                      </Button>
                    </>
                  )}
                </>
              ) : (
                /* Booking Confirmed View */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center pt-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </motion.div>

                  <h3 className="text-xl font-bold mb-1">বুকিং নিশ্চিত!</h3>
                  <p className="text-sm text-muted-foreground mb-6">আপনার আসন সংরক্ষিত হয়েছে</p>

                  <Card className="border-0 shadow-md text-left">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">রুট</span>
                        <span className="text-sm font-medium">{booking.route?.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">পিকআপ</span>
                        <span className="text-sm font-medium">{booking.route?.stops[booking.pickupStop]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">ড্রপ</span>
                        <span className="text-sm font-medium">{booking.route?.stops[booking.dropStop]}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">আসন</span>
                        <span className="text-sm font-bold">{toBengaliNum(booking.seats)} টি</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">মোট ভাড়া</span>
                        <span className="text-sm font-bold text-emerald-600">₹{toBengaliNum(segmentFare * booking.seats)}</span>
                      </div>
                      {booking.tempo && (
                        <>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">চালক</span>
                            <span className="text-sm font-medium">{booking.tempo.driverName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">ছাড়ার সময়</span>
                            <span className="text-sm font-medium">{booking.tempo.departureTime}</span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <div className="mt-6 space-y-2">
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        setBooking({
                          route: null,
                          tempo: null,
                          pickupStop: -1,
                          dropStop: -1,
                          seats: 1,
                          confirmed: false,
                        })
                        setViewMode('routes')
                      }}
                    >
                      অন্য যাত্রা খুঁজুন
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={onBack}
                    >
                      হোমে ফিরুন
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* My Rides View */}
          {viewMode === 'my-rides' && (
            <motion.div
              key="my-rides"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              {MOCK_MY_RIDES.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">কোনো আসন্ন শেয়ার যাত্রা নেই</p>
                  <Button
                    variant="outline"
                    className="mt-4 text-emerald-600"
                    onClick={() => setViewMode('routes')}
                  >
                    যাত্রা খুঁজুন
                  </Button>
                </div>
              ) : (
                MOCK_MY_RIDES.map((ride, idx) => (
                  <motion.div
                    key={ride.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="border-0 shadow-md overflow-hidden">
                      <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-orange-500" />
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-sm">{ride.routeName}</h4>
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-[10px]">
                            {ride.status === 'UPCOMING' ? 'আসন্ন' : 'সম্পন্ন'}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2">
                            <CircleDot className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span className="text-sm">{ride.pickup}</span>
                          </div>
                          <div className="ml-2 border-l-2 border-dashed border-muted h-3" />
                          <div className="flex items-center gap-2">
                            <CircleDot className="h-4 w-4 text-orange-500 shrink-0" />
                            <span className="text-sm">{ride.drop}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg text-xs">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="font-medium">{ride.departureTime}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{toBengaliNum(ride.seatsBooked)} আসন</span>
                          </div>
                          <div className="flex items-center gap-1 font-bold text-emerald-600">
                            <IndianRupee className="h-3.5 w-3.5" />
                            {toBengaliNum(ride.fare * ride.seatsBooked)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <span>চালক: {ride.driverName}</span>
                          <span>•</span>
                          <span>{ride.vehicleNumber}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
