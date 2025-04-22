import {Request, Response} from "express"
import {Chat} from "../model/Chat";

const getChatUsers = async (req: Request, res: Response) => {
    const senderId = req.userId

    const chatUsers = await Chat.find({participants: senderId}).select('receiverId')

    if (!chatUsers || chatUsers.length === 0) {
        res.status(404).json({message: "No chat users found"})
        return
    }

    res.status(200).json(chatUsers)
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
    getChat
}