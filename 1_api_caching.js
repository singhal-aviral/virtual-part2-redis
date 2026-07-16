// INFO: this file handles the most basic function of redis - to do caching for data for any API

import express from "express"
import bcrypt from "bcrypt"
import Redis from "ioredis"
import dotenv from "dotenv"
dotenv.config()
const redis = new Redis(process.env.REDIS_URI)

import userModel from "./models/user.model.js"
import connectDB from "./database.js"

const app = express()
app.use(express.json())

// API 1: get all users data - served from redis. if not redis, then served from DB
app.get("/getusers", async  (req, res) => {     
    // get users from redis and if data retreived then convert to JSON objects
    const cached_users = await redis.get("users:all")
    if(cached_users){
        const user_profile = JSON.parse(cached_users);
        return res.status(200).json({
            user_profile
       }) 
    }
        
    // if data not retrived from redis, get from DB and write to redis
    const users = await userModel.find({})
    await redis.set("users:all", JSON.stringify(users))
    res.status(200).json({
        users
   }) 
})

// API 2: create new user and refresh redis memory to prepare it for next GET call
app.post("/createuser", async (req, res) => {
    const {name, email, password} = req.body;
    if(!name || !email || !password){
        return res.status(400).send('all details have not been provided')
    } 

    /* delete all users when creating user - so then user value is not in redis, forcing it to 
       get all users (including new user) into redis memory, and serving all user details when asked */
    await redis.del("users:all")

    // hashing password and creating user in the database - not redis yet
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