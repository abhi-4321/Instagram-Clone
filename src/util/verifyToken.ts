import {Request, Response, NextFunction} from "express"
import { Token } from "../model/Token";
import jwt from "jsonwebtoken";

const JWT_SECRET = 'chintapakdumdum'

const verifyToken = async (token: string): Promise<number|undefined> => {
    try {
        // Decode the token
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }

        console.log(decoded)

        // Find the token in the database
        const storedToken = await Token.findOne({ userId: decoded.userId })

        // Check if the token matches the stored token and hasn't expired
        if (!storedToken || storedToken.token !== token)
            return undefined

        // If all checks pass, return true
        return decoded.userId
    } catch (err: any) {
        console.error("Token verification error:", err.message)
        return undefined // Invalid token
    }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"]
    const token = authHeader?.split(" ")[1]

    if (!token) {
        res.status(401).json({ error: "Authentication token is missing" })
        return
    }

    const userId = await verifyToken(token)

    if (!userId) {
        res.status(401).json({ error: "Invalid or expired token" })
        return
    }

    req.userId = userId!!

    next() // Proceed to the next middleware or route handler
}

export default authMiddleware
