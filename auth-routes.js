const express = require("express");

const { register, login, getMe } = require("../controllers/auth-controllers");
const { protect } = require("../middleware/auth-middleware");
const { uploadSingleImage } = require("../middleware/upload-middleware");
const validate = require("../middleware/validate-middleware");
const { registerRules, loginRules } = require("../validators/auth-validators");

const router = express.Router();


const registerChain = [uploadSingleImage("image"), registerRules, validate, register];
const loginChain = [loginRules, validate, login];

router.post("/register", ...registerChain);
router.post("/login", ...loginChain);


router.post("/signup", ...registerChain);
router.post("/signin", ...loginChain);

router.get("/me", protect, getMe);

module.exports = router;
