/*  INFO: this file does OTP management for any system - right now very basic implementation.
    Needed because OTP is temporary information, which doesn't need a database necessarily, and quick
    in-memory databases like redis can help with such fast and temporary retrieval activities */

import express from "express"
import Redis from "ioredis"
import dotenv from "dotenv"
dotenv.config()
const redis = new Redis(process.env.REDIS_URI)
   
import userModel from "./models/user.model.js"
import connectDB from "./database.js"

const app = express()
app.use(express.json())

// API 1: create temporary OTP and store it in redis. returns OTP to user
app.post("/createotp", async (req, res) => {
    const email = req.body.email;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await redis.set(`otp:email:${email}`, JSON.stringify(otp), "EX", 20)
    return res.status(200).json({
        msg: "your otp created successfully",
        otp: otp
    })
})


// API 2: verify OTP after receiving OTP from user, and verify if it is actually valid
app.post("/verifyotp", async (req, res) => {
    const {email, otp} = req.body;
    const value = await redis.get(`otp:email:${email}`)
    const storedOtp = JSON.parse(value);

    if(storedOtp == otp){
        // we don't need this otp anymore, so can get rid of it
        await redis.del(`otp:email:${email}`)
        return res.status(200).json({
            msg: "your otp is verified and valid"
        })
    }

    return res.status(400).json({
        msg: "your otp is not valid or has expired"    
    })
})

app.listen(3000, () => {
    console.log("connection established and server started")
})