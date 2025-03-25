import {Request, Response} from "express"
import jwt from "jsonwebtoken";
import {User} from "../model/User";
import {Token} from "../model/Token";
import {FollowEntry} from "../model/Followers";
import bcrypt from "bcrypt"

const SALT_ROUNDS = 10 // Recommended value is 10-12
const JWT_SECRET = 'chintapakdumdum'

const generateAndStoreToken = async (id: number): Promise<string> => {
    // Generate a new token with a 14-day expiry
    const token = jwt.sign({userId: id}, JWT_SECRET, {expiresIn: "14d"})

    // Upsert (update or insert) the token in the database
    await Token.findOneAndUpdate(
        {userId: id}, // Query
        {token: token}, // Update
        {upsert: true, new: true} // Create if it doesn't exist, return the updated document
    )

    return token
}

const login = async (req: Request, res: Response) => {
    try {
        const body = req.body
        const user = await User.findOne({username: body.username})

        if (!user) {
            res.status(404).json({error: "Invalid Username or password"})
            return
        }

        const isMatch = await bcrypt.compare(body.password, user.password)
        if (!isMatch) {
            res.status(404).json({error: "Invalid username or password"})
            return
        }

        const token = await generateAndStoreToken(user.id)

        res.status(201).json({message: "Login successful", token: token})
    } catch (error: any) {
        res.status(500).json({error: "Failed to login", details: error})
    }
}

const register = async (req: Request, res: Response) => {
    try {
        // Proceed with user creation
        const email = req.body.email
        const username = req.body.username
        const password = req.body.password
        const exists = await User.findOne({username: username})

        if (exists) {
            res.status(400).json({error: "Username already exists"})
            return
        }

        // Count the existing users to assign a new ID
        const count = await User.countDocuments({}, {hint: "_id_"})

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

        // Create a new user
        const user = new User({
            id: count + 1,
            email: email,
            username: username,
            password: hashedPassword,
            highlights: [],
            posts: [],
        })

        // Save the user to the database
        const savedUser = await user.save()

        const token = await generateAndStoreToken(savedUser.id)

        // Create an empty follow entry for the user
        const followEntry = new FollowEntry({
            userId: savedUser.id,
            followingList: [],
            followersList: [],
        });

        await followEntry.save()

        // Respond with the newly created user
        res.status(201).json({user: savedUser, token: token})

    } catch (error: any) {
        res.status(500).json({error: "Failed to create user", details: error.message})
    }
}

export default {
    login,
    register
}

