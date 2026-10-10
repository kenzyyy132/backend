const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const REQUIRED = ["MONGODB_URI", "DB_NAME", "JWT_SECRET"];


const loadEnv = () => {
  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (missing.length) {
    console.error(
      `Missing required environment variable(s): ${missing.join(", ")}\n` +
        "Copy .env.example to .env and fill in the values before starting."
    );
    process.exit(1);
  }

  return {
    port: Number(process.env.PORT) || 5000,
    nodeEnv: process.env.NODE_ENV || "development",
    mongoUri: process.env.MONGODB_URI,
    dbName: process.env.DB_NAME,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    clientUrl: process.env.CLIENT_URL || "",
    maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB) || 5,
  };
};

module.exports = loadEnv;
