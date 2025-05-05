import  Router from "express"
import { registerUser, loginUser, logOutUser,refreshAccessToken } from "../controllers/user.controller.js"
import upload from "./../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"


const router = Router()

router.route("/register").post(
    upload.fields([  // middleware(multer by import as upload) used before register
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser    // register used later after mmiddleware
)

router.route("/login").post(loginUser)

//Sedured Routes

router.route("/logout").post(verifyJWT,logOutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router