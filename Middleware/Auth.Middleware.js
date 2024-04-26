import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import User from '../Models/User.Schema.js'

dotenv.config()

const authMiddleware = async(req, res, next)=>{
    const token = req.header('Authorization')
    if(!token){
        return res.status(401).json({message:"token is missing"})
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        console.log(decoded)
        req.user = decoded
        const user = await User.findById(req.user._id);

        if (user.role != "admin") {
            return res.status(401).json({ message: "Access Denied.User is not an admin" });
        }
        next();
    } catch (error) {
        console.log(error);
        res.status(500).json({error:"Invalid token or internal server error"})
    }

}

export default authMiddleware