import { Router } from "express";
import { 
    registerUser, 
    resendOTP,
    verifyOTP,
    loginUser, 
    logoutUser, 
    getCurrentUser, 
    changeCurrentPassword, 
    updateAccountDetails
} from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()


router.route("/register").post(registerUser)
router.route("/resend-otp").post(resendOTP)
router.route("/verify-otp").post(verifyOTP)
router.route("/login").post(loginUser)

// //secured routes
router.route("/logout").post(verifyJWT,  logoutUser)
router.route("/profile").get(verifyJWT, getCurrentUser)
router.route("/change-password").patch(verifyJWT, changeCurrentPassword)
router.route("/update").patch(verifyJWT, updateAccountDetails)

export default router