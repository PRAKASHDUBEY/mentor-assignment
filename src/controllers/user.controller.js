import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { OTP } from "../models/otp.model.js";
import { User } from "../models/user.model.js";

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateAccessTokens = async(userId) =>{
  try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      return {accessToken}

  } catch (error) {
      throw new ApiError(500, "Something went wrong while generating referesh and access token")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const {email, password} = req.body;

  if ([email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "User with email already exists");
  }

  const user = await User.create({
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select("-password");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  const otp = generateOTP();
	await OTP.create({email, otp});
  

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered Successfully. Please verify OTP."));
});


const verifyOTP = asyncHandler(async (req, res) => {
  const {email, otp} = req.body;
  
  const user = await User.findOne({ email });
  if(user.isVerified){
    throw new ApiError(400, "User already verified");
  }
  const response = await OTP.findOne({ email }).sort({ createdAt: -1 });
  if (!response ) {
    const otp = generateOTP();
    await OTP.create({email, otp});
  
    throw new ApiError(400, "OTP expired. Enter new OTP");
  }

  if (otp !== response.otp) {
    throw new ApiError(400, "OTP is not valid");
  }
  user.isVerified = true;
  user.save();

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "OTP Verified. Please Login."));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (!user.isVerified) {
    throw new ApiError(400, "User not verified");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken } = await generateAccessTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password");

  const options = {
    httpOnly: true,
    secure: true,
    path:"/", 
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {

  const options = {
    httpOnly: true,
    secure: true,
    path:"/", 
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const getCurrentUser = asyncHandler(async (req, res) => {

  const user = await User.findById(req.user._id).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {

  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { location, age, work } = req.body;

    const updatedFields = { location, age, work };
    const filteredFields = Object.fromEntries(
      Object.entries(updatedFields).filter(
        ([_, value]) => value !== undefined && value !== 0
      )
    );

    const user = await User.findById(req.user._id);

    Object.assign(user, filteredFields);
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Account details updated successfully"));
  }
);

export {
  registerUser,
  verifyOTP,
  loginUser,
  logoutUser,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
};
