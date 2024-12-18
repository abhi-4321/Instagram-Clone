import mongoose, { Schema, Document } from "mongoose"

export interface Highlight extends Document {
    id: number
    userId: number
    highlightUrl: string
    title: string
}

const highlightSchema = new Schema<Highlight>({
    id: { type: Number, required: true },
    userId: { type: Number, required: true },
    highlightUrl: { type: String, default: "" },
    title: { type: String, required: true }
})

export const Highlight = mongoose.model<Highlight>("Highlight", highlightSchema, "highlights")