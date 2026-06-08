import express from 'express'
import cors from 'cors'
import g_authRouter from './routes/g_authRouter.js'
import http from 'http'
import dotenv from 'dotenv'
import  connectDB  from './configs/db.js'
import messageRouter from './routes/messageRoutes.js'
import { Server } from 'socket.io'
const app = express()
const server = http.createServer(app)

export const io = new Server(server,{
    cors:{origin:'*'}
})

export const userSocketMap = {};

io.on("connection", (socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("user connected",userId)
    if(userId) userSocketMap[userId] = socket.id

    io.emit("getOnlineUsers",Object.keys(userSocketMap))
    socket.on("disconnect",()=>{
        console.log("User Disconnectd",userId)
        delete userSocketMap[userId];
        io.emit("getOnlineUsers",Object.keys(userSocketMap))
    })
})


dotenv.config()
app.use(express.json({limit: '4mb'}))
const PORT = process.env.PORT || 8000
 await connectDB()
 app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello World!')
})
app.use('/api/status',(req,res)=>{
    res.send('Server is running')
})

app.use('/auth', g_authRouter)
app.use('/api/message',messageRouter)

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

