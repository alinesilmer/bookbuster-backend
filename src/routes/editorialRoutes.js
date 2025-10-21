import express from "express";
import { body } from "express-validator";
import {
  getAllEditorials,
  createEditorial,
} from "../controllers/editorialController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";

const router = express.Router();

// Public
router.get("/", getAllEditorials);

// Admin
router.post(
  "/",
  authenticate,
  requireAdmin,
  [body("nombre").notEmpty().withMessage("Name is required"), validate],
  createEditorial
);

export default router;
