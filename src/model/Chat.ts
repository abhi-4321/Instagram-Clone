import mongoose, {Document, Schema} from "mongoose"

export interface Chat extends Document {
    id: string
    senderId: number
    receiverId: number
    chat: string
    attachment: string
    timestamp: Date
    participants: number[]
}

const chatSchema = new Schema<Chat>({
    id: { type: String, required: true },
    senderId: { type: Number, required: true },
    receiverId: { type: Number, required: true },
    chat: { type: String, required: true },
    attachment: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
    participants: { type: [], required: true },
})

export const Chat = mongoose.model<Chat>("Chat", chatSchema, "chats")