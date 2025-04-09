import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

// Basic configuration of middleware
app.use(express.json({limit:"16kb"}))  // it is used to receive json data
app.use(express.urlencoded({extended:true,limit:"16kb"})) // Parses URL-encoded data (e.g., form submissions).
                                                        //extended: true → Allows complex nested objects.
app.use(express.static("public"))  // Serves static files (like images, CSS, and JS) from the "public" folder.
app.use(cookieParser()) // it is used to perform CRUD operation user's browser cookies

// routes import 
import userRouter from "./routes/user.routes.js"

//routes declaration
app.use("/api/v1/users",userRouter) // here we cannot directly define router like app.get or something 
                             //here we simply create a route of users namae and then give all control to userRouter
//after this we get a link like http://localhost:8000/api/v1/users/register
// because the control is given to user.routes and then /register will work So "/api/v1/users" will work as prefix
export default app