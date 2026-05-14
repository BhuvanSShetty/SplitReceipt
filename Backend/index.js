import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config"
import authRoutes from "./routes/auth.js";
import receiptRoutes from "./routes/receipt.js";
import { connectDB } from "./config/mongo.js";


const port = process.env.PORT || 4000;
const app = express();
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(cors({
    origin: frontendOrigin,
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));


app.get("/test",(req,res)=>{
    res.send("server is up and running");
})

app.use("/api/auth", authRoutes);
app.use("/api/receipt", receiptRoutes);


const startServer = async () => {
    try {
        await connectDB();
        app.listen(port,()=>{
            console.log("server is up and running")
        })
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();