import dotenv from "dotenv"
import connectDB from "./db/index.js";
import app from "./app.js"

dotenv.config({
    path: "./.env"
})

connectDB()
.then(()=>{
    app.listen(8000,()=>{
        console.log("Server running on port 8000")
    })
})
.catch((err)=>{
    console.log("Mongodb connection failed",err)
})