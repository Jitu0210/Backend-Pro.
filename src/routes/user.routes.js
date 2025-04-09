import  Router from "express"
import registerUser from "../controllers/user.controller.js"
import upload from "./../middlewares/multer.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([  // middleware(multer by import as upload) used before reguster
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

export default router