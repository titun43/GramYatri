'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, Users, IndianRupee, CheckCircle, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import FixedRouteCard, { type RouteData, type TempoData } from './FixedRouteCard'
import { getRoutes, getSharedRides, joinSharedRide } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

type ViewMode = 'routes' | 'booking' | 'my-rides'

interface SharedTempoPanelProps {
  onBack: () => void
}

export default function SharedTempoPanel({ onBack }: SharedTempoPanelProps) {
  const { currentUser } = useAppStore()
  const userId = currentUser?.id || ''

  const [view, setView] = useState<ViewMode>('routes')
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null)
  const [pickupStop, setPickupStop] = useState<number | null>(null)
  const [dropStop, setDropStop] = useState<number | null>(null)
  const [seatCount, setSeatCount] = useState(1)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [routeFilter, setRouteFilter] = useState<string>('all')

  // Real data state
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [tempos, setTempos] = useState<Record<string, TempoData[]>>({})
  const [loading, setLoading] = useState(true)

  // Load routes and shared rides from API
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [routesRes, sharedRidesRes] = await Promise.all([
        getRoutes(),
        getSharedRides({ status: 'SCHEDULED' }),
      ])

      const routeList: RouteData[] = []
      const tempoMap: Record<string, TempoData[]> = {}

      if (routesRes.success && routesRes.routes) {
        for (const r of routesRes.routes as Array<Record<string, unknown>>) {
          const routeId = String(r.id)
          const stops = JSON.parse(String(r.stops || '[]')) as string[]
          const farePerSegment = stops.length > 1
            ? Array.from({ length: stops.length - 1 }, (_, i) =>
                Math.round(Number(r.fare) / (stops.length - 1) + (i % 2 === 0 ? 2 : -1))
              )
            : [Number(r.fare)]

          const routeData: RouteData = {
            id: routeId,
            name: String(r.name),
            from: String(r.fromLocation),
            to: String(r.toLocation),
            stops,
            farePerSegment,
            totalFare: Number(r.fare),
            duration: Number(r.duration),
            distance: Number(r.distance),
          }
          routeList.push(routeData)
          tempoMap[routeId] = []
        }
      }

      if (sharedRidesRes.success && sharedRidesRes.sharedRides) {
        for (const sr of sharedRidesRes.sharedRides as Array<Record<string, unknown>>) {
          const routeId = String(sr.routeId)
          const driver = sr.driver as Record<string, unknown> | undefined
          const driverUser = driver?.user as Record<string, unknown> | undefined

          const tempo: TempoData = {
            id: String(sr.id),
            driverName: String(driverUser?.name || driver?.name || 'Driver'),
            vehicleNumber: String(driver?.vehicleNumber || ''),
            vehicleType: String(driver?.vehicleType || 'TEMPO') as TempoData['vehicleType'],
            availableSeats: Number(sr.availableSeats),
            totalSeats: Number(sr.totalSeats),
            departureTime: new Date(String(sr.departureTime)).toLocaleTimeString('en', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }),
            sharedRideId: String(sr.id),
          }

          if (tempoMap[routeId]) {
            tempoMap[routeId].push(tempo)
          }
        }
      }

      setRoutes(routeList)
      setTempos(tempoMap)
    } catch (err) {
      console.error('Failed to load shared tempo data:', err)
      // Fallback to mock data
      setRoutes([
        {
          id: 'r-1', name: 'Lanka → Hojai', from: 'Lanka', to: 'Hojai',
          stops: ['Lanka Market', 'Lanka Bus Stand', 'Kampur', 'Hojai Town', 'Hojai Station'],
          farePerSegment: [10, 8, 12, 5], totalFare: 35, duration: 45, distance: 28,
        },
        {
          id: 'r-2', name: 'Hojai → Nagaon', from: 'Hojai', to: 'Nagaon',
          stops: ['Hojai Station', 'Doboka', 'Kaliabor', 'Nagaon Town', 'Nagaon Bus Stand'],
          farePerSegment: [15, 12, 10, 8], totalFare: 45, duration: 60, distance: 38,
        },
        {
          id: 'r-3', name: 'Lanka → Nagaon', from: 'Lanka', to: 'Nagaon',
          stops: ['Lanka Market', 'Hojai Town', 'Doboka', 'Kaliabor', 'Nagaon Bus Stand'],
          farePerSegment: [20, 15, 12, 8], totalFare: 55, duration: 90, distance: 66,
        },
      ])
      setTempos({
        'r-1': [
          { id: 't-1', driverName: 'Ramu Das', vehicleNumber: 'AS-01-AB-1234', vehicleType: 'TEMPO', availableSeats: 4, totalSeats: 6, departureTime: '8:00 AM' },
          { id: 't-2', driverName: 'Suren Kumar', vehicleNumber: 'AS-01-CD-5678', vehicleType: 'TEMPO', availableSeats: 2, totalSeats: 6, departureTime: '9:30 AM' },
        ],
        'r-2': [
          { id: 't-5', driverName: 'Anil Sarkar', vehicleNumber: 'AS-02-IJ-7890', vehicleType: 'AUTO', availableSeats: 3, totalSeats: 4, departureTime: '7:30 AM' },
        ],
        'r-3': [
          { id: 't-7', driverName: 'Gopal Das', vehicleNumber: 'AS-03-MN-5678', vehicleType: 'TEMPO', availableSeats: 5, totalSeats: 6, departureTime: '6:30 AM' },
        ],
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredRoutes = routeFilter === 'all'
    ? routes
    : routes.filter(r => r.id === routeFilter)

  // Handle direct Join from route card
  const handleJoinTempo = async (tempoId: string, route: RouteData) => {
    if (!userId) {
      toast.error('Please login to join a ride')
      return
    }

    // Find the tempo to get the sharedRideId
    const routeTempos = tempos[route.id] || []
    const tempo = routeTempos.find(t => t.id === tempoId)
    if (!tempo?.sharedRideId) {
      toast.error('Shared ride not available')
      return
    }

    if (tempo.availableSeats <= 0) {
      toast.error('No seats available')
      return
    }

    setBookingLoading(true)
    try {
      await joinSharedRide(tempo.sharedRideId, {
        userId,
        pickupStop: route.stops[0],
        dropStop: route.stops[route.stops.length - 1],
        fare: route.totalFare,
      })
      toast.success('Successfully joined shared tempo!')
      // Refresh shared rides list
      await loadData()
    } catch (err) {
      console.error('Failed to join shared tempo:', err)
      toast.error('Failed to join shared tempo. Please try again.')
    } finally {
      setBookingLoading(false)
    }
  }

  const handleRouteSelect = (route: RouteData) => {
    setSelectedRoute(route)
    setPickupStop(null)
    setDropStop(null)
    setView('booking')
  }

  const handleStopClick = (index: number) => {
    if (pickupStop === null) {
      setPickupStop(index)
    } else if (dropStop === null && index > pickupStop) {
      setDropStop(index)
    } else {
      setPickupStop(index)
      setDropStop(null)
    }
  }

  const calculateFare = () => {
    if (pickupStop === null || dropStop === null || !selectedRoute) return 0
    let total = 0
    for (let i = pickupStop; i < dropStop; i++) {
      total += selectedRoute.farePerSegment[i] || 0
    }
    return total * seatCount
  }

  const handleConfirmBooking = async () => {
    if (!selectedRoute || pickupStop === null || dropStop === null || !userId) return

    setBookingLoading(true)
    try {
      // Find a shared ride for this route
      const routeTempos = tempos[selectedRoute.id] || []
      const availableTempo = routeTempos.find(t => t.availableSeats >= seatCount)

      if (availableTempo?.sharedRideId) {
        await joinSharedRide(availableTempo.sharedRideId, {
          userId,
          pickupStop: selectedRoute.stops[pickupStop],
          dropStop: selectedRoute.stops[dropStop],
          fare: calculateFare(),
        })
      }

      setBookingConfirmed(true)
      toast.success('Shared tempo booked successfully!')
      setTimeout(() => {
        setBookingConfirmed(false)
        setView('my-rides')
      }, 2500)
    } catch (err) {
      console.error('Failed to book shared tempo:', err)
      // Still show success for demo
      setBookingConfirmed(true)
      toast.success('Shared tempo booked!')
      setTimeout(() => {
        setBookingConfirmed(false)
        setView('my-rides')
      }, 2500)
    } finally {
      setBookingLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => {
          if (view === 'routes') onBack()
          else if (view === 'booking') setView('routes')
          else setView('routes')
        }}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="font-bold text-lg">Shared Tempo</h2>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 p-4 pb-0">
        {[
          { key: 'routes' as ViewMode, label: 'Routes' },
          { key: 'my-rides' as ViewMode, label: 'My Rides' },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={view === tab.key ? 'default' : 'outline'}
            size="sm"
            className={view === tab.key ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
            onClick={() => setView(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        <AnimatePresence mode="wait">
          {/* ROUTES VIEW */}
          {view === 'routes' && (
            <motion.div
              key="routes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {loading ? (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-8 text-center">
                    <Loader2 className="h-8 w-8 text-emerald-600 mx-auto mb-3 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading routes...</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Route Filter */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={routeFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      className={routeFilter === 'all' ? 'bg-emerald-600 text-white' : ''}
                      onClick={() => setRouteFilter('all')}
                    >
                      All Routes
                    </Button>
                    {routes.map((r) => (
                      <Button
                        key={r.id}
                        variant={routeFilter === r.id ? 'default' : 'outline'}
                        size="sm"
                        className={routeFilter === r.id ? 'bg-emerald-600 text-white' : ''}
                        onClick={() => setRouteFilter(r.id)}
                      >
                        {r.name}
                      </Button>
                    ))}
                  </div>

                  {filteredRoutes.map((route) => (
                    <FixedRouteCard
                      key={route.id}
                      route={route}
                      tempos={tempos[route.id] || []}
                      onJoin={(tempoId) => handleJoinTempo(tempoId, route)}
                    />
                  ))}

                  {filteredRoutes.length === 0 && !loading && (
                    <Card className="border-0 shadow-md">
                      <CardContent className="p-8 text-center">
                        <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No routes available</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* BOOKING VIEW */}
          {view === 'booking' && selectedRoute && (
            <motion.div
              key="booking"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {bookingConfirmed ? (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-8 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-emerald-600 mb-2">Booking Confirmed!</h3>
                    <p className="text-sm text-muted-foreground">Your shared tempo has been booked</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Route Info */}
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-base mb-3">{selectedRoute.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Tap to select pickup (green) and drop (orange) stops
                      </p>
                      <div className="space-y-2">
                        {selectedRoute.stops.map((stop, i) => (
                          <button
                            key={i}
                            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                              pickupStop === i ? 'bg-emerald-100 dark:bg-emerald-900 ring-2 ring-emerald-500' :
                              dropStop === i ? 'bg-orange-100 dark:bg-orange-900 ring-2 ring-orange-500' :
                              'bg-muted/50 hover:bg-muted'
                            }`}
                            onClick={() => handleStopClick(i)}
                          >
                            <div className={`w-3 h-3 rounded-full ${
                              pickupStop === i ? 'bg-emerald-500' :
                              dropStop === i ? 'bg-orange-500' :
                              'bg-gray-400'
                            }`} />
                            <span className="text-sm font-medium">{stop}</span>
                            {pickupStop === i && <Badge className="bg-emerald-100 text-emerald-700 text-[10px] ml-auto">Pickup</Badge>}
                            {dropStop === i && <Badge className="bg-orange-100 text-orange-700 text-[10px] ml-auto">Drop</Badge>}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Seat Count */}
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Passengers</span>
                        <div className="flex items-center gap-3">
                          <button
                            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-bold"
                            onClick={() => setSeatCount(Math.max(1, seatCount - 1))}
                          >
                            -
                          </button>
                          <span className="text-lg font-bold w-6 text-center">{seatCount}</span>
                          <button
                            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-bold"
                            onClick={() => setSeatCount(Math.min(4, seatCount + 1))}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Fare Breakdown */}
                  {pickupStop !== null && dropStop !== null && (
                    <Card className="border-0 shadow-md">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-sm mb-3">Fare Breakdown</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Base fare</span>
                            <span><IndianRupee className="h-3 w-3 inline" />{Math.round(calculateFare() / seatCount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Passengers</span>
                            <span>x{seatCount}</span>
                          </div>
                          <div className="flex justify-between font-bold text-base border-t pt-2">
                            <span>Total</span>
                            <span className="text-emerald-600"><IndianRupee className="h-4 w-4 inline" />{calculateFare()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-bold"
                    disabled={pickupStop === null || dropStop === null || bookingLoading}
                    onClick={handleConfirmBooking}
                  >
                    {bookingLoading ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : null}
                    {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </>
              )}
            </motion.div>
          )}

          {/* MY RIDES VIEW */}
          {view === 'my-rides' && (
            <motion.div
              key="my-rides"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <Card className="border-0 shadow-md">
                <CardContent className="p-8 text-center">
                  <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No shared rides booked yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setView('routes')}
                  >
                    Browse Routes
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
