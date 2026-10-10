const dns = require("dns");
const path = require("path");

const express = require("express");
const cors = require("cors");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const loadEnv = require("./config/env");

const env = loadEnv();

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth-routes");
const userRoutes = require("./routes/user-routes");
const productRoutes = require("./routes/product-routes");
const { notFound, errorHandler } = require("./middleware/error-middleware");

const app = express();

app.use(
  cors({
    origin: env.clientUrl ? env.clientUrl.split(",").map((o) => o.trim()) : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));


app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "7d",
    fallthrough: true,
  })
);

/* --------------------------------- Routes ---------------------------------- */

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Beauty E-Commerce API is running",
    version: "v1",
    docs: "See README.md for the full endpoint reference",
    endpoints: {
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      products: "/api/v1/products",
      uploads: "/uploads/<filename>",
    },
  });
});


app.get("/api/v1/health", (req, res) => {
  const mongoose = require("mongoose");
  const states = ["disconnected", "connected", "connecting", "disconnecting"];

  res.status(200).json({
    status: "success",
    data: {
      server: "up",
      database: states[mongoose.connection.readyState] || "unknown",
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    },
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productRoutes);



app.use(notFound);
app.use(errorHandler);



const startServer = async () => {
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(`Server running in ${env.nodeEnv} mode on http://localhost:${env.port}`);
  });

  
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
    server.close(() => process.exit(1));
  });

  const shutdown = (signal) => () => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown("SIGINT"));
  process.on("SIGTERM", shutdown("SIGTERM"));
};


if (require.main === module) {
  startServer();
}

module.exports = app;
