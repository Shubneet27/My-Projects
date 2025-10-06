import mongoose from "mongoose";

const DEFAULT_URI = "mongodb://127.0.0.1:27017/ecommerceDB";

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI || DEFAULT_URI;
  try {
    if (!mongoUri) {
      throw new Error("Missing Mongo URI");
    }

    mongoose.set("strictQuery", true);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[DB] Connected to MongoDB at ${mongoUri}`);
  } catch (error) {
    console.error("[DB] Mongo connection error:", error?.message || error);
    console.error(
      "[DB] Ensure Mongo is running locally or MONGO_URI is set in .env"
    );
    process.exitCode = 1;
    throw error;
  }
}

export default connectDB;
