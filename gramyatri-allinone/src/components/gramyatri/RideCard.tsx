'use client'

import { motion } from 'framer-motion'
import { MapPin, Phone, Star, Clock, Navigation, CheckCircle, XCircle, AlertTriangle, IndianRupee, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Ride } from '@/lib/store'

interface RideCardProps {
  ride: Ride
  variant: 'active' | 'history' | 'incoming'
  onAction?: (action: string, rideId?: string) => void
  onRate?: (rideId: string, rating: number) => void
}

const vehicleLabels: Record<string, string> = {
  TEMPO: 'Tempo',
  AUTO: 'Auto',
  E_RICKSHAW: 'E-Rickshaw',
}

const vehicleEmojis: Record<string, string> = {
  TEMPO: '🛺',
  AUTO: '🚗',
  E_RICKSHAW: '🛵',
}

const statusConfig: Record<string, { label: string; className: string }> = {
  SEARCHING: { label: 'Searching', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  ACCEPTED: { label: 'Accepted', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' },
  COMPLETED: { label: 'Completed', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
}

export default function RideCard({ ride, variant, onAction, onRate }: RideCardProps) {
  const status = statusConfig[ride.status] || statusConfig.SEARCHING

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 0, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{vehicleEmojis[ride.vehicleType] || '🛺'}</span>
              <Badge className={status.className}>
                {status.label}
              </Badge>
              {ride.paymentMethod === 'WALLET' && (
                <Badge variant="outline" className="text-[10px]">Wallet</Badge>
              )}
            </div>
            <div className="flex items-center gap-1 font-bold text-emerald-600">
              <IndianRupee className="h-4 w-4" />
              {ride.fare}
            </div>
          </div>

          {/* Route */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <div className="w-0.5 h-6 bg-muted" />
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{ride.pickup}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{ride.drop}</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {ride.distance} km
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {vehicleLabels[ride.vehicleType] || ride.vehicleType}
            </span>
            {ride.driverName && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {ride.driverName}
              </span>
            )}
          </div>

          {/* Active Ride Actions */}
          {variant === 'active' && (
            <div className="flex gap-2">
              {onAction && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    onClick={() => onAction('call')}
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    onClick={() => onAction('navigate')}
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Navigate
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 text-xs px-3"
                    onClick={() => onAction('emergency')}
                  >
                    <AlertTriangle className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Incoming Ride Actions */}
          {variant === 'incoming' && onAction && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                onClick={() => onAction('accept', ride.id)}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1 h-8 text-xs"
                onClick={() => onAction('reject', ride.id)}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject
              </Button>
            </div>
          )}

          {/* History Rating */}
          {variant === 'history' && ride.status === 'COMPLETED' && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {ride.driverName || ride.userName || ''}
              </span>
              {ride.rating ? (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3 w-3 ${s <= ride.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              ) : onRate ? (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => onRate(ride.id, s)}>
                      <Star className="h-4 w-4 text-gray-300 hover:text-yellow-500 transition-colors" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
