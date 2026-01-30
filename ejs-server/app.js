import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";


//configure environment 
dotenv.config()

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3002";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

async function fetchJson(url, { timeoutMs = 3000 } = {}) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const resp = await fetch(url, {
            signal: controller.signal,
            headers: {
                "accept": "application/json",
            },
        });

        const contentType = resp.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");
        const body = isJson ? await resp.json() : await resp.text();

        if (!resp.ok) {
            const err = new Error(`API request failed: ${resp.status} ${resp.statusText}`);
            err.status = resp.status;
            err.body = body;
            throw err;
        }

        return body;
    } finally {
        clearTimeout(t);
    }
}



app.get("/", (req, res) => { 
    res.render("home", {
        title: "EJS Server (behind Nginx)",
        serverName: process.env.SERVER_NAME || "express-app",
        port: PORT,
        host: req.headers.host,
        now: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || null,
        forwardedFor: req.headers["x-forwarded-for"] || null,
    });
});

app.get("/api", async (req, res) => {
    const url = `${API_BASE_URL.replace(/\/$/, "")}/api/data`;

    try {
        const apiPayload = await fetchJson(url, { timeoutMs: 5000 });

        res.render("api", {
            title: "API Data (api-server → ejs-server)",
            serverName: process.env.SERVER_NAME || "express-app",
            port: PORT,
            host: req.headers.host,
            now: new Date().toISOString(),
            apiBaseUrl: API_BASE_URL,
            apiUrl: url,
            apiPayload,
            error: null,
        });
    } catch (err) {
        res.status(502).render("api", {
            title: "API Data (api-server → ejs-server)",
            serverName: process.env.SERVER_NAME || "express-app",
            port: PORT,
            host: req.headers.host,
            now: new Date().toISOString(),
            apiBaseUrl: API_BASE_URL,
            apiUrl: url,
            apiPayload: null,
            error: {
                message: err?.message || "Failed to fetch from api-server",
                status: err?.status || null,
                body: err?.body || null,
            },
        });
    }
});

app.get("/healthz", (req, res) => {
    res.json({ status: "ok",message: "ejs-server is healthy" });
});

// 404 handler (keep this AFTER all other routes)
app.use((req, res) => {
    res.status(404).render("404", {
        title: "404 - Not Found",
        path: req.originalUrl,
        serverName: process.env.SERVER_NAME || "express-app",
    });
});



app.listen(PORT, () => {
    console.log("Server is running on port ",PORT);
});