import { Router } from "express"
import multer from "../util/multer"
import postController from '../controller/PostController'

const router = Router()

// Like Comment
router.post("/:userId/likeComment/:commentId", postController.likeComment)

// Comment
router.post("/:userId/comment/:postId", postController.comment)

// Like Post
router.post("/:userId/like/:postId", postController.likePost)

// Feed 
router.get("/:userId", postController.getFeed)

// Create Post
router.post("/:userId", multer.single('image'), postController.createPost)

// Delete Post
router.delete('/:userId/:postId', postController.deletePost)

// Get Post
router.get("/:postId", postController.getPostById)

// All Posts 
router.get("/all/:userId", postController.getAllPosts)

// Update Caption 
router.put("/:userId/:postId", postController.updateCaption)

export default router