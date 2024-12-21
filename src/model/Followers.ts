import mongoose, { Schema, Document } from "mongoose"

export interface FollowEntry extends Document {
    userId: number
    followingList: number[]
    followersList: number[]
}

const followSchema = new Schema<FollowEntry>({
    userId: { type: Number, required: true },
    followingList: { type: [], default: [] },
    followersList: { type: [], default: [] },
}) 

export const FollowEntry = mongoose.model<FollowEntry>("Follow", followSchema, "followers")