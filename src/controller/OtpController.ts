import otpGenerator from 'otp-generator'
import {Request, Response} from "express"
import {User} from "../model/User"
import {Otp} from "../model/Otp"

const sendOtp = async (req: Request, res: Response) => {
    try {
        const email = req.body.email
        console.log(email)
        // Check if user is already present
        const checkUserPresent = await User.findOne({ email: email })

        // If user found with provided email
        if (checkUserPresent) {
            res.status(401).json({
                success: false,
                message: 'User is already registered',
            })
            return
        }
        let otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        })
        let result = await Otp.findOne({ otp: otp })
        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
            });
            result = await Otp.findOne({ otp: otp })
        }
        const otpPayload = { email, otp }
        const otpBody = await Otp.create(otpPayload)
        console.log(otpBody)
        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            otp: otp,
        });
    } catch (error: any) {
        console.log(error.message)
        res.status(500).json({ success: false, error: error.message })
    }
}

const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body
        // Check if all details are provided
        if (!email || !otp) {
            res.status(403).json({
                success: false,
                message: 'All fields are required',
            })
            return
        }
        // Check if user already exists
        const existingUser = await User.findOne({ email : email })
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'A user with this email already exists',
            })
            return
        }
        // Find the most recent OTP for the email
        const response = await Otp.find({ email }).sort({ createdAt: -1 }).limit(1)
        if (response.length === 0 || otp !== response[0].otp) {
            res.status(400).json({
                success: false,
                message: 'The OTP is invalid',
            })
            return
        }

        res.status(201).json({
            success: true,
            message: 'Email verified successfully',
        })
    } catch (error: any) {
        console.log(error.message)
        res.status(500).json({ success: false, error: error.message })
    }
}

export default {
    sendOtp,
    verifyEmail
}