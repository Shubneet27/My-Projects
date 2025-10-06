import mongoose from "mongoose";

const VariantSchema = new mongoose.Schema(
  {
    color: { type: String },
    size: { type: String },
    stock: { type: Number },
  },
  { _id: true }
);

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    variants: [VariantSchema],
  },
  { timestamps: false }
);

export const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);
export default Product;
