import mongoose from "mongoose";
import {mailSender} from '../utils/mailSender.js';

const OTPSchema = new mongoose.Schema({
    email: {
		type: String,
		required: true,
	},
	otp: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		expires: 60 * 5
	}
})

async function sendVerificationEmail(email, otp) {
	try {
		await mailSender(
			email,
			"Verification Email",
			`<h1>Please confirm your OTP </h1>
             <p> Your OTP is ${otp} </p>
            `
		);
	} catch (error) {
		throw error;
	}
}

OTPSchema.pre("save", async function (next) {
	try{
		if (this.isNew) {
			await sendVerificationEmail(this.email, this.otp);
		}
		next();
	}catch(error){
		throw(error)
	}
	
});

export const OTP = mongoose.model("OTP", OTPSchema);