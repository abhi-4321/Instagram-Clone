import { Router, Request, Response } from "express"
import { S3Client } from "@aws-sdk/client-s3"
import UserRoutes from "../routes/UserRoutes"
import PostRoutes from "../routes/PostRoutes"
import dotenv from 'dotenv'
import HighlightRoute from "../routes/HighlightRoutes"

dotenv.config()

const route = Router()

route.use('/user', UserRoutes) // User Routes
route.use('/post', PostRoutes) // Post Routes
route.use('/highlight', HighlightRoute) // Highlight Routes

// Test Route
route.get('/', (req: Request, res: Response) => {
    res.send('Hello World !!')
})

export default route