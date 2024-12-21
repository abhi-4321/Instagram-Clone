import { Request, Response } from "express"
import { User } from "../model/User"
import { Post } from "../model/Post"
import { Highlight } from "../model/Highlight"
import { connection } from "mongoose"


const follow = async (req: Request, res: Response) => {
    try {
        const senderId = req.params.senderId
        const receiverId = req.params.receiverId

        

    } catch (error: any) {
        
    }
}

export default {
    follow
}