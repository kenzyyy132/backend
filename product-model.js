const mongoose = require("mongoose");

const PRODUCT_CATEGORIES = ["skincare", "makeup", "perfume", "sets"];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [120, "Product name cannot exceed 120 characters"],
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      minlength: [10, "Product description must be at least 10 characters"],
      maxlength: [2000, "Product description cannot exceed 2000 characters"],
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },

    category: {
      type: String,
      required: [true, "Product category is required"],
      enum: {
        values: PRODUCT_CATEGORIES,
        message: `Category must be one of: ${PRODUCT_CATEGORIES.join(", ")}`,
      },
    },

    brand: {
      type: String,
      required: [true, "Product brand is required"],
      trim: true,
      maxlength: [80, "Brand cannot exceed 80 characters"],
    },

    stock: {
      type: Number,
      required: [true, "Product stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },

   
    image: {
      type: String,
      default: "",
      trim: true,
    },

   
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


productSchema.index({ name: "text", description: "text", brand: "text" });
productSchema.index({ category: 1, price: 1 });

productSchema.virtual("inStock").get(function () {
  return this.stock > 0;
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
module.exports.PRODUCT_CATEGORIES = PRODUCT_CATEGORIES;
