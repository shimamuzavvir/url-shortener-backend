import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
    longUrl: {
        type: String,
        required: true
    },
    shortUrl: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    clicks:{
        type: Number,
        required:true,
        default:0
    }
}, { _id: false });
const userSchema = new mongoose.Schema({
    firstname:String,
    lastname:String,
    email:String,
    password:String,
    role:String,
    token:String,
    urls:[urlSchema]
},{versionKey:false})

const User = mongoose.model('User',userSchema)

export default User