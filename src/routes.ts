import { Router, Request, Response } from "express"
import UserRoutes from "./routes/UserRoutes"
import PostRoutes from "./routes/PostRoutes"
import FollowRoutes from "./routes/FollowRoutes"
import dotenv from 'dotenv'
import HighlightRoute from "./routes/HighlightRoutes"
import AuthRoutes from "./routes/AuthRoutes";
import authMiddleware from "./util/verifyToken";

dotenv.config()

const route = Router()

route.use('/user', authMiddleware, UserRoutes) // User Routes
route.use('/post', authMiddleware, PostRoutes) // Post Routes
route.use('/highlight', authMiddleware, HighlightRoute) // Highlight Routes
route.use('/follow', authMiddleware, FollowRoutes) // Follow Routes
route.use('/auth', AuthRoutes) // Auth Routes

// Test Route
route.get('/', (req: Request, res: Response) => {
    res.send('Server is working !!')
})

export default route
