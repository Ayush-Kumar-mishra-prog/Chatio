import express from 'express';
import googleLogin from '../controller/googleController.js';
import {
  facebookLogin,
  deleteAccount,
  getMe,
  login,
  signup,
  updateProfile,
  verifyEmail,
} from '../controller/authController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router()
router.get('/test',(req,res)=>{
    res.send('Test pass')
})

router.get('/google',googleLogin)
router.post('/facebook', facebookLogin)
router.post('/signup', signup)
router.post('/verify-email', verifyEmail)
router.post('/login', login)
router.get('/me', protect, getMe)
router.put('/profile', protect, updateProfile)
router.delete('/account', protect, deleteAccount)

export default router
