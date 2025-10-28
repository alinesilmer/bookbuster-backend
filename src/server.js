import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import copyRoutes from "./routes/copyRoutes.js";
import sociosRoutes from "./routes/sociosRoutes.js";
import penaltyRoutes from "./routes/penaltyRoutes.js";
import editorialRoutes from "./routes/editorialRoutes.js";
import solicitudesRoutes from "./routes/solicitudesRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";
import devRoutes from "./routes/devRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { verifyMailer } from "./utils/mailer.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ORIGINS = [process.env.FRONTEND_ORIGIN || "http://localhost:3000", "http://127.0.0.1:3000"];

app.use(
  cors({
    origin: ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || "dev-cookie-secret"));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/copies", copyRoutes);
app.use("/api/socios", sociosRoutes);
app.use("/api/penalties", penaltyRoutes);
app.use("/api/editoriales", editorialRoutes);
app.use("/api/solicitudes", solicitudesRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/dev", devRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Bookbuster API is running" });
});

app.use(errorHandler);
 
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Bookbuster Backend API`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  verifyMailer();
});
