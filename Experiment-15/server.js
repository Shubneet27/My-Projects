import "dotenv/config";
import express from "express";
import cors from "cors";

import connectDB from "./src/db.js";
import productRouter from "./src/routes/productRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// DB connect
await connectDB();

// Mount router
app.use("/products", productRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
