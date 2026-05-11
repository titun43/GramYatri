'use client'

import { motion } from 'framer-motion'
import { MapPin, Clock, Users, IndianRupee } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Ride } from '@/lib/store'

interface SharedRideCardProps {
  ride: Ride
  onJoin?: (rideId: string) => void
}

const vehicleEmoji: Record<string, string> = {
  TEMPO: '🛺',
  AUTO: '🚗',
  E_RICKSHAW: '🛵',
}

const vehicleLabel: Record<string, string> = {
  TEMPO: 'টেম্পো',
  AUTO: 'অটো',
  E_RICKSHAW: 'ই-রিক্শা',
}

export default function SharedRideCard({ ride, onJoin }: SharedRideCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-orange-500" />
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{vehicleEmoji[ride.vehicleType] || '🛺'}</span>
              <div>
                <span className="font-semibold text-sm">{vehicleLabel[ride.vehicleType] || 'টেম্পো'}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>শেয়ার করা যাত্রা</span>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              <IndianRupee className="h-3 w-3 mr-1" />
              ₹{ride.fare}
            </Badge>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex items-start gap-2">
              <div className="mt-1">
                <MapPin className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-sm line-clamp-1">{ride.pickup}</span>
            </div>
            <div className="ml-2 border-l-2 border-dashed border-muted h-3" />
            <div className="flex items-start gap-2">
              <div className="mt-1">
                <MapPin className="h-4 w-4 text-orange-500" />
              </div>
              <span className="text-sm line-clamp-1">{ride.drop}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{ride.distance} কিমি</span>
            </div>
            {onJoin && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onJoin(ride.id)}
              >
                যোগ দিন
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
