import { Router, Request, Response } from "express"
import UserRoutes from "./routes/UserRoutes"
import PostRoutes from "./routes/PostRoutes"
import dotenv from 'dotenv'
import HighlightRoute from "./routes/HighlightRoutes"
import AuthRoutes from "./routes/AuthRoutes";
import StoryRoute from "./routes/StoryRoutes";
import authMiddleware from "./util/verifyToken";
import ChatRoutes from "./routes/ChatRoutes";

dotenv.config()

const route = Router()

route.use('/user', authMiddleware, UserRoutes) // User Routes
route.use('/post', authMiddleware, PostRoutes) // Post Routes
route.use('/highlight', authMiddleware, HighlightRoute) // Highlight Routes
route.use('/story', authMiddleware, StoryRoute) // Story Routes
route.use('/auth', AuthRoutes) // Auth Routes
route.use('/chat', authMiddleware, ChatRoutes) // Chat Routes

// Test Route
route.get('/', (_req: Request, res: Response) => {
    res.send('Server is working !!')
})

export default route
