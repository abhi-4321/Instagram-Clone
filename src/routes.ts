import { Router, Request, Response } from "express"
import Multer from 'multer'
import { S3Client } from "@aws-sdk/client-s3"
import UserRoutes from "./routes/UserRoutes"
import PostRoutes from "./routes/PostRoutes"
import dotenv from 'dotenv'
import HighlightRoute from "./routes/HighlightRoutes"

dotenv.config()

const route = Router()

// Multer 
const storage = Multer.memoryStorage()
const multer = Multer({ storage })

// AWS S3 Client
const client = new S3Client({
    credentials: {
        accessKeyId: process.env.ACCESS_KEY!!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!!
    },
    region: process.env.BUCKET_REGION!!
})

route.use('/user', UserRoutes(client, multer)) // User Routes
route.use('/post', PostRoutes(client, multer)) // Post Routes
route.use('/highlight', HighlightRoute(client, multer)) // Highlight Routes

// Test Route
route.get('/', (req: Request, res: Response) => {
    res.send('Hello World !!')
})

export default route