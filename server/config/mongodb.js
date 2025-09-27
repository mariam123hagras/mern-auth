import mongoose from "mongoose";

const connectDB = async () => {
console.log("🔌 MongoDB Connection State:", mongoose.connection.readyState);
    mongoose.connection.on("connected", () => {
        console.log("MongoDB connected successfully");
    });
    await mongoose.connect(`${process.env.MONGODB_URI}/mern-auth`);
}

export default connectDB;