import { Router, Request, Response } from "express"
import UserRoutes from "../routes/UserRoutes"
import PostRoutes from "../routes/PostRoutes"
import dotenv from 'dotenv'
import HighlightRoute from "../routes/HighlightRoutes"
import FollowRoutes from "../routes/FollowRoutes"

dotenv.config()

const route = Router()

route.use('/user', UserRoutes) // User Routes
route.use('/post', PostRoutes) // Post Routes
route.use('/highlight', HighlightRoute) // Highlight Routes
route.use('/user', FollowRoutes) // Follow Routes

// Test Route
route.get('/', (req: Request, res: Response) => {
    res.send('Hello World !!')
})

export default route