import ApiError from "../utils/ApiError";
import asynchandler from "../utils/asynchandler";
import jwt from "jsonwebtoken"
import User from "../models/user.model"


export const verifyJWT = asynchandler(async(req,_,next)=>{ // no use of res so use "_"
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
        if (!token) {
            throw new ApiError(401,"Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            throw new ApiError(401,"Invalid accessToken")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401,"invalid accessToken")
    }
})