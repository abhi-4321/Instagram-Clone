import crypto from "crypto";
import {Request, Response} from "express";
import {User} from "../model/User";
import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand} from "@aws-sdk/client-s3";
import client from "../util/s3Client";
import {Story} from "../model/Story";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

const randomImageName = () => crypto.randomBytes(32).toString('hex')
const bucketName = process.env.BUCKET_NAME || 'myBucketName'

const likeStory = async (req: Request, res: Response) => {
    try {

        const userId = req.userId
        const storyId = parseInt(req.params.storyId)

        const story = await Story.findOne({id: storyId})

        if (!story) {
            res.status(404).json({message: "Post not found"})
            return
        }

        story.likedBy = story.likedBy ?? []
        let message: string

        // Remove Like
        if (story.likedBy.includes(userId)) {
            story.likedBy = story.likedBy.filter(it => it != userId)
            message = "Unliked"
        }
        // Add Like
        else {
            story.likedBy.push(userId)
            message = "Liked"
        }

        await story.save()
        res.status(200).json({message: message})

    } catch (error: any) {
        res.status(500).json({error: 'Failed to like post', details: error})
    }
}

const createStory = async (req: Request, res: Response) => {
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

        const count = await Story.countDocuments({}, {hint: "_id_"})

        const story = new Story({
            id: count + 1,
            userId: userId,
            caption: req.body.caption || "",
            postUrl: imageName
        })

        const createdStory = await story.save()

        if (!createdStory) {
            throw new Error("Unknown error occured")
        } else {
            res.status(201).json({message: "Post created successfully"})
        }

    } catch (error: any) {
        res.status(500).json({error: "Failed to create post", details: error})
    }
}

const deleteStory = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const storyId = parseInt(req.params.postId)

        const story = await Story.findOne({id: storyId, userId: userId})

        if (!story) {
            res.status(404).send({message: "Post not found"})
            return
        }

        const params = {
            Bucket: bucketName,
            Key: story.storyUrl
        }

        const command = new DeleteObjectCommand(params)
        await client.send(command)

        const deletedStory = await story.deleteOne()

        if (!deletedStory) {
            res.status(500).send({message: "Unkown error occured"})
        } else {
            res.status(200).send({message: "Post deleted"})
        }

    } catch (error: any) {
        res.status(500).json({error: 'Failed to delete post', details: error})
    }
}

const getStoryById = async (req: Request, res: Response) => {
    try {
        const storyId = parseInt(req.params.postId)
        const story = await Story.findOne({id: storyId})

        if (!story) {
            res.status(404).json({error: 'Post not found'})
        } else {
            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: story?.storyUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            const url = await getSignedUrl(client, command, {expiresIn: 3600})
            story.storyUrl = url

            res.status(200).json(story)
        }
    } catch (error: any) {
        res.status(500).json({error: 'Failed to fetch post', details: error})
    }
}

const getAllStories = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const stories = await Story.find({userId: userId})

        for (const story of stories) {
            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: story?.storyUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            const url = await getSignedUrl(client, command, {expiresIn: 3600})
            story.storyUrl = url
        }

        res.status(200).json(stories)

    } catch (error: any) {
        res.status(500).json({error: 'Failed to fetch posts', details: error})
    }
}

export default {
    likeStory,
    createStory,
    deleteStory,
    getStoryById,
    getAllStories,
}
