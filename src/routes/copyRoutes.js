import express from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { CreateCopyDTO, UpdateCopyDTO } from "../dto/copy.js";
import { getAllCopies, getCopyById, createCopy, updateCopy, deleteCopy } from "../controllers/copyController.js";

const router = express.Router();

router.get("/", getAllCopies);
router.get("/:id", getCopyById);
//USO DE VALIDACIONES DTO para la creación de copias y actualización de copias
router.post("/", authenticate, requireAdmin, CreateCopyDTO, validate, createCopy);
router.patch("/:id", authenticate, requireAdmin, UpdateCopyDTO, validate, updateCopy);
router.delete("/:id", authenticate, requireAdmin, deleteCopy);

export default router;
