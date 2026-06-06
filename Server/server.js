import express from 'express'
import cors from 'cors'
import g_authRouter from './routes/g_authRouter.js'
import dotenv from 'dotenv'
import  connectDB  from './configs/db.js'
const app = express()
dotenv.config()
const PORT = process.env.PORT || 8000
 await connectDB()
 app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.use('/auth', g_authRouter)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

