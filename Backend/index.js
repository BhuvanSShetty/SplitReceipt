import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config"
import authRoutes from "./routes/v1/auth.js";
import receiptRoutes from "./routes/v1/receipt.js";
import { connectDB } from "./config/mongo.js";
import { connectRedis } from "./config/redis.js";


const port = process.env.PORT || 4000;
const app = express();
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
    .split(",")
    .map(o => o.trim().replace(/\/+$/, "")); // strip trailing slashes

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, mobile apps, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin || allowedOrigins[0]);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));


app.get("/test",(req,res)=>{
    res.send("server is up and running");
})

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/receipt", receiptRoutes);


const startServer = async () => {
    try {
        await connectDB();
        await connectRedis();
        app.listen(port,()=>{
            console.log("server is up and running")
        })
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};


startServer();