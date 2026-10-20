const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const Plan = require('../models/Plan');
const Membership = require('../models/Membership');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Workout = require('../models/Workout');
const Progress = require('../models/Progress');
const Notification = require('../models/Notification');
const Class = require('../models/Class');
const ClassBooking = require('../models/ClassBooking');
const TrainingSession = require('../models/TrainingSession');
const Equipment = require('../models/Equipment');
const Maintenance = require('../models/Maintenance');
const Locker = require('../models/Locker');
const DietPlan = require('../models/DietPlan');
const Lead = require('../models/Lead');
const Coupon = require('../models/Coupon');
const Feedback = require('../models/Feedback');
const AuditLog = require('../models/AuditLog');

const seedData = async (isAutoSeed = false) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gymflow';
      const dns = require('dns');
      if (mongoUri && mongoUri.startsWith('mongodb+srv://')) {
        try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
      }
      
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
      } catch (connErr) {
        console.log('⚠️ MongoDB connection attempt error:', connErr.message);
        console.log('Spinning up MongoMemoryServer for seed...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
        await mongoose.connect(mongoUri);
        console.log(`✅ Connected to MongoMemoryServer: ${mongoUri}`);
      }
    }

    console.log('🧹 Clearing existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Member.deleteMany({}),
      Trainer.deleteMany({}),
      Plan.deleteMany({}),
      Membership.deleteMany({}),
      Attendance.deleteMany({}),
      Payment.deleteMany({}),
      Invoice.deleteMany({}),
      Workout.deleteMany({}),
      Progress.deleteMany({}),
      Notification.deleteMany({}),
      Class.deleteMany({}),
      ClassBooking.deleteMany({}),
      TrainingSession.deleteMany({}),
      Equipment.deleteMany({}),
      Maintenance.deleteMany({}),
      Locker.deleteMany({}),
      DietPlan.deleteMany({}),
      Lead.deleteMany({}),
      Coupon.deleteMany({}),
      Feedback.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    // 1. Membership Plans
    console.log('✨ Creating Membership Plans...');
    const plans = await Plan.create([
      {
        name: 'Basic Plan',
        durationMonths: 1,
        price: 999,
        description: 'Standard access to gym floor and basic strength equipment.',
        features: ['Gym Floor Access', 'Locker Room & Showers', 'Basic Fitness Assessment', 'Standard Hours (6 AM - 10 PM)'],
        status: 'Active'
      },
      {
        name: 'Silver Plan',
        durationMonths: 3,
        price: 2499,
        description: 'Quarterly membership with group fitness classes included.',
        features: ['Full Gym Floor Access', 'Group Cardio & Yoga Classes', '1 Personal Trainer Session', 'Sauna Access'],
        status: 'Active'
      },
      {
        name: 'Gold Plan',
        durationMonths: 6,
        price: 4499,
        description: 'Bi-annual premium tier with trainer consultations & diet charts.',
        features: ['24/7 VIP Gym Access', 'All Group Classes', 'Monthly Body Composition Scan', 'Customized Diet Plan', '2 Personal Trainer Sessions'],
        status: 'Active'
      },
      {
        name: 'Premium Plan',
        durationMonths: 12,
        price: 7999,
        description: 'Ultimate annual all-inclusive fitness & body transformation package.',
        features: ['Unlimited 24/7 Access', 'Dedicated Personal Trainer', 'Custom Diet & Supplement Plan', 'Free Gym Merch Kit', 'Steam & Spa Unlimited'],
        status: 'Active'
      }
    ]);

    const basicPlan = plans[0];
    const silverPlan = plans[1];
    const goldPlan = plans[2];
    const premiumPlan = plans[3];

    // 2. Demo Users & Trainers
    console.log('🔑 Creating Demo Users & Admin...');
    const adminUser = await User.create({
      name: 'GymFlow Administrator',
      email: 'admin@gymflow.com',
      password: 'Admin@123',
      phone: '+91 98765 43210',
      role: 'Admin'
    });

    const trainerUser1 = await User.create({
      name: 'Alex Vance',
      email: 'trainer@gymflow.com',
      password: 'Trainer@123',
      phone: '+91 98123 45678',
      role: 'Trainer'
    });

    const trainerUser2 = await User.create({
      name: 'Sarah Connor',
      email: 'trainer2@gymflow.com',
      password: 'Trainer@123',
      phone: '+91 98234 56789',
      role: 'Trainer'
    });

    const trainerUser3 = await User.create({
      name: 'Marcus Brody',
      email: 'trainer3@gymflow.com',
      password: 'Trainer@123',
      phone: '+91 98345 67890',
      role: 'Trainer'
    });

    // Trainer Profiles
    const trainer1 = await Trainer.create({
      user: trainerUser1._id,
      trainerCustomId: 'TR-101',
      specialization: 'Hypertrophy & Strength Conditioning',
      experienceYears: 6,
      availability: 'Morning (6:00 AM - 2:00 PM)',
      bio: 'Former competitive powerlifter specializing in muscle hypertrophy and strength building.'
    });

    const trainer2 = await Trainer.create({
      user: trainerUser2._id,
      trainerCustomId: 'TR-102',
      specialization: 'Weight Loss & Functional HIIT',
      experienceYears: 4,
      availability: 'Evening (2:00 PM - 10:00 PM)',
      bio: 'Certified CrossFit coach passionate about fat loss transformations and high-intensity interval training.'
    });

    const trainer3 = await Trainer.create({
      user: trainerUser3._id,
      trainerCustomId: 'TR-103',
      specialization: 'Mobility, Calisthenics & Yoga',
      experienceYears: 5,
      availability: 'Flexible (All Shifts)',
      bio: 'Focuses on posture restoration, functional mobility, athletic longevity, and yoga alignment.'
    });

    const trainerList = [trainer1, trainer2, trainer3];

    // 3. Demo Member User
    const demoMemberUser = await User.create({
      name: 'John Doe',
      email: 'member@gymflow.com',
      password: 'Member@123',
      phone: '+91 98000 11223',
      role: 'Member'
    });

    // 4. Create 15-20 Realistic Members
    console.log('👤 Seeding 16 Members across various plans & trainers...');
    const memberRawData = [
      { name: 'John Doe', email: 'member@gymflow.com', phone: '+91 98000 11223', gender: 'Male', plan: premiumPlan, trainer: trainer1, status: 'Active' },
      { name: 'Elena Rostova', email: 'elena@gmail.com', phone: '+91 98451 22334', gender: 'Female', plan: goldPlan, trainer: trainer2, status: 'Active' },
      { name: 'Rohan Sharma', email: 'rohan.sharma@yahoo.com', phone: '+91 98761 11223', gender: 'Male', plan: silverPlan, trainer: trainer1, status: 'Active' },
      { name: 'Priya Patel', email: 'priya.patel@gmail.com', phone: '+91 99123 44556', gender: 'Female', plan: goldPlan, trainer: trainer3, status: 'Active' },
      { name: 'Vikram Malhotra', email: 'vikram.m@outlook.com', phone: '+91 98877 66554', gender: 'Male', plan: premiumPlan, trainer: trainer2, status: 'Active' },
      { name: 'Aanya Sen', email: 'aanya.sen@gmail.com', phone: '+91 97788 99001', gender: 'Female', plan: basicPlan, trainer: null, status: 'Active' },
      { name: 'David Miller', email: 'david.miller@gmail.com', phone: '+91 96655 44332', gender: 'Male', plan: silverPlan, trainer: trainer1, status: 'Active' },
      { name: 'Neha Gupta', email: 'neha.gupta@hotmail.com', phone: '+91 95544 33221', gender: 'Female', plan: goldPlan, trainer: trainer2, status: 'Active' },
      { name: 'Arjun Kapoor', email: 'arjun.k@gmail.com', phone: '+91 94433 22110', gender: 'Male', plan: basicPlan, trainer: trainer3, status: 'Expiring Soon' },
      { name: 'Kavita Joshi', email: 'kavita.j@yahoo.com', phone: '+91 93322 11009', gender: 'Female', plan: silverPlan, trainer: trainer2, status: 'Active' },
      { name: 'Michael Chen', email: 'michael.chen@gmail.com', phone: '+91 92211 00998', gender: 'Male', plan: premiumPlan, trainer: trainer1, status: 'Active' },
      { name: 'Sunita Rao', email: 'sunita.rao@gmail.com', phone: '+91 91100 99887', gender: 'Female', plan: basicPlan, trainer: null, status: 'Expired' },
      { name: 'Karan Mehra', email: 'karan.mehra@gmail.com', phone: '+91 90099 88776', gender: 'Male', plan: goldPlan, trainer: trainer1, status: 'Active' },
      { name: 'Sophia Turner', email: 'sophia.t@gmail.com', phone: '+91 89988 77665', gender: 'Female', plan: silverPlan, trainer: trainer3, status: 'Active' },
      { name: 'Ananya Roy', email: 'ananya.roy@gmail.com', phone: '+91 88877 66554', gender: 'Female', plan: premiumPlan, trainer: trainer2, status: 'Active' },
      { name: 'Rajesh Verma', email: 'rajesh.v@gmail.com', phone: '+91 87766 55443', gender: 'Male', plan: silverPlan, trainer: trainer1, status: 'Active' }
    ];

    const createdMembers = [];

    for (let i = 0; i < memberRawData.length; i++) {
      const data = memberRawData[i];
      let userDoc;

      if (data.email === 'member@gymflow.com') {
        userDoc = demoMemberUser;
      } else {
        userDoc = await User.create({
          name: data.name,
          email: data.email,
          password: 'Member@123',
          phone: data.phone,
          role: 'Member'
        });
      }

      const customId = `GF-${1001 + i}`;
      const memberDoc = await Member.create({
        user: userDoc._id,
        memberCustomId: customId,
        gender: data.gender,
        assignedTrainer: data.trainer ? data.trainer._id : null,
        status: data.status,
        emergencyContact: '+91 98989 89898',
        address: `${10 + i}, Palm Avenue, Sector 4, Bangalore`
      });

      // Calculate start and end date
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();

      if (data.status === 'Expiring Soon') {
        startDate.setMonth(now.getMonth() - data.plan.durationMonths);
        endDate = new Date(now);
        endDate.setDate(now.getDate() + 4); // Expiring in 4 days!
      } else if (data.status === 'Expired') {
        startDate.setMonth(now.getMonth() - data.plan.durationMonths - 1);
        endDate = new Date(now);
        endDate.setDate(now.getDate() - 10); // Expired 10 days ago!
      } else {
        startDate.setMonth(now.getMonth() - 1);
        endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + data.plan.durationMonths);
      }

      // Membership record with snapshots
      const membershipDoc = await Membership.create({
        member: memberDoc._id,
        plan: data.plan._id,
        priceSnapshot: data.plan.price,
        durationMonthsSnapshot: data.plan.durationMonths,
        startDate,
        endDate,
        originalEndDate: endDate,
        status: data.status,
        paymentStatus: 'Paid',
        amountPaid: data.plan.price,
        outstandingDues: 0
      });

      memberDoc.currentMembership = membershipDoc._id;
      await memberDoc.save();

      // Payment & Invoice record
      const invoiceNo = `INV-2026-${1001 + i}`;
      const paymentDoc = await Payment.create({
        member: memberDoc._id,
        membership: membershipDoc._id,
        amount: data.plan.price,
        paymentMethod: i % 2 === 0 ? 'UPI' : 'Card',
        transactionId: `TXN-SEED-2026-${1001 + i}`,
        invoiceNo,
        status: 'Completed',
        paymentDate: startDate,
        isDemoPayment: true,
        notes: `Seed subscription payment for ${data.plan.name}`
      });

      await Invoice.create({
        invoiceNumber: invoiceNo,
        member: memberDoc._id,
        payment: paymentDoc._id,
        membership: membershipDoc._id,
        planName: data.plan.name,
        subTotal: data.plan.price,
        totalAmount: data.plan.price,
        status: 'Paid',
        issuedDate: startDate
      });

      createdMembers.push({ member: memberDoc, user: userDoc, membership: membershipDoc });
    }

    // 5. Attendance Records for past 14 days
    console.log('📅 Seeding realistic daily attendance logs for past 14 days...');
    const now = new Date();
    for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
      const d = new Date();
      d.setDate(now.getDate() - dayOffset);
      const dateStr = d.toISOString().split('T')[0];

      // Random 8-12 members attended on each day
      const dailyAttendees = createdMembers
        .slice(0, 8 + Math.floor(Math.random() * 6))
        .map(item => item.member);

      for (const attendee of dailyAttendees) {
        try {
          await Attendance.create({
            member: attendee._id,
            date: dateStr,
            checkInTime: `${String(6 + Math.floor(Math.random() * 4)).padStart(2, '0')}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')} AM`,
            checkOutTime: `${String(7 + Math.floor(Math.random() * 4)).padStart(2, '0')}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')} AM`,
            status: 'Present',
            markedBy: adminUser._id
          });
        } catch (e) {
          // ignore duplicate in case
        }
      }
    }

    // 6. Group Classes & Bookings
    console.log('🧘 Seeding Group Fitness Classes & Member Bookings...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);

    const groupClasses = await Class.create([
      {
        name: 'Morning Sunrise Yoga',
        trainer: trainer3._id,
        category: 'Yoga',
        startTime: new Date(today.setHours(7, 0, 0, 0)),
        endTime: new Date(today.setHours(8, 0, 0, 0)),
        durationMinutes: 60,
        capacity: 15,
        bookedCount: 5,
        location: 'Studio A (Zen Hall)',
        status: 'Scheduled',
        description: 'Vinyasa flow focusing on core strength, balance, and deep flexibility.'
      },
      {
        name: 'High-Octane HIIT & Cardio',
        trainer: trainer2._id,
        category: 'HIIT',
        startTime: new Date(tomorrow.setHours(18, 0, 0, 0)),
        endTime: new Date(tomorrow.setHours(19, 0, 0, 0)),
        durationMinutes: 60,
        capacity: 12,
        bookedCount: 6,
        location: 'Functional Arena',
        status: 'Scheduled',
        description: 'Tabata interval sprints, kettlebell swings, and metabolic conditioning.'
      },
      {
        name: 'Power Zumba Dance Party',
        trainer: trainer2._id,
        category: 'Zumba',
        startTime: new Date(dayAfter.setHours(19, 0, 0, 0)),
        endTime: new Date(dayAfter.setHours(20, 0, 0, 0)),
        durationMinutes: 60,
        capacity: 20,
        bookedCount: 8,
        location: 'Studio B',
        status: 'Scheduled',
        description: 'High-energy dance fitness with upbeat Latin rhythms and fat-burning choreography.'
      },
      {
        name: 'Strength & Deadlift Masterclass',
        trainer: trainer1._id,
        category: 'CrossFit',
        startTime: new Date(dayAfter.setHours(17, 0, 0, 0)),
        endTime: new Date(dayAfter.setHours(18, 30, 0, 0)),
        durationMinutes: 90,
        capacity: 8,
        bookedCount: 4,
        location: 'Powerlifting Platform',
        status: 'Scheduled',
        description: 'Proper hinge mechanics, bracing, lockout techniques, and 1RM optimization.'
      }
    ]);

    // Book members into classes
    for (let k = 0; k < 4; k++) {
      const cls = groupClasses[k];
      const attendees = createdMembers.slice(k * 2, k * 2 + (k === 2 ? 4 : 3));
      for (const a of attendees) {
        try {
          await ClassBooking.create({
            class: cls._id,
            member: a.member._id,
            status: 'Booked'
          });
        } catch (e) {}
      }
    }

    // 7. Personal Training Sessions
    console.log('🏋️‍♂️ Seeding 1-on-1 Personal Training Sessions...');
    const ptDate1 = new Date(today);
    ptDate1.setHours(10, 0, 0, 0);
    const ptDate1End = new Date(ptDate1);
    ptDate1End.setHours(11, 0, 0, 0);

    const ptDate2 = new Date(tomorrow);
    ptDate2.setHours(16, 0, 0, 0);
    const ptDate2End = new Date(ptDate2);
    ptDate2End.setHours(17, 0, 0, 0);

    await TrainingSession.create([
      {
        trainer: trainer1._id,
        member: createdMembers[0].member._id, // John Doe
        title: 'Squat Form & Mobility Assessment',
        startTime: ptDate1,
        endTime: ptDate1End,
        focusArea: 'Lower Body Strength',
        status: 'Scheduled',
        notes: 'Review depth, ankle dorsiflexion, and hip mobility.'
      },
      {
        trainer: trainer2._id,
        member: createdMembers[1].member._id,
        title: 'HIIT VO2 Max Conditioning',
        startTime: ptDate2,
        endTime: ptDate2End,
        focusArea: 'Cardiovascular Endurance',
        status: 'Scheduled',
        notes: 'Pacing on assault bike and rowing intervals.'
      }
    ]);

    // 8. Equipment & Maintenance
    console.log('⚙️ Seeding Gym Equipment Assets & Service Schedules...');
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 5); // Due in 5 days!

    const futureService = new Date(today);
    futureService.setDate(today.getDate() + 45);

    const equipmentDocs = await Equipment.create([
      {
        name: 'Olympic Barbell Power Rack #1',
        category: 'Strength',
        serialNumber: 'EQ-PR-01',
        condition: 'Excellent',
        location: 'Heavy Lifting Zone',
        purchaseDate: new Date('2025-01-15'),
        lastServiceDate: new Date('2026-08-10'),
        nextServiceDate: futureService,
        cost: 65000,
        maintenanceNotes: 'Bolts tightened and J-hooks inspected.'
      },
      {
        name: 'Commercial Treadmill Pro-X9',
        category: 'Cardio',
        serialNumber: 'EQ-TM-04',
        condition: 'Needs Maintenance',
        location: 'Cardio Bay',
        purchaseDate: new Date('2024-11-20'),
        lastServiceDate: new Date('2026-06-15'),
        nextServiceDate: nextWeek, // Alert! Due within 7 days
        cost: 145000,
        maintenanceNotes: 'Belt alignment required, slight squeaking at 12 km/h.'
      },
      {
        name: 'Dual Adjustable Cable Pulley Crossover',
        category: 'Machines',
        serialNumber: 'EQ-CB-02',
        condition: 'Good',
        location: 'Main Floor',
        purchaseDate: new Date('2025-03-10'),
        lastServiceDate: new Date('2026-09-01'),
        nextServiceDate: futureService,
        cost: 110000,
        maintenanceNotes: 'Cables lubricated, weight stack pins verified.'
      },
      {
        name: 'Incline Chest Press Machine',
        category: 'Strength',
        serialNumber: 'EQ-CP-07',
        condition: 'Good',
        location: 'Upper Body Area',
        purchaseDate: new Date('2025-05-18'),
        lastServiceDate: new Date('2026-07-22'),
        nextServiceDate: futureService,
        cost: 58000
      }
    ]);

    await Maintenance.create({
      equipment: equipmentDocs[0]._id,
      serviceDate: new Date('2026-08-10'),
      technician: 'Apex Fitness Services',
      serviceType: 'Routine Inspection',
      cost: 2500,
      notes: 'Full structural inspection & torque check on safety bars.',
      status: 'Completed'
    });

    // 9. Lockers
    console.log('🔒 Seeding Smart Gym Lockers...');
    const lockers = [];
    for (let l = 1; l <= 12; l++) {
      const lockerNum = `L-${100 + l}`;
      const isAllocated = l <= 4;
      lockers.push({
        lockerNumber: lockerNum,
        zone: l <= 6 ? 'Ground Floor A' : 'First Floor Men',
        status: isAllocated ? 'Allocated' : 'Available',
        assignedMember: isAllocated ? createdMembers[l - 1].member._id : null,
        allocationDate: isAllocated ? new Date() : null,
        releaseDate: isAllocated ? new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) : null
      });
    }
    await Locker.create(lockers);

    // 10. Diet Plans
    console.log('🥗 Seeding Diet & Nutrition Plans...');
    await DietPlan.create([
      {
        member: createdMembers[0].member._id, // John Doe
        trainer: trainer1._id,
        title: 'Lean Muscle Hypertrophy Fuel (2800 kcal)',
        fitnessGoal: 'Muscle Gain',
        targetDailyCalories: 2800,
        targetProteinGrams: 180,
        targetCarbsGrams: 320,
        targetFatsGrams: 75,
        waterIntakeLiters: 4.0,
        meals: [
          {
            mealName: 'Power Breakfast',
            mealTime: '08:00 AM',
            calories: 650,
            foodItems: [
              { name: 'Rolled Oats with Almond Milk', quantity: '80g', calories: 300, protein: 12 },
              { name: 'Boiled Egg Whites + 2 Whole Eggs', quantity: '5 eggs', calories: 250, protein: 28 },
              { name: 'Banana + Blueberries', quantity: '1 bowl', calories: 100, protein: 2 }
            ],
            notes: 'Consume with 500ml water and multivitamin.'
          },
          {
            mealName: 'Lunch - High Protein Carb Fuel',
            mealTime: '01:30 PM',
            calories: 800,
            foodItems: [
              { name: 'Grilled Chicken Breast', quantity: '200g', calories: 330, protein: 60 },
              { name: 'Brown Basmati Rice', quantity: '150g cooked', calories: 220, protein: 5 },
              { name: 'Steamed Broccoli & Carrots', quantity: '100g', calories: 50, protein: 3 }
            ]
          },
          {
            mealName: 'Pre-Workout Snack',
            mealTime: '05:00 PM',
            calories: 350,
            foodItems: [
              { name: 'Peanut Butter Toast', quantity: '2 slices sourdough + 30g PB', calories: 350, protein: 14 }
            ]
          },
          {
            mealName: 'Dinner - Recovery Feast',
            mealTime: '08:30 PM',
            calories: 700,
            foodItems: [
              { name: 'Pan-seared Salmon or Paneer Tikka', quantity: '180g', calories: 380, protein: 40 },
              { name: 'Sweet Potato Mash', quantity: '150g', calories: 150, protein: 3 },
              { name: 'Mixed Greens Salad', quantity: '1 bowl', calories: 60, protein: 2 }
            ]
          }
        ]
      }
    ]);

    // 11. Workouts & Progress
    console.log('💪 Seeding Workout Plans and Member PR Progress...');
    await Workout.create([
      {
        member: createdMembers[0].member._id, // John Doe
        trainer: trainer1._id,
        planName: 'Push-Pull-Legs Hypertrophy Protocol',
        goal: 'Hypertrophy & Strength',
        durationWeeks: 8,
        status: 'Active',
        exercises: [
          { name: 'Flat Barbell Bench Press', muscleGroup: 'Chest', sets: 4, reps: 10, weightKg: 85, restTimeSec: 90, day: 'Day 1: Push' },
          { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', sets: 3, reps: 12, weightKg: 30, restTimeSec: 75, day: 'Day 1: Push' },
          { name: 'Overhead Barbell Press', muscleGroup: 'Shoulders', sets: 3, reps: 10, weightKg: 50, restTimeSec: 90, day: 'Day 1: Push' },
          { name: 'Cable Tricep Pushdown', muscleGroup: 'Triceps', sets: 4, reps: 15, weightKg: 35, restTimeSec: 60, day: 'Day 1: Push' },
          { name: 'Conventional Deadlift', muscleGroup: 'Back', sets: 4, reps: 8, weightKg: 140, restTimeSec: 120, day: 'Day 2: Pull' },
          { name: 'Wide Grip Lat Pulldown', muscleGroup: 'Back', sets: 4, reps: 12, weightKg: 65, restTimeSec: 75, day: 'Day 2: Pull' },
          { name: 'Incline Dumbbell Bicep Curl', muscleGroup: 'Biceps', sets: 3, reps: 12, weightKg: 16, restTimeSec: 60, day: 'Day 2: Pull' },
          { name: 'Barbell Back Squat', muscleGroup: 'Quads', sets: 4, reps: 10, weightKg: 110, restTimeSec: 120, day: 'Day 3: Legs' },
          { name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', sets: 3, reps: 12, weightKg: 70, restTimeSec: 90, day: 'Day 3: Legs' }
        ]
      }
    ]);

    // Progress logs over 4 months for John Doe
    for (let m = 3; m >= 0; m--) {
      const pDate = new Date();
      pDate.setMonth(now.getMonth() - m);
      await Progress.create({
        member: createdMembers[0].member._id,
        trainer: trainer1._id,
        date: pDate,
        weightKg: Number((82.5 - m * 1.2).toFixed(1)),
        bodyFatPercentage: Number((18.5 - m * 1.1).toFixed(1)),
        chestCm: 102 + (3 - m) * 2,
        waistCm: 86 - (3 - m) * 1.5,
        bicepsCm: 38 + (3 - m) * 0.8,
        benchPressPRKg: 80 + (3 - m) * 5,
        squatPRKg: 100 + (3 - m) * 7.5,
        deadliftPRKg: 130 + (3 - m) * 10,
        notes: `Month ${4 - m} body recomposition milestone.`
      });
    }

    // 12. Leads & Coupons
    console.log('🎯 Seeding Leads Pipeline & Discount Coupons...');
    await Lead.create([
      {
        fullName: 'Sameer Verma',
        email: 'sameer.v@gmail.com',
        phone: '+91 97711 22334',
        interest: 'Bodybuilding',
        source: 'Instagram',
        status: 'Trial Active',
        hasTrialPass: true,
        trialStartDate: new Date(),
        trialEndDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
        notes: 'Interested in annual Gold or Premium membership.'
      },
      {
        fullName: 'Meera Nambiar',
        email: 'meera.n@gmail.com',
        phone: '+91 96622 33445',
        interest: 'Yoga & Wellness',
        source: 'Walk-in',
        status: 'New',
        notes: 'Looking for evening group yoga batches.'
      }
    ]);

    await Coupon.create([
      {
        code: 'WELCOME10',
        description: 'New member introductory 10% discount',
        discountType: 'Percentage',
        discountValue: 10,
        maxDiscount: 1000,
        validUntil: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000),
        usageLimit: 150,
        timesUsed: 14,
        status: 'Active'
      },
      {
        code: 'SUMMER500',
        description: 'Flat ₹500 discount on 3-month+ plans',
        discountType: 'Fixed',
        discountValue: 500,
        minPurchase: 2000,
        validUntil: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000),
        usageLimit: 50,
        timesUsed: 6,
        status: 'Active'
      },
      {
        code: 'FIT2026',
        description: 'Exclusive 20% annual discount for campus gym review demo',
        discountType: 'Percentage',
        discountValue: 20,
        maxDiscount: 2000,
        validUntil: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000),
        usageLimit: 200,
        timesUsed: 25,
        status: 'Active'
      }
    ]);

    // 13. Feedback & Reviews
    console.log('⭐ Seeding Member Ratings & Star Reviews...');
    await Feedback.create([
      {
        member: createdMembers[0].member._id,
        category: 'Trainer',
        trainer: trainer1._id,
        rating: 5,
        comment: 'Alex Vance is exceptional! Structured my hypertrophy program and corrected my deadlift form.',
        status: 'Approved'
      },
      {
        member: createdMembers[1].member._id,
        category: 'Class',
        rating: 5,
        comment: 'The HIIT classes with Sarah are intense and exhilarating! Best gym atmosphere in town.',
        status: 'Approved'
      },
      {
        member: createdMembers[2].member._id,
        category: 'Facility',
        rating: 4,
        comment: 'Great clean gym floor, top notch barbells and spacious locker rooms.',
        status: 'Approved'
      }
    ]);

    // 14. Notifications & Audit Logs
    console.log('🔔 Seeding System Notifications & Audit Trail...');
    await Notification.create([
      {
        user: adminUser._id,
        title: 'New Member Registered',
        message: 'John Doe has registered and paid for the Premium Plan.',
        type: 'info'
      },
      {
        user: createdMembers[0].user._id,
        title: 'Workout Plan Assigned',
        message: 'Coach Alex Vance assigned you the Push-Pull-Legs Hypertrophy Protocol.',
        type: 'success'
      }
    ]);

    await AuditLog.create([
      {
        actor: adminUser._id,
        actorName: 'GymFlow Administrator',
        actorRole: 'Admin',
        action: 'SYSTEM_INITIALIZED_AND_SEEDED',
        entity: 'System',
        details: 'Full DBMS project sample data seeded with 16 members, 4 plans, classes, and equipment.'
      }
    ]);

    console.log('\n=======================================================');
    console.log('🎉 GymFlow Complete Full-Stack Database Seeded!');
    console.log('=======================================================');
    console.log('🔑 DEMO CREDENTIALS:');
    console.log('   👑 Admin:   admin@gymflow.com    / Admin@123');
    console.log('   🏋️‍♂️ Trainer: trainer@gymflow.com  / Trainer@123');
    console.log('   👤 Member:  member@gymflow.com   / Member@123');
    console.log('=======================================================\n');

    if (require.main === module || process.argv[2] === '--exit') {
      process.exit(0);
    }
    return true;
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
