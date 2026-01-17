import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.get("/", (req, res) => {
    res.json({
        message: "Hello World"
    });
});

app.get("/api/data", (req, res) => {
    res.json({
        ok: true,
        source: process.env.SERVER_NAME || "api-server",
        now: new Date().toISOString(),
        request: {
            method: req.method,
            path: req.path,
            host: req.headers.host || null,
            requestId: req.headers["x-request-id"] || null,
            forwardedFor: req.headers["x-forwarded-for"] || null,
        },
        data: {
            title: "Data coming from api-server",
            items: [
                { id: 1, name: "EC2", status: "learning" },
                { id: 2, name: "Nginx", status: "practicing" },
                { id: 3, name: "Load Balancer", status: "next" },
            ],
        },
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
