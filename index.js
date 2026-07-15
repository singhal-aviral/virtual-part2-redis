import express from "express"
import bcrypt from "bcrypt"
import Redis from "ioredis"
import dotenv from "dotenv"
dotenv.config()
const redis = new Redis(process.env.REDIS_URI)

import userModel from "./models/users.js"
import connectDB from "./database.js"

const app = express()
app.use(express.json())

// API 1: 
app.get("/getusers", async  (req, res) => {     
    const cached_users = await redis.get("users:all")
    if(cached_users){
       res.status(200).json({
            cached_users
       }) 
    }
    
    const users = await userModel.find({})
    await redis.set("users:total", JSON.stringify(users))
    res.status(200).json({
        users
   }) 

    // // write with expiry (seconds)
    // await redis.set("key", "value", "EX", 60)   

})

// API 2: 
app.post("/createuser", async (req, res) => {
    const {name, email, password} = req.body;
    if(!name || !email || !password){
        return res.status(400).send('all details have not been provided')
    } 

    const new_password = bcrypt.hash(password, 10);
    const user = await userModel.create({
        name, 
        email, 
        password: hash_password
    })

    return res.status(201).json({
        msg: 'user created and operation success',
        user: user
    })
})

connectDB();
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log("connection established and server started")
})