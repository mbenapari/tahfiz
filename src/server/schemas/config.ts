import mongoose from "mongoose";

const connectDb = async():Promise<void>=>{
    try{
        await mongoose.connect(process.env.MONGO_URI!);
        console.log("Database connected");
    }catch(error){
        console.log(error);
        process.exit(1)
    }
} 
export {connectDb}