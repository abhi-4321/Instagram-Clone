import { Router } from "express"
import multer from "../util/multer"
import postController from '../controller/PostController'

const router = Router()

// Comment
router.post("/:userId/like/:postId", postController.comment)

// Like Post
router.post("/:userId/like/:postId", postController.likePost)

// Feed 
router.get("/", postController.getFeed)

// Create Post
router.post("/:id", multer.single('image'), postController.createPost)

// Delete Post
router.delete('/:uid/:pid', postController.deletePost)

// Get Post
router.get("/:uid/:pid", postController.getPostById)

// All Posts 
router.get("/:uid", postController.getAllPosts)

// Update Caption 
router.put("/:uid/:pid", postController.updateCaption)

export default router