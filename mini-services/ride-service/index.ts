import { Server } from "socket.io";
import cors from "cors";

const PORT = 3003;

const io = new Server(PORT, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Store connected users/drivers with their socket IDs
const connectedUsers = new Map(); // userId -> socketId
const connectedDrivers = new Map(); // driverId -> socketId
const driverLocations = new Map(); // driverId -> { lat, lng }

io.on("connection", (socket) => {
  console.log(`[Connected] ${socket.id}`);

  // User connects
  socket.on("user:connect", (data: { userId: string }) => {
    connectedUsers.set(data.userId, socket.id);
    socket.join(`user:${data.userId}`);
    console.log(`[User Connected] ${data.userId}`);
  });

  // Driver connects
  socket.on("driver:connect", (data: { driverId: string }) => {
    connectedDrivers.set(data.driverId, socket.id);
    socket.join(`driver:${data.driverId}`);
    console.log(`[Driver Connected] ${data.driverId}`);
  });

  // Driver goes online/offline
  socket.on("driver:status", (data: { driverId: string; isOnline: boolean }) => {
    if (data.isOnline) {
      socket.join("online-drivers");
    } else {
      socket.leave("online-drivers");
    }
    console.log(`[Driver Status] ${data.driverId} -> ${data.isOnline ? "ONLINE" : "OFFLINE"}`);
  });

  // Driver location update
  socket.on("driver:location", (data: { driverId: string; lat: number; lng: number }) => {
    driverLocations.set(data.driverId, { lat: data.lat, lng: data.lng });
    // Broadcast to any active ride watchers
    socket.broadcast.emit("driver:location:update", {
      driverId: data.driverId,
      lat: data.lat,
      lng: data.lng,
    });
  });

  // New ride request - broadcast to online drivers
  socket.on("ride:request", (data: {
    rideId: string;
    userId: string;
    pickupAddress: string;
    dropAddress: string;
    fare: number;
    pickupLat?: number;
    pickupLng?: number;
    vehicleType?: string;
  }) => {
    console.log(`[Ride Request] ${data.rideId} from ${data.pickupAddress} to ${data.dropAddress}`);
    // Broadcast to all online drivers
    io.to("online-drivers").emit("ride:new", data);
  });

  // Driver accepts ride
  socket.on("ride:accept", (data: { rideId: string; driverId: string; userId: string }) => {
    console.log(`[Ride Accepted] ${data.rideId} by driver ${data.driverId}`);
    // Notify user
    io.to(`user:${data.userId}`).emit("ride:accepted", {
      rideId: data.rideId,
      driverId: data.driverId,
    });
    // Notify other drivers that ride is taken
    socket.broadcast.to("online-drivers").emit("ride:taken", { rideId: data.rideId });
  });

  // Driver rejects ride
  socket.on("ride:reject", (data: { rideId: string; driverId: string }) => {
    console.log(`[Ride Rejected] ${data.rideId} by driver ${data.driverId}`);
  });

  // Ride status updates
  socket.on("ride:arriving", (data: { rideId: string; userId: string; driverId: string }) => {
    io.to(`user:${data.userId}`).emit("ride:arriving", { rideId: data.rideId });
  });

  socket.on("ride:start", (data: { rideId: string; userId: string; driverId: string }) => {
    io.to(`user:${data.userId}`).emit("ride:started", { rideId: data.rideId });
  });

  socket.on("ride:complete", (data: { rideId: string; userId: string; driverId: string; fare: number }) => {
    io.to(`user:${data.userId}`).emit("ride:completed", {
      rideId: data.rideId,
      fare: data.fare,
    });
  });

  socket.on("ride:cancel", (data: { rideId: string; userId: string; driverId: string; cancelledBy: string }) => {
    if (data.cancelledBy === "USER") {
      io.to(`driver:${data.driverId}`).emit("ride:cancelled", { rideId: data.rideId });
    } else {
      io.to(`user:${data.userId}`).emit("ride:cancelled", { rideId: data.rideId });
    }
  });

  // Emergency alert
  socket.on("emergency:alert", (data: { userId: string; rideId: string; lat: number; lng: number }) => {
    console.log(`[EMERGENCY] User ${data.userId} - Ride ${data.rideId}`);
    io.emit("emergency:triggered", data);
  });

  // Get nearby drivers
  socket.on("drivers:nearby", (data: { lat: number; lng: number; radius?: number }, callback) => {
    const radius = data.radius || 10; // km
    const nearbyDrivers: Array<{ driverId: string; lat: number; lng: number; distance: number }> = [];
    
    driverLocations.forEach((loc, driverId) => {
      const distance = getDistance(data.lat, data.lng, loc.lat, loc.lng);
      if (distance <= radius) {
        nearbyDrivers.push({ driverId, lat: loc.lat, lng: loc.lng, distance });
      }
    });
    
    nearbyDrivers.sort((a, b) => a.distance - b.distance);
    callback(nearbyDrivers);
  });

  // Shared ride booking
  socket.on("shared:join", (data: { sharedRideId: string; userId: string }) => {
    socket.join(`shared-ride:${data.sharedRideId}`);
    io.to(`shared-ride:${data.sharedRideId}`).emit("shared:passenger-joined", {
      userId: data.userId,
    });
  });

  // Notification broadcast (admin)
  socket.on("admin:broadcast", (data: { title: string; message: string }) => {
    io.emit("notification:broadcast", data);
  });

  // Disconnect
  socket.on("disconnect", () => {
    // Clean up
    connectedUsers.forEach((socketId, userId) => {
      if (socketId === socket.id) connectedUsers.delete(userId);
    });
    connectedDrivers.forEach((socketId, driverId) => {
      if (socketId === socket.id) {
        connectedDrivers.delete(driverId);
        driverLocations.delete(driverId);
      }
    });
    console.log(`[Disconnected] ${socket.id}`);
  });
});

// Calculate distance between two points using Haversine formula
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

console.log(`🚗 GramYatri Ride Service running on port ${PORT}`);
