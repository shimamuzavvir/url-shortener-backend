import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config()

const mongoUrl = process.env.MONGODBCONNECTIONSTRING

const connectDB = async()=>{

    try {
        const connection = await mongoose.connect(mongoUrl)
        console.log("mongodb connected succefully");
    } catch (error) {
        console.log(error);
    }
}

export default connectDB