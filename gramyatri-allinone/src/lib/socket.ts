'use client'

import { io, Socket } from 'socket.io-client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAppStore } from './store'
import type { Ride } from './store'

const SOCKET_PORT = 3003

let socketInstance: Socket | null = null

function getSocket(): Socket {
  if (!socketInstance) {
    try {
      socketInstance = io('/?XTransformPort=' + SOCKET_PORT, {
        transports: ['websocket', 'polling'],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        timeout: 10000,
      })
    } catch (error) {
      console.error('[Socket] Failed to create socket:', error)
      // Return a dummy socket that won't crash
      throw error
    }
  }
  return socketInstance
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const { currentUser, setActiveRide, addIncomingRide, removeIncomingRide, isOnline } = useAppStore()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    try {
      const socket = getSocket()
      socketRef.current = socket

      socket.on('connect', () => {
        setIsConnected(true)
        console.log('[Socket] Connected:', socket.id)

        // Auto-join rooms based on role
        if (currentUser) {
          if (currentUser.role === 'USER') {
            socket.emit('user:connect', { userId: currentUser.id })
          } else if (currentUser.role === 'DRIVER') {
            socket.emit('driver:connect', { driverId: currentUser.id })
            if (isOnline) {
              socket.emit('driver:status', { driverId: currentUser.id, isOnline: true })
            }
          }
        }
      })

      socket.on('disconnect', () => {
        setIsConnected(false)
        console.log('[Socket] Disconnected')
      })

      socket.on('connect_error', (error) => {
        setIsConnected(false)
        console.warn('[Socket] Connection error:', error.message)
      })

      // Listen for new ride requests (driver)
      socket.on('ride:new', (data: {
        rideId: string
        userId: string
        pickupAddress: string
        dropAddress: string
        fare: number
        vehicleType?: string
      }) => {
        console.log('[Socket] New ride request:', data)
        const newRide: Ride = {
          id: data.rideId,
          userId: data.userId,
          pickup: data.pickupAddress,
          drop: data.dropAddress,
          vehicleType: (data.vehicleType as Ride['vehicleType']) || 'TEMPO',
          fare: data.fare,
          baseFare: 0,
          distanceFare: 0,
          distance: 0,
          status: 'SEARCHING',
          paymentMethod: 'CASH',
          createdAt: new Date().toISOString(),
        }
        addIncomingRide(newRide)
      })

      // Listen for ride accepted (user)
      socket.on('ride:accepted', (data: { rideId: string; driverId: string }) => {
        console.log('[Socket] Ride accepted:', data)
      })

      // Listen for ride taken (driver - another driver accepted)
      socket.on('ride:taken', (data: { rideId: string }) => {
        console.log('[Socket] Ride taken by another driver:', data.rideId)
        removeIncomingRide(data.rideId)
      })

      // Listen for ride arriving
      socket.on('ride:arriving', (data: { rideId: string }) => {
        console.log('[Socket] Driver arriving for ride:', data.rideId)
      })

      // Listen for ride started
      socket.on('ride:started', (data: { rideId: string }) => {
        console.log('[Socket] Ride started:', data.rideId)
      })

      // Listen for ride completed
      socket.on('ride:completed', (data: { rideId: string; fare: number }) => {
        console.log('[Socket] Ride completed:', data.rideId)
      })

      // Listen for ride cancelled
      socket.on('ride:cancelled', (data: { rideId: string }) => {
        console.log('[Socket] Ride cancelled:', data.rideId)
        // Clear active ride if it matches
        const { activeRide } = useAppStore.getState()
        if (activeRide?.id === data.rideId) {
          setActiveRide(null)
        }
      })

      // Driver location updates
      socket.on('driver:location:update', (data: { driverId: string; lat: number; lng: number }) => {
        // Can be used for map updates
      })

      // Emergency alerts
      socket.on('emergency:triggered', (data: { userId: string; rideId: string }) => {
        console.log('[Socket] EMERGENCY ALERT:', data)
      })

      // Notification broadcasts
      socket.on('notification:broadcast', (data: { title: string; message: string }) => {
        const { addNotification } = useAppStore.getState()
        addNotification({
          id: `notif-${Date.now()}`,
          title: data.title,
          message: data.message,
          type: 'INFO',
          createdAt: new Date().toISOString(),
          read: false,
        })
      })

      // Shared ride passenger joined
      socket.on('shared:passenger-joined', (data: { userId: string }) => {
        console.log('[Socket] Passenger joined shared ride:', data.userId)
      })

      return () => {
        socket.off('connect')
        socket.off('disconnect')
        socket.off('connect_error')
        socket.off('ride:new')
        socket.off('ride:accepted')
        socket.off('ride:taken')
        socket.off('ride:arriving')
        socket.off('ride:started')
        socket.off('ride:completed')
        socket.off('ride:cancelled')
        socket.off('driver:location:update')
        socket.off('emergency:triggered')
        socket.off('notification:broadcast')
        socket.off('shared:passenger-joined')
      }
    } catch (error) {
      console.warn('[Socket] Socket not available, running in offline mode')
      return () => {}
    }
  }, [currentUser, addIncomingRide, removeIncomingRide, setActiveRide, isOnline])

  const connect = useCallback(() => {
    try {
      const socket = getSocket()
      if (!socket.connected) {
        socket.connect()
      }
    } catch {
      console.warn('[Socket] Cannot connect - socket not available')
    }
  }, [])

  const disconnect = useCallback(() => {
    try {
      const socket = getSocket()
      if (socket.connected) {
        socket.disconnect()
      }
    } catch {
      // Socket not available
    }
  }, [])

  // Emit ride request (user)
  const emitRideRequest = useCallback((data: {
    rideId: string
    userId: string
    pickupAddress: string
    dropAddress: string
    fare: number
    vehicleType?: string
  }) => {
    try {
      const socket = getSocket()
      socket.emit('ride:request', data)
    } catch {
      console.warn('[Socket] Cannot emit ride request')
    }
  }, [])

  // Emit ride accept (driver)
  const emitRideAccept = useCallback((data: { rideId: string; driverId: string; userId: string }) => {
    try {
      const socket = getSocket()
      socket.emit('ride:accept', data)
    } catch {
      console.warn('[Socket] Cannot emit ride accept')
    }
  }, [])

  // Emit ride reject (driver)
  const emitRideReject = useCallback((data: { rideId: string; driverId: string }) => {
    try {
      const socket = getSocket()
      socket.emit('ride:reject', data)
    } catch {
      console.warn('[Socket] Cannot emit ride reject')
    }
  }, [])

  // Emit driver status change
  const emitDriverStatus = useCallback((data: { driverId: string; isOnline: boolean }) => {
    try {
      const socket = getSocket()
      socket.emit('driver:status', data)
    } catch {
      console.warn('[Socket] Cannot emit driver status')
    }
  }, [])

  // Emit driver location update
  const emitDriverLocation = useCallback((data: { driverId: string; lat: number; lng: number }) => {
    try {
      const socket = getSocket()
      socket.emit('driver:location', data)
    } catch {
      console.warn('[Socket] Cannot emit driver location')
    }
  }, [])

  // Emit ride completing
  const emitRideComplete = useCallback((data: { rideId: string; userId: string; driverId: string; fare: number }) => {
    try {
      const socket = getSocket()
      socket.emit('ride:complete', data)
    } catch {
      console.warn('[Socket] Cannot emit ride complete')
    }
  }, [])

  // Emit ride cancel
  const emitRideCancel = useCallback((data: { rideId: string; userId: string; driverId: string; cancelledBy: string }) => {
    try {
      const socket = getSocket()
      socket.emit('ride:cancel', data)
    } catch {
      console.warn('[Socket] Cannot emit ride cancel')
    }
  }, [])

  // Emit emergency
  const emitEmergency = useCallback((data: { userId: string; rideId: string; lat: number; lng: number }) => {
    try {
      const socket = getSocket()
      socket.emit('emergency:alert', data)
    } catch {
      console.warn('[Socket] Cannot emit emergency alert')
    }
  }, [])

  // Join shared ride room
  const joinSharedRide = useCallback((data: { sharedRideId: string; userId: string }) => {
    try {
      const socket = getSocket()
      socket.emit('shared:join', data)
    } catch {
      console.warn('[Socket] Cannot join shared ride')
    }
  }, [])

  return {
    isConnected,
    connect,
    disconnect,
    emitRideRequest,
    emitRideAccept,
    emitRideReject,
    emitDriverStatus,
    emitDriverLocation,
    emitRideComplete,
    emitRideCancel,
    emitEmergency,
    joinSharedRide,
  }
}
