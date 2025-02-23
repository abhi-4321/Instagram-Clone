import mongoose, {Document, Schema} from "mongoose";

export interface Story extends Document {
    id: number
    userId: number
    storyUrl: string
    likedBy: number[]
    createdAt: Date
}

const storySchema = new Schema<Story>({
    id: { type: Number, required: true },
    userId: { type: Number, required: true },
    storyUrl: { type: String, required: true },
    likedBy: { type: [], default: [] },
    createdAt: { type: Date, default: Date.now },
})

// Create a TTL index on the `createdAt` field
storySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 86400 seconds = 24 hours

export const Story = mongoose.model<Story>("Story", storySchema, "stories")
