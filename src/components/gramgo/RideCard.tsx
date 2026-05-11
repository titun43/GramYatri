'use client'

import { motion } from 'framer-motion'
import { MapPin, Phone, Star, Clock, IndianRupee, Navigation, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Ride } from '@/lib/store'

interface RideCardProps {
  ride: Ride
  variant?: 'active' | 'history' | 'incoming'
  onAction?: (action: string, rideId: string) => void
  onRate?: (rideId: string, rating: number) => void
}

const statusLabels: Record<string, { label: string; color: string }> = {
  SEARCHING: { label: 'খোঁজা হচ্ছে', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  ACCEPTED: { label: 'গৃহীত', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  IN_PROGRESS: { label: 'চলমান', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  COMPLETED: { label: 'সম্পন্ন', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  CANCELLED: { label: 'বাতিল', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
}

const vehicleEmoji: Record<string, string> = {
  TEMPO: '🛺',
  AUTO: '🚗',
  E_RICKSHAW: '🛵',
}

export default function RideCard({ ride, variant = 'history', onAction, onRate }: RideCardProps) {
  const status = statusLabels[ride.status] || statusLabels.SEARCHING

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`border-0 shadow-md overflow-hidden ${variant === 'active' ? 'ring-2 ring-emerald-500' : ''}`}>
        {variant === 'active' && (
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-400 animate-pulse" />
        )}
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{vehicleEmoji[ride.vehicleType] || '🛺'}</span>
              <Badge className={status.color} variant="secondary">
                {status.label}
              </Badge>
            </div>
            <div className="flex items-center gap-1 font-bold text-lg">
              <IndianRupee className="h-4 w-4" />
              {ride.fare}
            </div>
          </div>

          {/* Route */}
          <div className="space-y-2 mb-3">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span className="text-sm">{ride.pickup}</span>
            </div>
            <div className="ml-2 border-l-2 border-dashed border-muted h-3" />
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
              <span className="text-sm">{ride.drop}</span>
            </div>
          </div>

          {/* Active ride: Driver/Rider info */}
          {(variant === 'active' || variant === 'incoming') && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-emerald-100 text-emerald-700">
                  {(ride.driverName || ride.userName || '?')[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium text-sm">{ride.driverName || ride.userName || 'অজানা'}</div>
                <div className="text-xs text-muted-foreground">{ride.driverVehicle || ride.vehicleType}</div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <span>4.5</span>
              </div>
            </div>
          )}

          {/* Actions */}
          {variant === 'active' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onAction?.('call', ride.id)}
              >
                <Phone className="h-4 w-4 mr-1" />
                কল
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onAction?.('navigate', ride.id)}
              >
                <Navigation className="h-4 w-4 mr-1" />
                নেভিগেট
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => onAction?.('emergency', ride.id)}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                জরুরি
              </Button>
            </div>
          )}

          {variant === 'incoming' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onAction?.('accept', ride.id)}
              >
                গ্রহণ
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => onAction?.('reject', ride.id)}
              >
                প্রত্যাখ্যান
              </Button>
            </div>
          )}

          {/* History: Date and rating */}
          {variant === 'history' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{new Date(ride.createdAt).toLocaleDateString('bn-IN')}</span>
              </div>
              {ride.status === 'COMPLETED' && !ride.rating && onRate && (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => onRate(ride.id, s)}
                      className="p-0.5 hover:scale-125 transition-transform"
                    >
                      <Star className="h-4 w-4 text-yellow-400 hover:fill-yellow-400" />
                    </button>
                  ))}
                </div>
              )}
              {ride.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-medium">{ride.rating}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
