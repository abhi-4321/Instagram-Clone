import {Request, Response} from "express"
import {Chat} from "../model/Chat"
import {User} from "../model/User"
import {GetObjectCommand, PutObjectCommand} from "@aws-sdk/client-s3"
import client from "../util/s3Client"
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"
import dotenv from "dotenv";
import {FollowEntry} from "../model/Followers"

dotenv.config()

const getChatUsers = async (req: Request, res: Response) => {
    const senderId = req.userId

    try {
        const chats = await Chat.find({participants: senderId})
            .sort({timestamp: -1})
            .lean()

        const latestChatsMap = new Map<number, any>()

        chats.forEach(chat => {
            const otherUserId = chat.senderId === senderId ? chat.receiverId : chat.senderId
            if (!latestChatsMap.has(otherUserId)) {
                // Remove unwanted fields from the chat object
                const {_id, __v, ...cleanChat} = chat
                latestChatsMap.set(otherUserId, cleanChat)
            }
        })

        const userIds = Array.from(latestChatsMap.keys())

        const users = await User.find({id: {$in: userIds}})
            .lean()
            .select('id fullName profileImageUrl')

        const result = await Promise.all(users.map(async user => {
            let url = ""
            if (user.profileImageUrl && user.profileImageUrl != "") {
                const getObjectParams = {
                    Bucket: process.env.BUCKET_NAME!!,
                    Key: user.profileImageUrl
                }

                const command = new GetObjectCommand(getObjectParams)
                url = await getSignedUrl(client, command, {expiresIn: 3600})
            }

            return {
                receiverId: user.id,
                fullName: user.fullName,
                profileImageUrl: url,
                lastChat: latestChatsMap.get(user.id)
            }
        }))

        res.status(200).json(result)
    } catch (err) {
        res.status(500).json({message: "Something went wrong", error: err})
    }
}

const getFollowers = async (req: Request, res: Response) => {
    const senderId = req.userId

    try {
        const entry = await FollowEntry.findOne({userId: senderId})

        if (!entry) {
            res.status(404).json({message: `User with id ${senderId} not found`})
            return
        }

        console.log(entry)

        const users = await User.find({id: {$in: entry.followingList}})
            .lean()
            .select('id fullName profileImageUrl username')

        console.log(users)

        const result = await Promise.all(users.map(async user => {
            let url = ""
            if (user.profileImageUrl && user.profileImageUrl != "") {
                const getObjectParams = {
                    Bucket: process.env.BUCKET_NAME!!,
                    Key: user.profileImageUrl
                }

                const command = new GetObjectCommand(getObjectParams)
                url = await getSignedUrl(client, command, {expiresIn: 3600})
            }

            return {
                receiverId: user.id,
                fullName: user.fullName,
                profileImageUrl: url,
                username: user.username,
            }
        }))

        console.log(result)

        res.status(200).json(result)

    } catch (error: any) {
        res.status(500).json({message: "Something went wrong", error: error})
    }
}

const getChat = async (req: Request, res: Response) => {
    const senderId = req.userId
    const receiverId = parseInt(req.params.receiverId)

    const id = generateConversationId(senderId, receiverId)

    const chats = await Chat.find({id: id})
    if (!chats) {
        res.status(404).json({message: "No chats found"})
        return
    }
    res.status(200).json(chats)
}

const generateConversationId = (userId1: number, userId2: number): string => {
    return [userId1, userId2].sort().join('_')
}

export default {
    getChatUsers,
    getChat,
    getFollowers
}