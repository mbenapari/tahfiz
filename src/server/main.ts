import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import ViteExpress from "vite-express";
import { connectDb } from "./schemas/config.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

app.get("/hello", (_, res) => {
  res.send("Hello Vite + React + TypeScript!");
});

ViteExpress.listen(app, PORT, async () => {
  console.log(`Server is listening on port ${PORT}...`);
  await connectDb();
});
