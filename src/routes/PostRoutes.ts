import { Router } from "express"
import multer from "../util/multer"
import postController from '../controller/PostController'

const router = Router()

// Like Comment
router.post("/likeComment/:commentId", postController.likeComment)

// Comment
router.post("/comment/:postId", postController.comment)

// Like Post
router.post("/like/:postId", postController.likePost)

// Feed
router.get("/", postController.getFeed)

// Create Post
router.post("/", multer.single('image'), postController.createPost)

// Delete Post
router.delete('/:postId', postController.deletePost)

// Get Post
router.get("/:postId", postController.getPostById)

// All Posts
router.get("/all", postController.getAllPosts)

// Update Caption
router.put("/:postId", postController.updateCaption)

export default router
