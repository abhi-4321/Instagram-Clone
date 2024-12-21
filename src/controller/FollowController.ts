import { Request, Response } from "express"
import { User } from "../model/User"
import { FollowEntry } from "../model/Followers"
import { connection } from "mongoose"


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

        if (followKarneWala.followingList.includes(followedTo) || followHoneWala.followersList.includes(followedBy)) {
            res.status(200).json({ message: `User ${followedBy} already follows User ${followedTo}` })
            return
        } 

        followKarneWala.followingList.push(followedTo)
        followHoneWala.followersList.push(followedBy)

        const res1 = await followKarneWala.save()
        const res2 = await followHoneWala.save()

        if (!res1 || !res2) {
            throw new Error("Unknown error occured")
        } else {
            res.status(200).json({ message: `User ${followedBy} started following User ${followedTo}` })
        }

    } catch (error: any) {
        res.status(500).json({ message: error })
    }
}

const unfollow = async (req: Request, res: Response) => {
    try {
        const unfollowedBy = parseInt(req.params.unfollowedBy)
        const unfollowedTo = parseInt(req.params.unfollowedTo)

        const unfollowKarneWala = await FollowEntry.findOne({ userId: unfollowedBy })
        const unfollowHoneWala = await FollowEntry.findOne({ userId: unfollowedTo })

        if (!unfollowKarneWala || !unfollowHoneWala) {
            res.status(404).json({ message: "User not found" })
            return
        }

        if(!unfollowKarneWala.followingList.includes(unfollowedTo) || !unfollowHoneWala.followersList.includes(unfollowedBy)) {
            res.status(200).json({ message: `User ${unfollowedBy} is not following User ${unfollowedTo}` })
            return
        } 

        unfollowKarneWala.followingList = unfollowKarneWala.followingList.filter(id => id != unfollowedTo)
        unfollowHoneWala.followersList = unfollowHoneWala.followersList.filter(id => id != unfollowedBy)

        const res1 = await unfollowKarneWala.save()
        const res2 = await unfollowHoneWala.save()

        if (!res1 || !res2) {
            throw new Error("Unknown error occured")
        } else {
            res.status(200).json({ message: `User ${unfollowedBy} unfollowed User ${unfollowedTo}` })
        }

    } catch (error: any) {
        res.status(500).json({ message: error })
    }
}

export default {
    follow,
    unfollow
}