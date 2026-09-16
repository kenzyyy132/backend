const express = require("express");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const productRoutes = require("./routes/product-routes");

dotenv.config();

const app = express();

app.use(express.json());

app.use("/api/v1/products", productRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Beauty E-Commerce API is running",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();