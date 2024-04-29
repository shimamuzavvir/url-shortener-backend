import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../Models/User.Schema.js'
import { sendMail } from '../Services/SendMail.js'
import { nanoid } from 'nanoid'


dotenv.config()


export const RegisterUser = async (req, res) => {
    try {
      const {firstname, lastname, email, password, role} = req.body
      const hashPassword = await bcrypt.hash(password, 10)
  
      const user = await User.findOne({email})
      if(user){
          return res.status(409).json({message:"username already exist"})
      }
      
      const newUser = new User({firstname, lastname, email, password:hashPassword, role})
      await newUser.save()
      res.status(200).json({message:"Register Succesfully", data:newUser})
    } catch (error) {
      console.log(error);
      res.status(500).json({error:"internal server failed"})
    }
  }

  // LOGIN

  export const LoginUser = async(req, res) =>{
    try {
      const {email, password} = req.body

      const user = await User.findOne({email}) 
      if(!user){
        return res.status(401).json({message:"user not found"})
      }

      const passwordMatch = await bcrypt.compare(password, user.password)
      if(!passwordMatch) {
        return res.status(401).json({message:"invalid password"})
      }

      const token = jwt.sign({_id:user._id}, process.env.JWT_SECRET)
      user.token = token
      await user.save()
      res.status(200).json({message:"login successfully", token:token, data:user})
      
    } catch (error) {
      console.log(error);
      res.status(200).json({error:"internal server failed"})
      
    }
  }


  //LIST ALL USER

  export const ListAllUsers = async (req, res) => {
    try {
      const allusers = await User.find();
  
      res.status(200).json({
        message: "All Users Fetched Successfully",
        data: allusers,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  };



  // Authorized User


  export const AdminDashboard = async (req, res) => {
    try {
      // console.log(req.user)
      const userId = req.user._id;
  
      // Fetch the user document of the logged-in user
      const user = await User.findById(userId);
  
      // Check if the logged-in user is an admin
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. User is not an admin." });
      }
  
  
      res.status(200).json({ message: "Authorized User",data: user  }); //data: [user] 
    } catch (error) {
      console.log(error);
      res.status(500).json({ err: "Internal server Error " });
    }
  };



  //Forget Password

  export const forgotPassword = async (req, res) => {
    try {
      // Check the user Exits in DB
      let userExists = await User.findOne({ email: req.body.email });
      if (userExists && req.body.email !== "") {
        const tokenString = userExists.token;
        const mailId = req.body.email;
        const resetLink = `${process.env.Reset_Link}?token=${tokenString}&email=${mailId}`;
        const message = `
              <p>Hello ${userExists.firstname},</p>
              <p>You have requested to reset your password for URL Shortner. Click the button below to reset it:</p>
              <a href="${resetLink}">
                <button style="padding: 10px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                  Reset Your Password
                </button>
              </a>
              `;
        sendMail(req.body.email, message);
  
        // update the DB with Token
        await User.updateOne({ email: req.body.email }, { token: tokenString });
  
        // status send
        res.status(201).send({
          message: "Reset link sended to your mail-id",
        });
      } else {
        res.status(400).send({ message: `User does not exits` });
      }
    } catch (error) {
      res.status(500).send({
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };




  // Reset Password

  export const ResetPassword = async (req, res) => {
    try {
      let user = await User.find({ email: req.body.email });
  
      if (user) {
        const password = req.body.password;
        const confirmPassword = req.body.confirmPassword;
        const equalPassword = password === confirmPassword;
        const hashedPassword = await bcrypt.hash(password, 10);
  
        if (equalPassword && password !== "" && confirmPassword !== "") {
          await User.updateOne(
            { email: req.body.email },
            { password: hashedPassword }
          );
          res.status(200).json({ message: "Updated Successfully" });
        } else {
          res
            .status(400)
            .json({ message: "Password and confirm password doesn't match" });
        }
      }
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };
  


 ///shortenerUrl

 export const generateShortUrl = async(req, res)=>{
  try {
    const {email} = req.params
    const {longUrl} = req.body

    if(!longUrl){
      return res.status(401).json({message:"longurl is required"})
    }
    
    const user = await User.findOne({email})
    if(!user){
      return res.status(403).json({message:"user not found"})
    }

    const shortUrl = nanoid()

    user.urls.push(longUrl, shortUrl)

    await user.save()

    res.status(200).json({message:"successfully shorturl generated", data:shortUrl})


  } catch (error) {
    console.log(error);
    res.status(500).json({error:"internal server error"})
  }
 }


 //clickshorturl

 export const ClickShortUrl = async (req, res) => {
  try {
    const shortURL = await User.findOne({
      "urls.shortUrl": req.params.shortUrl,
    });
    if (!shortURL) {
      return res.status(404).json({ message: "URL not found" });
    }

    // Extract the long URL from the matching URL object
    const urlObject = shortURL.urls.find(
      (url) => url.shortUrl === req.params.shortUrl
    );
    
    // Increment clicks count
    urlObject.clicks++;
  
    // Save the updated document
    await shortURL.save();

    const longURL = urlObject.longUrl;
    // console.log(longURL);
    // Redirect the user to the long URL
    res.redirect(longURL);
  } catch (error) {
    console.error("Error handling short URL click:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



export const GetUrlcounts = async (req, res) => {
  try {
      const currentDate = new Date();
      const startDateOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDateOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const dailyCounts = await User.aggregate([
        { 
          $unwind: "$urls" 
        },
        { 
          $match: { 
            "urls.date": { 
              $gte: startDateOfMonth, 
              $lte: endDateOfMonth 
            } 
          } 
        },
        { 
          $group: { 
            _id: { 
              lastname: "$lastname",
              date: { 
                $dateToString: { 
                  format: "%Y-%m-%d", 
                  date: "$urls.date" 
                } 
              }
            }, 
            count: { 
              $sum: 1 
            } 
          } 
        },
        {
          $sort: {
            "_id.date": -1, //Sortng Date in Descending order
            "count": -1 // Sorting URL counts in Descending order
          }
        }
      ]);
  
      const monthlyCount = await User.aggregate([
        { 
          $unwind: "$urls" 
        },
        { 
          $match: { 
            "urls.date": { 
              $gte: startDateOfMonth, 
              $lte: endDateOfMonth 
            } 
          } 
        },
        { 
          $group: { 
            _id: "$lastname", 
            count: { 
              $sum: 1 
            } 
          } 
        },
        {
          $sort: {
            // "_id": 1,
            "count": 1 // Sorting URL counts in ascending order
          }
        }
      ]);
  
      res.status(200).json({ dailyCounts, monthlyCount });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
  
  
  }