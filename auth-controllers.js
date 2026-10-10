const User = require("../models/user-model");
const ApiError = require("../utils/api-error");
const asyncHandler = require("../utils/async-handler");
const generateToken = require("../utils/generate-token");


const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists.");
  }


  const user = await User.create({
    name,
    email,
    password,
    phone,
    address,
    image: req.file ? `/uploads/${req.file.filename}` : "",
  });

  res.status(201).json({
    status: "success",
    message: "Account created successfully",
    token: generateToken(user),
  
    data: user,
  });
});


const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

 
  const user = await User.findOne({ email }).select("+password");


  if (!user || !(await user.matchPassword(password))) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  if (!user.active) {
    throw ApiError.unauthorized("This account has been deactivated.");
  }

  res.status(200).json({
    status: "success",
    message: "Logged in successfully",
    token: generateToken(user),
    data: user,
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: "success",
    data: req.user,
  });
});

module.exports = { register, login, getMe };
