import mongoose from "mongoose";

const mongourl = process.env.MONGOURL;

export const connectDB = async () => {
    if (!mongourl) {
        throw new Error("Missing MONGOURL in environment.");
    }

    mongoose.set("strictQuery", true); //strictQuery to ensure only schema-defined fields are considered in database queries, improving consistency and reducing accidental query mistakes
    await mongoose.connect(mongourl, {
        serverSelectionTimeoutMS: 10000,
    });
    console.log("connected to mongoDB");
};
