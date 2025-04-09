import mongoose from "mongoose"

const connectDB = async () =>{
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/myDatabase")
        console.log("Mongodb connected Successfully...")
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}


export default connectDB