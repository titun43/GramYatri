'use client'

import { motion } from 'framer-motion'
import { MapPin, Users, Clock, IndianRupee } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Ride } from '@/lib/store'

interface SharedRideCardProps {
  ride: Ride
  onJoin?: () => void
  passengerCount?: number
  maxPassengers?: number
}

const vehicleEmojis: Record<string, string> = {
  TEMPO: '🛺',
  AUTO: '🚗',
  E_RICKSHAW: '🛵',
}

const vehicleLabels: Record<string, string> = {
  TEMPO: 'Tempo',
  AUTO: 'Auto',
  E_RICKSHAW: 'E-Rickshaw',
}

export default function SharedRideCard({ ride, onJoin, passengerCount = 3, maxPassengers = 6 }: SharedRideCardProps) {
  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{vehicleEmojis[ride.vehicleType] || '🛺'}</span>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                Shared {vehicleLabels[ride.vehicleType] || 'Ride'}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-emerald-600">
              <IndianRupee className="h-3.5 w-3.5" />
              {ride.fare}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="w-0.5 h-4 bg-muted" />
              <div className="w-2 h-2 rounded-full bg-orange-500" />
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-sm font-medium">{ride.pickup}</span>
              <p className="text-sm text-muted-foreground">{ride.drop}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {passengerCount}/{maxPassengers}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {ride.distance} km
              </span>
            </div>
            {onJoin && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                onClick={onJoin}
              >
                Join
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
