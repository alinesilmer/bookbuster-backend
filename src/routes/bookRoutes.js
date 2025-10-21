import express from "express";
import { body } from "express-validator";
import {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/bookController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";

const router = express.Router();

// Public
router.get("/", getAllBooks);
router.get("/:id", getBookById);

// Admin
router.post(
  "/",
  authenticate,
  requireAdmin,
  [
    body("titulo").notEmpty().withMessage("Title is required"),
    body("idioma").notEmpty().withMessage("Language is required"),
    validate,
  ],
  createBook
);

router.put("/:id", authenticate, requireAdmin, updateBook);
router.delete("/:id", authenticate, requireAdmin, deleteBook);

export default router;
