const mongoose = require("mongoose");


const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME,
      serverSelectionTimeoutMS: 15000,
    });

    console.log(
      `MongoDB connected: ${conn.connection.host} (database: ${conn.connection.name})`
    );

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. The driver will retry automatically.");
    });

    return conn;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    console.error(
      "Check MONGODB_URI in .env, that your Atlas user/password are correct, " +
        "and that your current IP is on the Atlas Network Access list."
    );
    process.exit(1);
  }
};

module.exports = connectDB;
