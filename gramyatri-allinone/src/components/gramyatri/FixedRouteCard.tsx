'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, MapPin, ChevronDown, ChevronUp, Users, IndianRupee } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export interface RouteData {
  id: string
  name: string
  from: string
  to: string
  stops: string[]
  farePerSegment: number[]
  totalFare: number
  duration: number
  distance: number
}

export interface TempoData {
  id: string
  driverName: string
  vehicleNumber: string
  vehicleType: string
  availableSeats: number
  totalSeats: number
  departureTime: string
  sharedRideId?: string
}

interface FixedRouteCardProps {
  route: RouteData
  tempos?: TempoData[]
  onJoin?: (tempoId: string) => void
}

export default function FixedRouteCard({ route, tempos = [], onJoin }: FixedRouteCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardContent className="p-0">
        {/* Route Header */}
        <button
          className="w-full p-4 flex items-center justify-between"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-500 to-orange-500" />
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm">{route.name}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <Clock className="h-3 w-3" />
                {route.duration} min
                <MapPin className="h-3 w-3 ml-1" />
                {route.distance} km
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-bold text-emerald-600">
                <IndianRupee className="h-3.5 w-3.5 inline" />
                {route.totalFare}
              </div>
              <div className="text-[10px] text-muted-foreground">max fare</div>
            </div>
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        {/* Expanded: Stops & Tempos */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3 border-t pt-3">
                {/* Stops */}
                <div className="space-y-2">
                  {route.stops.map((stop, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          i === 0 ? 'bg-emerald-500' :
                          i === route.stops.length - 1 ? 'bg-orange-500' :
                          'bg-gray-400'
                        }`} />
                        {i < route.stops.length - 1 && (
                          <div className="w-0.5 h-4 bg-muted" />
                        )}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm">{stop}</span>
                        {i < route.farePerSegment.length && (
                          <span className="text-xs text-muted-foreground">
                            <IndianRupee className="h-3 w-3 inline" />
                            {route.farePerSegment[i]}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Available Tempos */}
                {tempos.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Available Tempos
                    </h5>
                    {tempos.map((tempo) => (
                      <div key={tempo.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                        <div>
                          <div className="text-sm font-medium">{tempo.driverName}</div>
                          <div className="text-xs text-muted-foreground">
                            {tempo.vehicleNumber} &bull; {tempo.departureTime}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs">
                            <Users className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">{tempo.availableSeats}/{tempo.totalSeats}</span>
                          </div>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                            onClick={() => onJoin?.(tempo.id)}
                            disabled={tempo.availableSeats === 0}
                          >
                            Join
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
