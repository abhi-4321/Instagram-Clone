import mongoose, {Document} from "mongoose"

export interface Token extends Document {
    username: string
    token: string
}

const tokenSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    token: { type: String, required: true, unique: true },
})

export const Token = mongoose.model("Token", tokenSchema, "token")
