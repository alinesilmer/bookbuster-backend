import express from "express";
import { body } from "express-validator";
import {
  getAllCopies,
  getCopyById,
  createCopy,
  updateCopy,
  deleteCopy,
} from "../controllers/copyController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";

const router = express.Router();

// Public
router.get("/", getAllCopies);
router.get("/:id", getCopyById);

// Admin
router.post(
  "/",
  authenticate,
  requireAdmin,
  [
    body("libro_id").notEmpty().withMessage("Book ID is required"),
    body("editorial_id").notEmpty().withMessage("Editorial ID is required"),
    body("formato").notEmpty().withMessage("Format is required"),
    validate,
  ],
  createCopy
);

router.put("/:id", authenticate, requireAdmin, updateCopy);
router.delete("/:id", authenticate, requireAdmin, deleteCopy);

export default router;
