import asynchandler from './../utils/asynchandler.js';
import ApiError from './../utils/ApiError.js';
import user from "../models/user.model.js"
import uploadfileCloudinary from "../utils/cloudinary.js"
import ApiResponse from "../utils/Apiresponse.js"
import User from '../models/user.model.js';
import jwt from "jsonwebtoken"
import ApiResponse from './../utils/Apiresponse';
import uploadfileCloudinary from './../utils/cloudinary';

const generateAccessTokenAndRefreshToken = async(userId) => {
    try {
        const user = await user.findById(userId)
        const accessToken =  user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return{accessToken,refreshToken}


    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating tokens")
    }
}

const registerUser = asynchandler(async(req,res) =>{
    const {fullname,email,username,password} = req.body
    console.log("email:",email);

    if (
        [fullname,email,username,password].some((field)=>
        field?.trim()==="")
    ) {
        throw new ApiError(400,"all fields are required")
    }
    // validate for @ in email using string method HW

    const existeduser = await user.findOne({
        $or:[{ username },{ email }]
    })

    if(existeduser){
        throw new ApiError(409,"user with user or email already exist")
    }

    const avatarpath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.avatar[0]?.path;

    if (!avatarpath) {
        throw new ApiError(400,"avatar file is required")
    }

    const avatar = await uploadfileCloudinary(avatarpath)
    const coverImage = await uploadfileCloudinary(coverImageLocalPath)

    if (!(avatar || avatar.url)) {
        throw new ApiError(400,"Failed to upload avatar");
    }
    
    if (!(coverImage || coverImage.url)) {
        throw new ApiError(400,"Failed to upload coverImage");
    }
    

    const newUser = await user.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage.url,
        email,
        password,
        username:username.toLowerCase
    })

    const createdUser = await user.findById(user._id).select(
        "-password -refreshToken"  // it help to note that these fields are not taken
    )

    if (!createdUser) {
        throw new ApiError(500,"Something went wrong while registering")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registered successfully")
    )

})

const loginUser = asynchandler(async(req,res)=>{
    // bring data from req.body
    // username or email
    // find the user
    // check password
    // generate accesstoken and refresh token
    // send in cookies

    const {username,email,password} = req.body

    if (!(username || email)) {
        throw new ApiError(400,"username or email is required")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if (!user) {
        throw new ApiError(404,"user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401,"password is not valid")
    }

    const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = User.findById(user._id).select("-password,-refreshToken")

    const options = {  // option requied while sending cookies,so no one can change cookies on f-end
        httpOnly:true,
        secure:true
    }

    return res.status(200)  // all wprk done
    .cookie("accessToken",accessToken,options)  // sending cookie for accesstoken
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {
            user:loggedInUser,
            accessToken,refreshToken  // All are "data" used in ApiResponse which are in curly bracket
            },
            "user logged in succeddfully")
    )
})

const logOutUser = asynchandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            },
        },
        {
            new :true
        }
    )
    const options = {  // option requied while sending cookies,so no one can change cookies on f-end
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"User logged out")
    )
})

const refreshAccessToken = asynchandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401,"unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"refreshtoken is expired or used")
            
        }
    
        const options = { 
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newrefreshToken} = await generateAccessTokenAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accesstoken",accessToken,options)
        .cookie("refreshtoken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken,newrefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refreesh token")
    }
})

const changeCurrentPassword = asynchandler(async(req,ref)=>{
    const {oldPassword,newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400,"invalid old password")       
    }

    user.password = newPassword
    await user.save({validationBefroeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Password changed")
    )
})

const getCurrentUser = asynchandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"user fetched succeddfully")
})

const UpdateAccountDetails = asynchandler(async(req,res)=>{
    const{fullname,email} = req.body

    if (!fullname || !email) {
        throw new ApiError(400,"All feilds are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email:email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details"))
})

const UpdateAvatar = asynchandler(async(req,res)=>{
    const avtarLocalPath = req.file?.path

    if (!avtarLocalPath) {
        throw new ApiError(400,"Avtar file is missing")
    }

    const avatar = await uploadfileCloudinary(avtarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400,"Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar updated successfully"))
})
const UpdatecoverImage = asynchandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400,"coverImage file is missing")
    }

    const coverImage = await uploadfileCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400,"Error while uploading coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"coverImage updated successfully"))
})

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    getCurrentUser,
    UpdateAccountDetails,
    UpdateAvatar,
    UpdatecoverImage
}