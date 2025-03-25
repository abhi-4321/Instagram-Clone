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
        let info = await transporter.sendMail({
            from: 'Instagram Clone',
            to: email,
            subject: title,
            html: body,
        });
        console.log("Email info: ", info)
        return info
    } catch (error: any) {
        console.log(error.message)
    }
}

export default mailSender