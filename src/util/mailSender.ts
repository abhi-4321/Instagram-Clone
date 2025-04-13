import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const mailSender = async (email: string, title: string, body: string) => {
    try {
        // Create a Transporter to send emails
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            host: process.env.MAIL_HOST,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            }
        })
        // Send emails to users
        return await transporter.sendMail({
            from: `"Instagram Clone" <${process.env.MAIL_USER}>`,
            to: email,
            subject: title,
            html: body,
        })
    } catch (error: any) {
        console.log(error.message)
    }
}

export default mailSender