const mongoose = require('mongoose');
const dns = require('dns');

let dbStatus = {
  isConnected: false,
  type: 'Unknown',
  host: null,
  database: null,
  readyState: 0,
  error: null
};

/**
 * DBMS LAB EXPLANATION - Database Connection Setup:
 * Mongoose connects Node.js to MongoDB. Here we attempt to connect to the configured MONGO_URI.
 * Supports both MongoDB Atlas (Cloud) and Local MongoDB (Community Edition).
 * As an intelligent fallback for live faculty demos, if no local MongoDB daemon or Atlas network is reachable,
 * we start an embedded MongoMemoryServer so MongoDB query operations & aggregations run flawlessly!
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    const errorMsg = 'MONGO_URI is not defined in environment variables. Please check server/.env file.';
    console.error(`❌ Database Configuration Error: ${errorMsg}`);
    dbStatus.error = errorMsg;
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  // If using MongoDB Atlas SRV, configure reliable public DNS servers (8.8.8.8 / 1.1.1.1)
  // to prevent Windows local router querySrv ECONNREFUSED errors
  if (mongoUri && mongoUri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (e) {
      // Ignore if not supported
    }
  }

  // Attempt standard connection
  try {
    if (mongoUri) {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 15000,
      });

      const isAtlas = mongoUri.includes('mongodb+srv://') || mongoUri.includes('.mongodb.net');
      dbStatus = {
        isConnected: true,
        type: isAtlas ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB Server',
        host: conn.connection.host,
        database: conn.connection.name,
        readyState: conn.connection.readyState,
        error: null
      };

      console.log(`=======================================================`);
      console.log(`✅ MongoDB Connected Successfully!`);
      console.log(`📡 Type:     ${dbStatus.type}`);
      console.log(`🖥️  Host:     ${dbStatus.host}`);
      console.log(`🗄️  Database: ${dbStatus.database}`);
      console.log(`=======================================================`);
      return conn;
    }
  } catch (err) {
    console.warn(`⚠️ Standard MongoDB URI connection failed: ${err.message}`);
    dbStatus.error = err.message;

    // In non-production, fall back to embedded MongoMemoryServer for flawless demo execution
    if (process.env.NODE_ENV !== 'production' || !mongoUri) {
      console.log(`🚀 Starting embedded MongoDB Memory Server for seamless live demonstration...`);

      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        const conn = await mongoose.connect(uri);

        dbStatus = {
          isConnected: true,
          type: 'Embedded MongoMemoryServer (Demo Mode)',
          host: '127.0.0.1 (In-Memory Engine)',
          database: conn.connection.name,
          readyState: conn.connection.readyState,
          error: null
        };

        console.log(`✅ MongoDB Memory Server active!`);
        console.log(`💡 Note: Database is running in high-performance embedded mode.`);

        // Automatically populate demo data so the system is ready to use immediately
        try {
          const seedData = require('../seed/seed');
          console.log(`🌱 Auto-seeding initial demo records...`);
          await seedData(true);
        } catch (seedErr) {
          console.warn(`⚠️ Auto-seed notice: ${seedErr.message}`);
        }

        return conn;
      } catch (memErr) {
        console.error(`❌ Embedded MongoDB connection error: ${memErr.message}`);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

const getDbStatus = () => {
  return {
    ...dbStatus,
    readyState: mongoose.connection.readyState,
    isConnected: mongoose.connection.readyState === 1
  };
};

module.exports = connectDB;
module.exports.getDbStatus = getDbStatus;
