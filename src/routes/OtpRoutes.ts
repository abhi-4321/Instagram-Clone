import {Request, Response, Router} from 'express'
import OtpController from '../controller/OtpController'

const router = Router()

router.post('/sendOtp', OtpController.sendOtp)

router.post("/verifyEmail", OtpController.verifyEmail)

export default router