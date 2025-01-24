import {Request, Response, NextFunction} from "express"
import { Token } from "../model/Token";
import jwt from "jsonwebtoken";

const JWT_SECRET = 'chintapakdumdum'

const verifyToken = async (token: string): Promise<boolean> => {
    try {
        // Decode the token
        const decoded = jwt.verify(token, JWT_SECRET) as { username: string }

        // Find the token in the database
        const storedToken = await Token.findOne({ username: decoded.username })

        // Check if the token matches the stored token and hasn't expired
        if (!storedToken || storedToken.token !== token)
            return false

        // If all checks pass, return true
        return true
    } catch (err: any) {
        console.error("Token verification error:", err.message)
        return false // Invalid token
    }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"]
    const token = authHeader?.split(" ")[1]

    if (!token) {
        res.status(401).json({ error: "Authentication token is missing" })
        return
    }

    const isValid = await verifyToken(token)

    if (!isValid) {
        res.status(401).json({ error: "Invalid or expired token" })
        return
    }

    next() // Proceed to the next middleware or route handler
}

export default authMiddleware
