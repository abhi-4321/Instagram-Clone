import { WebSocketServer, WebSocket } from 'ws'
import {setClientSocket, removeClientSocket, handleMessage} from './wshandler'
import http from 'http'
import { parse } from 'url'

export const setupWebSocket = (server: http.Server) => {
    const wss = new WebSocketServer({ server })

    wss.on('connection', (ws: WebSocket, req) => {
        console.log('Client connected')

        ws.on('message', (data) => {
            try {
                const { query } = parse(req.url!, true)
                const userId = parseInt(query.userId as string)
                const parsed = JSON.parse(data.toString())

                if (!userId || !parsed.senderId || userId !== parsed.senderId) {
                    ws.send(JSON.stringify({ error: 'Invalid or mismatched senderId in connection' }))
                    return
                }

                // Register the client if not already registered
                setClientSocket(parsed.senderId, ws)

                handleMessage(ws, data.toString()) // handle message or broadcast
            } catch (err) {
                ws.send(JSON.stringify({ error: 'Invalid JSON format' }))
            }
        })

        ws.on('error', (err) => {
            console.log('WebSocket Error:', err)
        })

        ws.on('close', () => {
            console.log('Client disconnected')
            removeClientSocket(ws)
        })
    })
}