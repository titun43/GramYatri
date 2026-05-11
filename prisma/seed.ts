import { db } from "../src/lib/db";

async function seed() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await db.transaction.deleteMany()
  await db.rating.deleteMany()
  await db.emergencyAlert.deleteMany()
  await db.dispute.deleteMany()
  await db.commission.deleteMany()
  await db.withdrawRequest.deleteMany()
  await db.sharedRidePassenger.deleteMany()
  await db.sharedRide.deleteMany()
  await db.ride.deleteMany()
  await db.offer.deleteMany()
  await db.notification.deleteMany()
  await db.transaction.deleteMany()
  await db.wallet.deleteMany()
  await db.driver.deleteMany()
  await db.oTP.deleteMany()
  await db.appSetting.deleteMany()
  await db.route.deleteMany()
  await db.user.deleteMany()

  // Create Admin
  const admin = await db.user.create({
    data: {
      phone: "+919999999999",
      name: "Admin",
      role: "ADMIN",
      isVerified: true,
      adminPassword: "admin123",
      wallet: { create: { balance: 0 } },
    },
  });
  console.log("✅ Admin created:", admin.phone, "(Password: admin123)");

  // Create sample users
  const userNames = ["Arun Das", "Priya Sharma", "Rajesh Kumar", "Meena Devi", "Sanjay Mandal", "Nikhil Roy", "Shrabanti Pal", "Deepak Ghosh"];
  const users = [];
  for (let i = 0; i < userNames.length; i++) {
    const user = await db.user.create({
      data: {
        phone: `+91987654321${i}`,
        name: userNames[i],
        role: "USER",
        isVerified: true,
        wallet: { create: { balance: [350, 120, 500, 80, 0, 250, 175, 420][i] } },
      },
    });
    users.push(user);
  }
  console.log("✅ 8 sample users created");

  // Create sample drivers
  const driverData = [
    { name: "Ramu Das", phone: "+918765432101", vehicleType: "TEMPO", vehicleNumber: "AS-01-AB-1234", license: "DL-2023-001", approved: true, online: true, lat: 26.15, lng: 92.95 },
    { name: "Suren Kumar", phone: "+918765432102", vehicleType: "AUTO", vehicleNumber: "AS-02-CD-5678", license: "DL-2023-002", approved: true, online: false, lat: 26.12, lng: 92.90 },
    { name: "Kalu Majhi", phone: "+918765432103", vehicleType: "E_RICKSHAW", vehicleNumber: "AS-03-EF-9012", license: "DL-2023-003", approved: true, online: true, lat: 26.18, lng: 92.97 },
    { name: "Haricharan Das", phone: "+918765432104", vehicleType: "AUTO", vehicleNumber: "AS-04-GH-3456", license: "DL-2023-004", approved: true, online: false, lat: 26.10, lng: 92.88 },
    { name: "Gopal Das", phone: "+918765432105", vehicleType: "TEMPO", vehicleNumber: "AS-05-IJ-7890", license: "DL-2024-005", approved: false, online: false, lat: 0, lng: 0 },
    { name: "Suman Roy", phone: "+918765432106", vehicleType: "AUTO", vehicleNumber: "AS-06-KL-1234", license: "DL-2024-006", approved: false, online: false, lat: 0, lng: 0 },
    { name: "Anil Sarkar", phone: "+918765432107", vehicleType: "E_RICKSHAW", vehicleNumber: "AS-07-MN-5678", license: "DL-2024-007", approved: false, online: false, lat: 0, lng: 0 },
  ];

  const drivers = [];
  for (let i = 0; i < driverData.length; i++) {
    const d = driverData[i];
    const driver = await db.user.create({
      data: {
        phone: d.phone,
        name: d.name,
        role: "DRIVER",
        isVerified: true,
        driver: {
          create: {
            vehicleType: d.vehicleType,
            vehicleNumber: d.vehicleNumber,
            licenseNumber: d.license,
            isApproved: d.approved,
            isOnline: d.online,
            currentLat: d.lat,
            currentLng: d.lng,
            rating: d.approved ? 3.5 + Math.random() * 1.5 : 0,
            totalRides: d.approved ? Math.floor(Math.random() * 200) : 0,
            totalEarnings: d.approved ? Math.floor(Math.random() * 50000) : 0,
          },
        },
        wallet: { create: { balance: d.approved ? 1000 + Math.floor(Math.random() * 4000) : 0 } },
      },
      include: { driver: true },
    });
    drivers.push(driver);
  }
  console.log("✅ 7 drivers created (4 approved, 2 online, 3 pending)");

  // Create routes
  const routes = [
    { name: "Lanka → Hojai", fromLocation: "Lanka", toLocation: "Hojai", stops: JSON.stringify(["Lanka Market", "Lanka Bus Stand", "Kampur", "Hojai Town", "Hojai Station"]), fare: 40, distance: 28, duration: 45 },
    { name: "Hojai → Nagaon", fromLocation: "Hojai", toLocation: "Nagaon", stops: JSON.stringify(["Hojai Station", "Doboka", "Kaliabor", "Nagaon Town", "Nagaon Bus Stand"]), fare: 60, distance: 38, duration: 60 },
    { name: "Nagaon → Guwahati", fromLocation: "Nagaon", toLocation: "Guwahati", stops: JSON.stringify(["Nagaon Bus Stand", "Jagiroad", "Chaparmukh", "Guwahati"]), fare: 150, distance: 120, duration: 180 },
    { name: "Lanka → Nagaon", fromLocation: "Lanka", toLocation: "Nagaon", stops: JSON.stringify(["Lanka Market", "Hojai Town", "Doboka", "Kaliabor", "Nagaon Bus Stand"]), fare: 80, distance: 66, duration: 90 },
    { name: "Hojai → Diphu", fromLocation: "Hojai", toLocation: "Diphu", stops: JSON.stringify(["Hojai Station", "Lamding", "Diphu"]), fare: 70, distance: 60, duration: 90 },
  ];

  const routeRecords = [];
  for (const route of routes) {
    const r = await db.route.create({ data: route });
    routeRecords.push(r);
  }
  console.log("✅ 5 routes created");

  // Create offers
  await db.offer.create({
    data: {
      code: "GRAM10",
      title: "GramYatri Launch Offer",
      description: "10% off on your first ride",
      discount: 10,
      type: "PERCENTAGE",
      minFare: 50,
      maxDiscount: 30,
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await db.offer.create({
    data: {
      code: "FLAT20",
      title: "Flat ₹20 Off",
      description: "₹20 off on rides above ₹50",
      discount: 20,
      type: "FLAT",
      minFare: 50,
      maxDiscount: 20,
      isActive: true,
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
  });

  await db.offer.create({
    data: {
      code: "SUMMER15",
      title: "Summer Special",
      description: "15% off on all rides",
      discount: 15,
      type: "PERCENTAGE",
      minFare: 30,
      maxDiscount: 75,
      isActive: false,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("✅ 3 offers created");

  // Create app settings
  const settings = [
    { key: "commission_percentage", value: "15", description: "Platform commission percentage" },
    { key: "tempo_base_fare", value: "15", description: "Base fare for Tempo" },
    { key: "tempo_per_km", value: "8", description: "Per km rate for Tempo" },
    { key: "auto_base_fare", value: "20", description: "Base fare for Auto" },
    { key: "auto_per_km", value: "12", description: "Per km rate for Auto" },
    { key: "erickshaw_base_fare", value: "10", description: "Base fare for E-Rickshaw" },
    { key: "erickshaw_per_km", value: "6", description: "Per km rate for E-Rickshaw" },
    { key: "otp_expiry_minutes", value: "5", description: "OTP expiry time in minutes" },
  ];

  for (const setting of settings) {
    await db.appSetting.create({ data: setting });
  }
  console.log("✅ App settings created");

  // Create sample rides
  const ride1 = await db.ride.create({
    data: {
      userId: users[0].id,
      driverId: drivers[0].driver?.id,
      pickupAddress: "Lanka Market",
      dropAddress: "Hojai Station",
      pickupLat: 26.15,
      pickupLng: 92.95,
      dropLat: 26.0,
      dropLng: 92.87,
      fare: 40,
      distance: 15,
      duration: 30,
      status: "COMPLETED",
      paymentMethod: "CASH",
      paymentStatus: "PAID",
    },
  });

  await db.rating.create({
    data: {
      rideId: ride1.id,
      fromUserId: users[0].id,
      toUserId: drivers[0].id,
      toDriverId: drivers[0].driver?.id,
      rating: 4,
      review: "Good service",
    },
  });

  const ride2 = await db.ride.create({
    data: {
      userId: users[1].id,
      driverId: drivers[1].driver?.id,
      pickupAddress: "Hojai Bus Stand",
      dropAddress: "Nagaon Town",
      pickupLat: 26.0,
      pickupLng: 92.87,
      dropLat: 26.35,
      dropLng: 92.68,
      fare: 60,
      distance: 55,
      duration: 80,
      status: "COMPLETED",
      paymentMethod: "WALLET",
      paymentStatus: "PAID",
    },
  });

  await db.rating.create({
    data: {
      rideId: ride2.id,
      fromUserId: users[1].id,
      toUserId: drivers[1].id,
      toDriverId: drivers[1].driver?.id,
      rating: 5,
      review: "Excellent ride!",
    },
  });

  const ride3 = await db.ride.create({
    data: {
      userId: users[2].id,
      driverId: drivers[2].driver?.id,
      pickupAddress: "College Corner",
      dropAddress: "Bus Stand",
      pickupLat: 26.16,
      pickupLng: 92.94,
      dropLat: 26.15,
      dropLng: 92.96,
      fare: 20,
      distance: 3,
      duration: 10,
      status: "COMPLETED",
      paymentMethod: "CASH",
      paymentStatus: "PAID",
    },
  });

  await db.rating.create({
    data: {
      rideId: ride3.id,
      fromUserId: users[2].id,
      toUserId: drivers[2].id,
      toDriverId: drivers[2].driver?.id,
      rating: 3,
      review: "Average",
    },
  });

  // Active ride
  await db.ride.create({
    data: {
      userId: users[3].id,
      driverId: drivers[0].driver?.id,
      pickupAddress: "Lanka Market",
      dropAddress: "Kampur",
      fare: 25,
      distance: 8,
      status: "IN_PROGRESS",
      paymentMethod: "CASH",
    },
  });

  // Searching ride
  await db.ride.create({
    data: {
      userId: users[4].id,
      pickupAddress: "Railway Station",
      dropAddress: "District Hospital",
      fare: 35,
      distance: 5,
      status: "PENDING",
      paymentMethod: "WALLET",
    },
  });

  console.log("✅ Sample rides and ratings created");

  // Create wallet transactions
  for (const user of users.slice(0, 3)) {
    const wallet = await db.wallet.findUnique({ where: { userId: user.id } });
    if (wallet) {
      await db.transaction.create({
        data: {
          walletId: wallet.id,
          amount: 500,
          type: "CREDIT",
          description: "Wallet top-up",
        },
      });
    }
  }
  console.log("✅ Sample transactions created");

  // Create shared rides
  const sharedRide1 = await db.sharedRide.create({
    data: {
      routeId: routeRecords[0].id,
      driverId: drivers[0].driver!.id,
      departureTime: new Date(Date.now() + 30 * 60 * 1000),
      availableSeats: 4,
      totalSeats: 6,
      status: "SCHEDULED",
    },
  });

  const sharedRide2 = await db.sharedRide.create({
    data: {
      routeId: routeRecords[1].id,
      driverId: drivers[2].driver!.id,
      departureTime: new Date(Date.now() + 60 * 60 * 1000),
      availableSeats: 2,
      totalSeats: 6,
      status: "SCHEDULED",
    },
  });

  console.log("✅ 2 shared rides created");

  // Notifications
  await db.notification.createMany({
    data: [
      { userId: users[0].id, title: "Welcome to GramYatri!", message: "Book your first ride and get 10% off with code GRAM10", type: "PROMO" },
      { userId: users[0].id, title: "Ride Completed", message: "Your ride from Lanka Market to Hojai Station is complete. Fare: ₹40", type: "RIDE" },
      { userId: drivers[0].id, title: "New Ride Available", message: "A new ride request is available near you", type: "RIDE" },
    ],
  });
  console.log("✅ Notifications created");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📱 Test Accounts:");
  console.log("  Admin:    +919999999999");
  console.log("  Users:    +919876543210 to +919876543217");
  console.log("  Drivers:  +918765432101 to +918765432107");
  console.log("\n🔑 OTP: 1234 (for all accounts)");
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
