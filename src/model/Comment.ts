import mongoose, { Schema, Document } from "mongoose"

export interface Comment extends Document {
    id: number
    userId: number
    postId: number
    comment: string
    likesCount: string
    likedBy: number[]
}

const commentSchema = new Schema<Comment>({
    id: { type: Number, required: true },
    userId: { type: Number, required: true },
    postId: { type: Number, required: true },
    comment: { type: String, required: true },
    likesCount: { type: String, default: "0" },
    likedBy: { type: [], default: [] }
})

export const Comment = mongoose.model<Comment>("Comment", commentSchema, "comments")