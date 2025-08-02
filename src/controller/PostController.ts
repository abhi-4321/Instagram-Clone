import {Request, Response} from "express"
import {User} from "../model/User"
import {Post} from '../model/Post'
import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand} from "@aws-sdk/client-s3"
import crypto from 'crypto'
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"
import client from "../util/s3Client"
import {Comment} from "../model/Comment"
import {FollowEntry} from "../model/Followers"
import {Saved} from "../model/Saved";

// Image Name Generator
const randomImageName = () => crypto.randomBytes(32).toString('hex')
const bucketName = process.env.BUCKET_NAME || 'myBucketName'

const likeComment = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const commentId = parseInt(req.params.commentId)

        const comment = await Comment.findOne({id: commentId})

        if (!comment) {
            res.status(404).json({message: "Comment not found"})
            return
        }

        comment.likedBy = comment.likedBy ?? []

        let message: string

        // Remove Like
        if (comment.likedBy.includes(userId)) {
            comment.likedBy = comment.likedBy.filter(it => it != userId)
            message = "Unliked"
        }
        // Add Like
        else {
            comment.likedBy.push(userId)
            message = "Liked"
        }

        comment.likesCount = comment.likedBy.length.toString()
        await comment.save()
        res.status(200).json({message: message})

    } catch (error: any) {

    }
}

const comment = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const postId = parseInt(req.params.postId)

        const comment = req.body.comment

        if (!comment || comment == "") {
            res.status(400).json({message: "Bad Request"})
            return
        }

        const post = await Post.findOne({id: postId})

        if (!post) {
            res.status(404).json({message: "Post not found"})
            return
        }

        const count = await Comment.countDocuments({postId: postId})

        const commentModel = new Comment({
            id: count + 1,
            userId: userId,
            postId: postId,
            comment: comment
        })

        const savedComment = await commentModel.save()

        if (!savedComment) {
            res.status(500).json({error: 'Failed to add comment', details: "Unknown error occured"})
        } else {
            res.status(201).json({message: "Comment added"})
        }
    } catch (error: any) {
        res.status(500).json({error: 'Failed to add comment', details: error})
    }
}

const likePost = async (req: Request, res: Response) => {
    try {

        const userId = req.userId
        const postId = parseInt(req.params.postId)

        const post = await Post.findOne({id: postId})

        if (!post) {
            res.status(404).json({message: "Post not found"})
            return
        }

        post.likedBy = post.likedBy ?? []
        let message: string

        // Remove Like
        if (post.likedBy.includes(userId)) {
            post.likedBy = post.likedBy.filter(it => it != userId)
            message = "Unliked"
        }
        // Add Like
        else {
            post.likedBy.push(userId)
            message = "Liked"
        }

        post.likesCount = post.likedBy.length.toString()
        await post.save()
        res.status(200).json({message: message})

    } catch (error: any) {
        res.status(500).json({error: 'Failed to like post', details: error})
    }
}

const getFeed = async (req: Request, res: Response) => {
    try {

        const userId = req.userId
        const followedAccounts: number[] = (await FollowEntry.findOne({
            userId: userId
        }).select('followingList'))?.followingList ?? []

        const users = await User.find({
            id: {$ne: userId},
            $or: [
                {private: false}, // Public accounts
                {private: true, id: {$in: followedAccounts}} // Private accounts followed by the user
            ]
        }, 'id username profileImageUrl')

        const listOfUsers: number[] = users.map(user => user.id)
        const posts = await Post.find({userId: {$in: listOfUsers}})

        for (const post of posts) {
            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: post?.postUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            post.postUrl = await getSignedUrl(client, command, {expiresIn: 3600})

            post.comments = await Comment.find({postId: post.id})
            post.commentsCount = post.comments.length.toString()

            const userS = users.filter(it => it.id == post.userId)
            let user = null

            if (!userS || userS.length == 0) {
            } else {
                user = userS[0]
            }

            const getObjectParams2 = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: user!!.profileImageUrl
            }
            const command2 = new GetObjectCommand(getObjectParams2)
            const url2 = await getSignedUrl(client, command2, {expiresIn: 3600})

            post.username = user!!.username
            post.profileImageUrl = url2
        }

        res.status(200).json(posts)

    } catch (error: any) {
        res.status(500).json({error: 'Failed to fetch posts', details: error})
    }
}

const createPost = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({message: "Bad Request"})
            return
        }
        const userId = req.userId
        const user = await User.findOne({id: userId})

        if (!user) {
            res.status(404).json({message: "User not found"})
            return
        }
        // Upload image to S3 Bucket
        const imageName = randomImageName()

        const params = {
            Bucket: bucketName,
            Key: imageName,
            Body: req.file?.buffer,
            ContentType: req.file?.mimetype
        }

        const command = new PutObjectCommand(params)
        await client.send(command)

        const count = await Post.countDocuments({}, {hint: "_id_"})

        const post = new Post({
            id: count + 1,
            userId: userId,
            caption: req.body.caption || "",
            postUrl: imageName,
            username: user.username,
            profileImageUrl: user.profileImageUrl
        })

        const createdPost = await post.save()

        if (!createdPost) {
            res.status(500).json({error: "Failed to create post", details: "Unknown error occurred"})
        } else {
            res.status(201).json({message: "Post created successfully"})
        }

    } catch (error: any) {
        res.status(500).json({error: "Failed to create post", details: error})
    }
}

const deletePost = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const postId = parseInt(req.params.postId)

        const post = await Post.findOne({id: postId, userId: userId})

        if (!post) {
            res.status(404).send({message: "Post not found"})
            return
        }

        const params = {
            Bucket: bucketName,
            Key: post.postUrl
        }

        const command = new DeleteObjectCommand(params)
        await client.send(command)

        const deletedPost = await post.deleteOne()

        if (!deletedPost) {
            res.status(500).send({message: "Unkown error occured"})
        } else {
            res.status(200).send({message: "Post deleted"})
        }

    } catch (error: any) {
        res.status(500).json({error: 'Failed to delete post', details: error})
    }
}

const getPostById = async (req: Request, res: Response) => {
    try {
        const postId = parseInt(req.params.postId)
        const post = await Post.findOne({id: postId})

        if (!post) {
            res.status(404).json({error: 'Post not found'})
        } else {
            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: post?.postUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            post.postUrl = await getSignedUrl(client, command, {expiresIn: 3600})

            post.comments = await Comment.find({postId: post.id})
            post.commentsCount = post.comments.length.toString()

            res.status(200).json(post)
        }
    } catch (error: any) {
        res.status(500).json({error: 'Failed to fetch post', details: error})
    }
}

const getAllPosts = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const posts = await Post.find({userId: userId})

        for (const post of posts) {
            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: post?.postUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            post.postUrl = await getSignedUrl(client, command, {expiresIn: 3600})

            post.comments = await Comment.find({postId: post.id})
            post.commentsCount = post.comments.length.toString()
        }

        res.status(200).json(posts)

    } catch (error: any) {
        res.status(500).json({error: 'Failed to fetch posts', details: error})
    }
}

const updateCaption = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const postId = parseInt(req.params.postId)
        const caption = req.body.caption

        if (!caption) {
            res.status(400).json({error: "Bad Request"})
            return
        }
        const post = await Post.findOneAndUpdate({id: postId, userId: userId}, {caption: caption}, {new: true})

        if (!post) {
            res.status(404).json({error: "Post Not Found"})
        } else {
            res.status(200).json({message: "Caption updated"})
        }
    } catch (error: any) {
        res.status(500).json({error: 'Failed to update caption', details: error})
    }
}

const exploreSection = async (req: Request, res: Response) => {
    try {
        const userId = req.userId

        const users = await User.find({
            id: {$ne: userId},
            $or: [{private: false}]// Public accounts
        }, 'id username profileImageUrl')

        const listOfUsers: number[] = users.map(user => user.id)
        const posts = await Post.find({userId: {$in: listOfUsers}})

        for (const post of posts) {
            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: post?.postUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            post.postUrl = await getSignedUrl(client, command, {expiresIn: 3600})

            post.comments = await Comment.find({postId: post.id})
            post.commentsCount = post.comments.length.toString()

            const userS = users.filter(it => it.id == post.userId)
            let user = null

            if (!userS || userS.length == 0) {
            } else {
                user = userS[0]
            }

            const getObjectParams2 = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: user!!.profileImageUrl
            }
            const command2 = new GetObjectCommand(getObjectParams2)
            const url2 = await getSignedUrl(client, command2, {expiresIn: 3600})

            post.username = user!!.username
            post.profileImageUrl = url2
        }

        res.status(200).json(posts)

    } catch (error: any) {
        res.status(500).json({error: 'Failed to fetch posts', details: error})
    }
}

const savePost = async (req: Request, res: Response) => {
    try {
        const userId = req.userId // set via auth middleware
        const postId = parseInt(req.params.postId)

        const exists = await Post.exists({id: postId})

        if (!exists) {
            res.status(400).json({message: 'Invalid postId'})
        }

        const savedPost = new Saved({
            postId: postId,
            userId: userId
        })
        const saved = await savedPost.save()

        res.status(201).json({message: 'Post saved successfully', saved})
    } catch (err: any) {
        if (err.code === 11000) {
            res.status(409).json({message: 'Post already saved'})
        }

        console.error(err)
        res.status(500).json({message: 'Failed to save post'})
    }
}

const fetchSaved = async (req: Request, res: Response) => {
    try {
        const userId = req.userId

        // Fetch all saved post IDs for the user
        const saved = await Saved.find({userId}).select('postId')

        const postIds = saved.map(s => s.postId)

        if (postIds.length === 0) {
            res.status(200).json([])
        } else {
            const posts = await Post.find({ id: { $in: postIds } })

            const enrichedPosts = await Promise.all(posts.map(async post => {
                const signedPostUrl = post.postUrl
                    ? await getSignedUrl(
                        client,
                        new GetObjectCommand({ Bucket: process.env.BUCKET_NAME!!, Key: post.postUrl }),
                        { expiresIn: 3600 }
                    )
                    : ""

                const comments = await Comment.find({ postId: post.id })
                const commentsCount = comments.length.toString()

                const user = await User.findOne({ id: post.userId }).select('username profileImageUrl')
                const signedProfileImageUrl = user?.profileImageUrl
                    ? await getSignedUrl(
                        client,
                        new GetObjectCommand({ Bucket: process.env.BUCKET_NAME!!, Key: user.profileImageUrl }),
                        { expiresIn: 3600 }
                    )
                    : ""

                return {
                    id: post.id,
                    caption: post.caption,
                    postUrl: signedPostUrl,
                    userId: post.userId,
                    username: user?.username || '',
                    profileImageUrl: signedProfileImageUrl,
                    comments,
                    commentsCount
                }
            }))

            res.status(200).json(enrichedPosts)
        }
    } catch (err) {
        console.error('Error fetching saved posts', err)
        res.status(500).json({message: 'Server error'})
    }
}

const unSavePost = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const postId = parseInt(req.params.postId)

        const removed = await Saved.findOneAndDelete({ userId, postId })

        if (!removed) {
            res.status(404).json({ message: 'Saved post not found' })
        }

        res.status(200).json({ message: 'Post removed from saved list' })
    } catch (err) {
        console.error('Error removing saved post:', err)
        res.status(500).json({ message: 'Server error' })
    }
}

export default {
    getFeed,
    createPost,
    deletePost,
    getPostById,
    getAllPosts,
    updateCaption,
    likePost,
    comment,
    likeComment,
    exploreSection,
    savePost,
    fetchSaved,
    unSavePost
}
