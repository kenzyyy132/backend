/**
 * Database seeder.
 *
 *   npm run seed          Wipe the users + products collections and import
 *                         the sample catalogue and accounts.
 *   npm run seed:destroy  Remove all seeded users and products.
 *
 * Passwords are stored as bcrypt hashes: the plaintext values below are run
 * through the User model, whose pre-save hook does the hashing. No plaintext
 * password ever reaches MongoDB.
 *
 * Only the `users` and `products` collections are touched. Any other
 * collection in the database is left alone.
 */

const dns = require("dns");

const mongoose = require("mongoose");

// Same DNS workaround as server.js - the seeder connects to Atlas on its own.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const loadEnv = require("../config/env");

loadEnv();

const User = require("../models/user-model");
const Product = require("../models/product-model");

const userData = require("./users.json");
const productData = require("./products.json");

const connect = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.DB_NAME,
    serverSelectionTimeoutMS: 15000,
  });
  console.log(`Connected to database '${mongoose.connection.name}'`);
};

const importData = async () => {
  await connect();

  console.log("Clearing existing users and products...");
  await Promise.all([User.deleteMany({}), Product.deleteMany({})]);

  // create() (not insertMany) so the pre-save hook hashes every password.
  console.log(`Creating ${userData.length} users...`);
  const users = await User.create(userData);

  const admin = users.find((u) => u.role === "admin");

  console.log(`Creating ${productData.length} products...`);
  const products = productData.map((p) => ({ ...p, createdBy: admin ? admin._id : null }));
  await Product.insertMany(products);

  // Verify the hashing actually happened rather than assuming it.
  const check = await User.findOne({ email: userData[0].email }).select("+password");
  const hashed = Boolean(check && check.password.startsWith("$2"));

  console.log("\n--------------------------------------------------");
  console.log("  Seed complete");
  console.log("--------------------------------------------------");
  console.log(`  Database        : ${mongoose.connection.name}`);
  console.log(`  Users           : ${users.length}`);
  console.log(`  Products        : ${productData.length}`);
  console.log(`  Passwords hashed: ${hashed ? "yes (bcrypt)" : "NO - CHECK THE MODEL"}`);
  console.log("\n  Test credentials (local use only)");
  userData.forEach((u) => {
    console.log(`    ${u.role.padEnd(5)}  ${u.email.padEnd(24)}  ${u.password}`);
  });
  console.log("--------------------------------------------------\n");
};

const destroyData = async () => {
  await connect();

  const [u, p] = await Promise.all([User.deleteMany({}), Product.deleteMany({})]);

  console.log(`Deleted ${u.deletedCount} users and ${p.deletedCount} products.`);
};

const run = async () => {
  const action = process.argv[2] === "--destroy" ? destroyData : importData;

  try {
    await action();
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    if (error.errors) {
      Object.values(error.errors).forEach((e) => console.error(`  - ${e.message}`));
    }
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
};

run();
