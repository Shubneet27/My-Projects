import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../db.js";
import Product from "../models/Product.js";

async function seed(option = "A") {
  try {
    await connectDB();

    await Product.deleteMany({});
    console.log("[SEED] Cleared Product collection");

    if (option === "B") {
      console.log("[SEED] Using Option B: fixed ObjectIds");
      const id1 = new mongoose.Types.ObjectId("66f000000000000000000001");
      const id1v1 = new mongoose.Types.ObjectId("66f000000000000000000011");
      const id1v2 = new mongoose.Types.ObjectId("66f000000000000000000012");

      const id2 = new mongoose.Types.ObjectId("66f000000000000000000002");
      const id2v1 = new mongoose.Types.ObjectId("66f000000000000000000021");
      const id2v2 = new mongoose.Types.ObjectId("66f000000000000000000022");

      const id3 = new mongoose.Types.ObjectId("66f000000000000000000003");

      const docs = [
        {
          _id: id1,
          name: "Running Shoes",
          price: 120,
          category: "Footwear",
          variants: [
            { _id: id1v1, color: "Red", size: "M", stock: 10 },
            { _id: id1v2, color: "Blue", size: "L", stock: 5 },
          ],
        },
        {
          _id: id2,
          name: "Winter Jacket",
          price: 200,
          category: "Apparel",
          variants: [
            { _id: id2v1, color: "Black", size: "S", stock: 8 },
            { _id: id2v2, color: "Gray", size: "M", stock: 12 },
          ],
        },
        {
          _id: id3,
          name: "Smartphone",
          price: 699,
          category: "Electronics",
          variants: [],
        },
      ];
      await Product.insertMany(docs);
    } else {
      console.log("[SEED] Using Option A: default ObjectIds");
      await Product.insertMany([
        {
          name: "Running Shoes",
          price: 120,
          category: "Footwear",
          variants: [
            { color: "Red", size: "M", stock: 10 },
            { color: "Blue", size: "L", stock: 5 },
          ],
        },
        {
          name: "Winter Jacket",
          price: 200,
          category: "Apparel",
          variants: [
            { color: "Black", size: "S", stock: 8 },
            { color: "Gray", size: "M", stock: 12 },
          ],
        },
        {
          name: "Smartphone",
          price: 699,
          category: "Electronics",
          variants: [],
        },
      ]);
    }

    const count = await Product.countDocuments();
    console.log(`[SEED] Inserted ${count} products`);
  } catch (error) {
    console.error("[SEED] Error:", error?.message || error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("[SEED] Disconnected");
  }
}

// Allow selecting Option B via env var or argv
const modeFromEnv = process.env.SEED_MODE; // 'A' or 'B'
const modeFromArgv = process.argv.find((a) => a === "A" || a === "B");
const mode = modeFromArgv || modeFromEnv || "A";

seed(mode);
