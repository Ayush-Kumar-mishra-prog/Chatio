import express from 'express'
import cors from 'cors'
import g_authRouter from './routes/g_authRouter.js'
import http from 'http'
import dotenv from 'dotenv'
import  connectDB  from './configs/db.js'
const app = express()
const server = http.createServer(app)
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

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

