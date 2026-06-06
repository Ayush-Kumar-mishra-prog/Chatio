import express from 'express';
import googleLogin from '../controller/googleController.js';
const router = express.Router()
router.get('/test',(req,res)=>{
    res.send('Test pass')
})

router.get('/google',googleLogin)

export default router