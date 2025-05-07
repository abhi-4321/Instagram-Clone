import crypto from "crypto";
import {Request, Response} from "express";
import {User} from "../model/User";
import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand} from "@aws-sdk/client-s3";
import client from "../util/s3Client";
import {Story} from "../model/Story";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {FollowEntry} from "../model/Followers";

const randomImageName = () => crypto.randomBytes(32).toString('hex')
const bucketName = process.env.BUCKET_NAME || 'myBucketName'

const likeStory = async (req: Request, res: Response) => {
    try {

        const userId = req.userId
        const storyId = parseInt(req.params.storyId)

        const story = await Story.findOne({id: storyId})

        if (!story) {
            res.status(404).json({message: "Story not found"})
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
        res.status(500).json({error: 'Failed to like story', details: error})
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
            storyUrl: imageName
        })

        const createdStory = await story.save()

        if (!createdStory) {
            res.status(500).json({error: "Failed to create story", details: "Unknown error occurred"})
        } else {
            res.status(201).json({message: "Story created successfully"})
        }

    } catch (error: any) {
        res.status(500).json({error: "Failed to create story", details: error})
    }
}

const deleteStory = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const storyId = parseInt(req.params.storyId)

        const story = await Story.findOne({id: storyId, userId: userId})

        if (!story) {
            res.status(404).send({message: "Story not found"})
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
            res.status(500).send({message: "Unknown error occurred"})
        } else {
            res.status(200).send({message: "Story deleted"})
        }

    } catch (error: any) {
        res.status(500).json({error: 'Failed to delete story', details: error})
    }
}

const getUserStories = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId)
        const stories = await Story.find({userId: userId})

        if (!stories) {
            res.status(404).json({error: 'No story found'})
            return
        }

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
        res.status(500).json({error: 'Failed to fetch story', details: error})
    }
}

const getDisplayUsers = async (req: Request, res: Response) => {
    const userId = req.userId
    const object = await FollowEntry.findOne({userId: userId})

    let users = [userId]
    let displayUsers = []

    if (object) {
        const followingList = object.followingList
        if(followingList != null && followingList.length > 0) {
            users.push(...followingList)
        }
    }

    for (const id of users) {
        const displayUser = await User.findOne({id: id})

        if (!displayUser) {
            continue
        }

        const isStoryExist = await Story.find({userId: id})

        if (!isStoryExist || isStoryExist.length == 0) {
            continue
        }

        const getObjectParams = {
            Bucket: process.env.BUCKET_NAME!!,
            Key: displayUser.profileImageUrl
        }

        const command = new GetObjectCommand(getObjectParams)
        const url = await getSignedUrl(client, command, {expiresIn: 3600})

        const json = {
            userId: displayUser.id,
            username: displayUser.username,
            profileImageUrl: url
        }

        displayUsers.push(json)
    }

    res.status(200).json(displayUsers)
}

export default {
    likeStory,
    createStory,
    deleteStory,
    getUserStories,
    getDisplayUsers,
}
