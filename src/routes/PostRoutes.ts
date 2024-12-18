import { Router, Request, Response } from "express"
import { User } from "../model/User"
import { Post } from '../model/Post'
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import crypto from 'crypto'
import { Multer } from "multer"
import dotenv from 'dotenv'
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

dotenv.config()

// Image Name Generator
const randomImageName = () => crypto.randomBytes(32).toString('hex')

const bucketName = process.env.BUCKET_NAME || 'myBucketName'

const postRoute = (client: S3Client, multer: Multer) => {

    const router = Router()

    // Feed 
    router.get("/", async (req: Request, res: Response) => {
        try {
            const posts = await Post.find()

            for (const post of posts) {
                const getObjectParams = {
                    Bucket: process.env.BUCKET_NAME!!,
                    Key: post?.postUrl
                }

                const command = new GetObjectCommand(getObjectParams)
                const url = await getSignedUrl(client, command, { expiresIn: 3600 })
                post!!.postUrl = url
            }

            res.status(200).json(posts)

        } catch (error: any) {
            res.status(500).json({ error: 'Failed to fetch posts', details: error })
        }
    })

    // Create Post
    router.post("/:id", multer.single('image'), async (req: Request, res: Response) => {
        try {
            if (!req.file)
                res.status(400).json({ message: "Bad Request" })

            const id = parseInt(req.params.id)
            const user = await User.findOne({ id: id })

            if (!user)
                res.status(404).json({ message: "User not found" })
            
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

            const count = await Post.countDocuments({ userId: id })

            const post = new Post({
                id: count + 1,
                userId: id,
                caption: req.body.caption || "",
                postUrl: imageName
            })

            await post.save()

            // console.log(post)

            const list = await Post.find({ userId: id })
            user!!.posts = list

            res.status(201).json(user)
        } catch (error) {
            res.status(500).json({ error: "Failed to create post", details: error })
        }
    })

    // Delete Post
    router.delete('/:uid/:pid', async (req: Request, res: Response) => {
        const uid = parseInt(req.params.uid)
        const pid = parseInt(req.params.pid)

        const post = await Post.findOneAndDelete({ id: pid, userId: uid })

        if (!post)
            res.status(404).send({ message: "Post not found" })

        res.status(200).send({ message: "Post deleted" })
    })

    // Get Post
    router.get("/:uid/:pid", async (req: Request, res: Response) => {
        try {
            const uid = parseInt(req.params.uid)
            const pid = parseInt(req.params.pid)
            const post = await Post.findOne({ id: pid, userId: uid })

            if (!post) {
                res.status(404).json({ error: 'Post not found' })
                res.end()
            } else {
                const getObjectParams = {
                    Bucket: process.env.BUCKET_NAME!!,
                    Key: post?.postUrl
                }

                const command = new GetObjectCommand(getObjectParams)
                const url = await getSignedUrl(client, command, { expiresIn: 3600 })
                post!!.postUrl = url

                res.status(200).json(post)
            }
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to fetch post', details: error })
        }
    })

    // All Posts 
    router.get("/:uid", async (req: Request, res: Response) => {
        try {
            const uid = parseInt(req.params.uid)
            const posts = await Post.find({ userId: uid })

            for (const post of posts) {
                const getObjectParams = {
                    Bucket: process.env.BUCKET_NAME!!,
                    Key: post?.postUrl
                }

                const command = new GetObjectCommand(getObjectParams)
                const url = await getSignedUrl(client, command, { expiresIn: 3600 })
                post!!.postUrl = url
            }

            res.status(200).json(posts)

        } catch (error: any) {
            res.status(500).json({ error: 'Failed to fetch posts', details: error })
        }
    })

    // Update Caption 
    router.put("/:uid/:pid", async (req: Request, res: Response) => {
        try {
            const uid = parseInt(req.params.uid)
            const pid = parseInt(req.params.pid)
            const caption = req.body.caption

            if (caption == null)
                res.status(400).json({ error: "Bad Request" })

            const post = await Post.findOneAndUpdate({ id: pid, userId: uid }, { caption: caption }, { new: true })

            if (post == null)
                res.status(404).json({ error: "Post Not Found" })

            res.status(200).json({ message: "Caption updated" })
        } catch (error) {
            res.status(500).json({ error: 'Failed to update caption', details: error })
        }

    })

    return router
}

export default postRoute