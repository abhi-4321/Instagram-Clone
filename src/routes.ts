import { Router, Request, Response } from "express"
import UserRoutes from "./routes/UserRoutes"
import PostRoutes from "./routes/PostRoutes"
import dotenv from 'dotenv'
import HighlightRoute from "./routes/HighlightRoutes"

dotenv.config()

const route = Router()

/**
* #swagger.tags = ['User Controller']
* */
route.use('/user', UserRoutes) // User Routes
route.use('/post', PostRoutes) // Post Routes
route.use('/highlight', HighlightRoute) // Highlight Routes

// Test Route
route.get('/', (req: Request, res: Response) => {
    res.send('Server is working !!')
})

export default route
