import express from 'express'
import { AdminDashboard, ClickShortUrl, GetUrlcounts, ListAllUsers, LoginUser, RegisterUser, ResetPassword, forgotPassword, generateShortUrl } from '../Controller/User.Controller.js'
import authMiddleware from '../Middleware/Auth.Middleware.js'


const userRouter = express.Router()
userRouter.post('/register', RegisterUser)
userRouter.post('/login', LoginUser)
userRouter.get('/alluser', ListAllUsers)
userRouter.post('/forgetpassword', forgotPassword)
userRouter.put('/resetpassword', ResetPassword)

userRouter.get('/authorized', authMiddleware, AdminDashboard)

userRouter.post('/shorturl/:email', generateShortUrl)
userRouter.get('/shortid/:shortUrl',ClickShortUrl)
userRouter.get('/geturlcounts',GetUrlcounts)



export default userRouter