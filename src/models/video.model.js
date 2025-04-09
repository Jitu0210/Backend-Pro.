import mongoose from "mongoose"

const videoSchema = new mongoose.Schema({

    videoFile:{
        type:String,
        require:true
    },
    thumbnails:{
        type:String,
        require:true
    },
    title:{
        type:String,
        require:true
    },
    description:{
        type:String
    },
    duration:{
        type:Number,
        require:true
    },
    views:{
        type:Number,
        require:true
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }

},{timestamps:true})

export const Video = mongoose.model("Video",videoSchema)