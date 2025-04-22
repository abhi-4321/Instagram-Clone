import { WebSocket } from 'ws'
import {Chat} from "../model/Chat";

const clients = new Map<number, WebSocket>() // move this to a shared module if needed

export const setClientSocket = (userId: number, ws: WebSocket) => {
    if (!clients.has(userId)) {
        clients.set(userId, ws)
        console.log(`Registered senderId ${userId}`)
    }
}

export const removeClientSocket = (ws: WebSocket) => {
    for (const [userId, socket] of clients.entries()) {
        if (socket === ws) {
            clients.delete(userId)
            break
        }
    }
}

export const getClientSocket = (userId: number): WebSocket | undefined => {
    return clients.get(userId)
}

export const handleMessage = async (ws: WebSocket, data: string) => {
    try {
        const msg = JSON.parse(data)

        // Check if the receiver is connected
        const receiverSocket = getClientSocket(msg.receiverId)
        if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
            receiverSocket.send(JSON.stringify(msg))
        }

        const newChat = new Chat({
            id: msg.id,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            chat: msg.chat,
            attachment: msg.attachment || '',
            participants: [msg.senderId, msg.receiverId]
        })

        await newChat.save()

        // (Optional) Acknowledge to sender
        ws.send(JSON.stringify({ status: 'Message sent.'}))
    } catch (error: any) {
        console.error('Invalid JSON received:', data)
        ws.send(JSON.stringify({ error: 'Invalid message format' }))
    }
}