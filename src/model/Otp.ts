import mongoose, {Document} from 'mongoose'
import mailSender from '../util/mailSender'

export interface Otp extends Document {
    email: string
    otp: string
    createdAt: Date
}

const otpSchema = new mongoose.Schema({
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
    }
})

// Create a TTL index on the `createdAt` field
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 }) // 60 seconds

// Define a function to send emails
async function sendVerificationEmail(email: string, otp: string) {
    try {
        const mailResponse = await mailSender(
            email,
            "Verification Email",
            "Your code is : " + otp
        )
    } catch (error) {
        console.log("Error occurred while sending email: ", error);
        throw error;
    }
}

otpSchema.pre("save", async function (next) {
    // Only send an email when a new document is created
    if (this.isNew) {
        console.log("Sending vertification mail")
        await sendVerificationEmail(this.email, this.otp)
    }
    next()
})

export const Otp =  mongoose.model("Otp", otpSchema, "otp")