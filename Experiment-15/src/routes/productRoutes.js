import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

// POST /products → create one product (body = full JSON)
router.post("/", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    return res.status(201).json(product);
  } catch (error) {
    console.error("[POST /products] Error:", error?.message || error);
    return res.status(400).json({
      message: "Failed to create product",
      error: String(error?.message || error),
    });
  }
});

// GET /products → all products
router.get("/", async (_req, res) => {
  try {
    const products = await Product.find({});
    return res.json(products);
  } catch (error) {
    console.error("[GET /products] Error:", error?.message || error);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
});

// GET /products/category/:cat → filter by category (case-sensitive)
router.get("/category/:cat", async (req, res) => {
  try {
    const { cat } = req.params;
    const products = await Product.find({ category: cat });
    return res.json(products);
  } catch (error) {
    console.error(
      "[GET /products/category/:cat] Error:",
      error?.message || error
    );
    return res
      .status(500)
      .json({ message: "Failed to fetch products by category" });
  }
});

export default router;
