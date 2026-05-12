'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Clock, IndianRupee, Users, ChevronDown,
  ChevronUp, Truck, Bus, Bike, ArrowRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export interface RouteData {
  id: string
  name: string
  from: string
  to: string
  stops: string[]
  fares: number[]
  distance: number
  duration: number
  availableTempos: number
  nextDeparture: string
}

export interface TempoData {
  id: string
  routeId: string
  driverName: string
  vehicleNumber: string
  vehicleType: 'TEMPO' | 'AUTO' | 'E_RICKSHAW'
  totalSeats: number
  availableSeats: number
  departureTime: string
  currentStop: number
}

interface FixedRouteCardProps {
  route: RouteData
  tempos?: TempoData[]
  onSelectTempo?: (tempo: TempoData, route: RouteData) => void
  onSelectRoute?: (route: RouteData) => void
}

const vehicleEmoji: Record<string, string> = {
  TEMPO: '🛺',
  AUTO: '🚗',
  E_RICKSHAW: '🛵',
}

const vehicleIcon: Record<string, React.ReactNode> = {
  TEMPO: <Truck className="h-3.5 w-3.5" />,
  AUTO: <Bus className="h-3.5 w-3.5" />,
  E_RICKSHAW: <Bike className="h-3.5 w-3.5" />,
}

function toBengaliNum(num: number): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return num.toString().split('').map(d => bengaliDigits[parseInt(d)] || d).join('')
}

export default function FixedRouteCard({ route, tempos = [], onSelectTempo, onSelectRoute }: FixedRouteCardProps) {
  const [expanded, setExpanded] = useState(false)

  const routeTempos = tempos.filter(t => t.routeId === route.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="border-0 shadow-md overflow-hidden">
        {/* Header gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-orange-500" />

        <CardContent className="p-4">
          {/* Route Header */}
          <button
            className="w-full text-left"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-bold text-sm mb-1">{route.name}</h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 text-emerald-500" />
                  <span>{route.from}</span>
                  <ArrowRight className="h-3 w-3" />
                  <MapPin className="h-3 w-3 text-orange-500" />
                  <span>{route.to}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  <Users className="h-3 w-3 mr-1" />
                  {toBengaliNum(route.availableTempos)}
                </Badge>
                <motion.div
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </div>
            </div>
          </button>

          {/* Route Info Pills */}
          <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{toBengaliNum(route.duration)} মি.</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{toBengaliNum(route.distance)} কিমি</span>
            </div>
            <div className="flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              <span>₹{toBengaliNum(route.fares[route.fares.length - 1])} পর্যন্ত</span>
            </div>
          </div>

          {/* Metro-style Route Visualization */}
          <div className="relative pl-2">
            {/* Vertical line connecting stops */}
            <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-emerald-500 via-emerald-400 to-orange-500" />

            <div className="space-y-0">
              {route.stops.map((stop, idx) => {
                const isFirst = idx === 0
                const isLast = idx === route.stops.length - 1
                const segmentFare = idx > 0 ? route.fares[idx] - route.fares[idx - 1] : 0

                return (
                  <div key={idx} className="relative">
                    {/* Stop dot and name */}
                    <div className="flex items-center gap-3 py-2">
                      <motion.div
                        className={`relative z-10 w-3 h-3 rounded-full border-2 shrink-0 ${
                          isFirst
                            ? 'bg-emerald-500 border-emerald-500'
                            : isLast
                            ? 'bg-orange-500 border-orange-500'
                            : 'bg-white dark:bg-card border-emerald-400'
                        }`}
                        whileHover={{ scale: 1.4 }}
                        transition={{ duration: 0.15 }}
                      >
                        {/* Pulse animation for endpoints */}
                        {(isFirst || isLast) && (
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                              backgroundColor: isFirst ? '#10b981' : '#f97316',
                            }}
                            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          />
                        )}
                      </motion.div>
                      <span className={`text-xs ${isFirst || isLast ? 'font-bold' : 'font-medium'}`}>
                        {stop}
                      </span>
                    </div>

                    {/* Fare between stops */}
                    {!isLast && segmentFare > 0 && (
                      <div className="flex items-center gap-3 pl-3 pb-1">
                        <div className="w-3 flex justify-center">
                          <div className="w-0.5 h-2 bg-muted-foreground/20" />
                        </div>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <IndianRupee className="h-2.5 w-2.5" />
                          {toBengaliNum(segmentFare)}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Next departure info */}
          <div className="mt-3 flex items-center justify-between bg-muted/50 rounded-lg p-2.5">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-medium">পরবর্তী ছাড়:</span>
              <span className="text-emerald-600 font-bold">{route.nextDeparture}</span>
            </div>
          </div>

          {/* Expanded: Available Tempos */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-border">
                  <h5 className="text-xs font-semibold mb-2 flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5" />
                    উপলব্ধ টেম্পো
                  </h5>

                  {routeTempos.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">এই রুটে বর্তমানে কোনো টেম্পো নেই</p>
                  ) : (
                    <div className="space-y-2">
                      {routeTempos.map((tempo) => (
                        <motion.div
                          key={tempo.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg"
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-sm">
                              {vehicleEmoji[tempo.vehicleType] || '🛺'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold truncate">{tempo.driverName}</span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                                {vehicleIcon[tempo.vehicleType]}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">{tempo.vehicleNumber}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-emerald-600">
                              {toBengaliNum(tempo.availableSeats)}/{toBengaliNum(tempo.totalSeats)} আসন খালি
                            </div>
                            <div className="text-[10px] text-muted-foreground">{tempo.departureTime}</div>
                          </div>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-[11px] px-3"
                            onClick={() => onSelectTempo?.(tempo, route)}
                          >
                            যোগ দিন
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* View route details button */}
                  <Button
                    variant="outline"
                    className="w-full mt-3 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950"
                    onClick={() => onSelectRoute?.(route)}
                  >
                    রুট বিস্তারিত দেখুন
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expand toggle button */}
          {!expanded && (
            <button
              className="w-full mt-2 flex items-center justify-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 py-1"
              onClick={() => setExpanded(true)}
            >
              <span>টেম্পো দেখুন</span>
              <ChevronUp className="h-3 w-3 rotate-180" />
            </button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
