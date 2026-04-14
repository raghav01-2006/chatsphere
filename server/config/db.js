const connectDB = async (retries = 5, delay = 5000) => {
  if (!process.env.MONGO_URI) {
    console.error('🔴 CRITICAL ERROR: MONGO_URI is not defined in environment variables.');
    console.error('💡 If you are on Render, add it to the "Environment" tab in the dashboard.');
    process.exit(1);
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, skip trying IPv6
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`❌ MongoDB attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt === retries) {
        console.error('🔴 Could not connect to MongoDB. Please check your MONGO_URI in server/.env');
        console.error('💡 Also verify Network Access in Atlas allows 0.0.0.0/0');
        process.exit(1);
      }
      console.log(`⏳ Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

module.exports = connectDB;
