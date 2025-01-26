import mongoose, {Document, Schema} from "mongoose";

export interface Story extends Document {
    id: number
    userId: number
    storyUrl: string
    likedBy: number[]
}

const storySchema = new Schema<Story>({
    id: { type: Number, required: true },
    userId: { type: Number, required: true },
    storyUrl: { type: String, default: ""},
    likedBy: { type: [], default: [] },
})

export const Story = mongoose.model<Story>("Story", storySchema, "stories")
