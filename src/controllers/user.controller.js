import asynchandler from './../utils/asynchandler.js';
import ApiError from './../utils/ApiError.js';
import user from "../models/user.model.js"
import uploadfileCloudinary from "../utils/cloudinary.js"
import ApiResponse from "../utils/Apiresponse.js"

const generateAccessTokenAndRefreshToken = async(userId){
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

    if (!avatar || !avatar.url) {
        throw new ApiError(400,"Failed to upload avatar");
    }
    
    if (!coverImage || !coverImage.url) {
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
        "-password refreshToken"  // it help to note that these fields are not taken
    )

    if (!createdUser) {
        throw new ApiError(500,"Something went wrong while registering")
    }

    return res.status(201).json(
        new ApiError(200,createdUser,"user registered successfully")
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

    if (!username || !email) {
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
        throw new ApiError(401,"password not valid")
    }

    const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = User.findById(user._id).select(-password,-refreshToken)

    const options = {
        httpOnly = true,
        secure = true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json{
        new ApiResponse{
            200,
            {
                
            }
        }
    }

})

export {
    registerUser,
    loginUser
}