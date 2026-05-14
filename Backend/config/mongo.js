import mongoose from "mongoose";

const mongourl = process.env.MONGOURL;

export const connectDB = async () => {
    if (!mongourl) {
        throw new Error("Missing MONGOURL in environment.");
    }

    mongoose.set("strictQuery", true);
    await mongoose.connect(mongourl, {
        serverSelectionTimeoutMS: 10000,
    });
    console.log("connected to mongoDB");
};
