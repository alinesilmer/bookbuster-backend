import express from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { CreateBookDTO, UpdateBookDTO } from "../dto/book.js";
import { getAllBooks, getBookById, createBook, updateBook, deleteBook } from "../controllers/bookController.js";

const router = express.Router();

router.get("/", getAllBooks);
router.get("/:id", getBookById);
//USO DE VALIDACIONES DTO para la creación de libros y actualización de libros
router.post("/", authenticate, requireAdmin, CreateBookDTO, validate, createBook);
router.patch("/:id", authenticate, requireAdmin, UpdateBookDTO, validate, updateBook);
router.delete("/:id", authenticate, requireAdmin, deleteBook);

export default router;
