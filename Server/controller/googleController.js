import { oauth2client } from "../configs/googleConfig.js"
import GUser from "../models/google.model.js"
import jwt from 'jsonwebtoken'

const googleLogin = async (req,res)=>{
    try {
        const { code } = req.body
        const googleRes = await oauth2client.getToken(code)
        oauth2client.setCredentials(googleRes.tokens)

        const userRes = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`, )
        const {email,name,picture} = userRes.data
        let user = await GUser.findOne({email});
        if(!user){
            user = await GUser.create({
                name,email,image:picture
            })
        }
        const {_id}= user
        const token= jwt.sign({_id,email},process.env.JWT_SECRET,{
            expiresIn:process.env.JWT_TIMEOUT
        })
        return res.status(200).json({message:"success" ,token,user})
    } catch (error) {
        console.error("Error fetching Google access token:", error)
        res.status(500).json({ error: "Failed to fetch Google access token" })
    }
}

export default googleLogin