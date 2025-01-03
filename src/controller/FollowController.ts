import { Request, Response } from "express"
import { FollowEntry } from "../model/Followers"


const follow = async (req: Request, res: Response) => {
    try {
        const followedBy = parseInt(req.params.followedBy)
        const followedTo = parseInt(req.params.followedTo)

        const followKarneWala = await FollowEntry.findOne({ userId: followedBy })
        const followHoneWala = await FollowEntry.findOne({ userId: followedTo })

        if (!followKarneWala || !followHoneWala) {
            res.status(404).json({ message: "User not found" })
            return
        }

        let message: string = ""

        if (followKarneWala.followingList.includes(followedTo) && followHoneWala.followersList.includes(followedBy)) {

            followKarneWala.followingList = followKarneWala.followingList.filter(id => id != followedTo)
            followHoneWala.followersList = followHoneWala.followersList.filter(id => id != followedBy)

            message = `User ${followedBy} unfollowed User ${followedTo}`

        } else if (!followKarneWala.followingList.includes(followedTo) && !followHoneWala.followersList.includes(followedBy)) {

            followKarneWala.followingList.push(followedTo)
            followHoneWala.followersList.push(followedBy)

            message = `User ${followedBy} is now following User ${followedTo}`
        }

        const res1 = await followKarneWala.save()
        const res2 = await followHoneWala.save()

        if (!res1 || !res2) {
            throw new Error("Unknown error occured")
        }

        res.status(200).json({ message: message })

    } catch (error: any) {
        res.status(500).json({ message: error })
    }
}

export default {
    follow
}
