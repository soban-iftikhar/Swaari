import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

function connectDB() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || "Swaari";

  if (!mongoUri) {
    throw new Error("MongoDB URI is missing. Set MONGO_URI (or MONGODB_URI) in .env");
  }

  return mongoose
    .connect(mongoUri, {
      dbName,
    })
    .then(() => {
      console.log(`MongoDB connected successfully (db: ${dbName})`);
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    });
}

export default connectDB;
