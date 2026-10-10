const Product = require("../models/product-model");
const ApiError = require("../utils/api-error");
const asyncHandler = require("../utils/async-handler");
const { removeUploadedFile } = require("../middleware/upload-middleware");


const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, brand, stock } = req.body;

  const product = await Product.create({
    name,
    description,
    price,
    category,
    brand,
    stock: stock ?? 0,
   
    image: req.file ? `/uploads/${req.file.filename}` : req.body.image || "",
    createdBy: req.user?._id || null,
  });

  res.status(201).json({
    status: "success",
    message: "Product created successfully",
    data: product,
  });
});


const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.category) filter.category = req.query.category;
  if (req.query.brand) filter.brand = new RegExp(`^${escapeRegex(req.query.brand)}$`, "i");
  if (req.query.search) {
    const term = new RegExp(escapeRegex(req.query.search.trim()), "i");
    filter.$or = [{ name: term }, { description: term }, { brand: term }];
  }
  if (req.query.inStock === "true") filter.stock = { $gt: 0 };
  if (req.query.inStock === "false") filter.stock = 0;

  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }

  const SORT_OPTIONS = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    "price-asc": { price: 1 },
    "price-desc": { price: -1 },
    name: { name: 1 },
  };
  const sort = SORT_OPTIONS[req.query.sort] || SORT_OPTIONS.newest;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    results: products.length,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: skip + products.length < total,
      hasPrevPage: page > 1,
    },
    data: products,
  });
});

const getProductCategories = asyncHandler(async (req, res) => {
  const [categories, brands] = await Promise.all([
    Product.distinct("category"),
    Product.distinct("brand"),
  ]);

  res.status(200).json({
    status: "success",
    data: { categories: categories.sort(), brands: brands.sort() },
  });
});


const getProductById = asyncHandler(async (req, res) => {

  const product = await Product.findById(req.params.id).populate({
    path: "createdBy",
    select: "name email role",
  });

  if (!product) throw ApiError.notFound("Product not found");

  res.status(200).json({ status: "success", data: product });
});


const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) throw ApiError.notFound("Product not found");

  const UPDATABLE = ["name", "description", "price", "category", "brand", "stock"];
  UPDATABLE.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  if (req.file) {
    const previousImage = product.image;
    product.image = `/uploads/${req.file.filename}`;
    removeUploadedFile(previousImage);
  } else if (req.body.image !== undefined) {
    
    if (req.body.image === "" && product.image) removeUploadedFile(product.image);
    product.image = req.body.image;
  }

  await product.save();

  res.status(200).json({
    status: "success",
    message: "Product updated successfully",
    data: product,
  });
});


const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) throw ApiError.notFound("Product not found");

  removeUploadedFile(product.image);

  res.status(200).json({
    status: "success",
    message: "Product deleted successfully",
    data: product,
  });
});


function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  createProduct,
  getProducts,
  getProductCategories,
  getProductById,
  updateProduct,
  deleteProduct,
};
