import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './Database/Config.js';
import userRouter from './Router/User.Router.js';


dotenv.config();

const app = express()

app.use(cors())
app.use(express.json())
app.options('*', cors())

app.use('/api/user', userRouter)
const port = process.env.PORT 

connectDB()
app.listen(port,()=>{
    console.log('app is listening in the port-', port);
})
