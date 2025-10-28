import express from "express";
import { body } from "express-validator";
import {
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";

const router = express.Router();

router.use(authenticate);

// Leer
router.get("/:id", (req, res, next) => {
  if (req.params.id !== req.user.id) {
    return res.status(403).json({ error: "No autorizado" });
  }
  return getUserById(req, res, next);
});

// actualizar
router.put(
  "/:id",
  [
    body("email").optional().isEmail().withMessage("Email inválido"),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("La contraseña debe tener al menos 6 caracteres"),
    body("nombre").optional().notEmpty().withMessage("Nombre requerido"),
    validate,
  ],
  (req, res, next) => {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ error: "No autorizado" });
    }
    return updateUser(req, res, next);
  }
);

// eliminar
router.delete("/:id", (req, res, next) => {
  if (req.params.id !== req.user.id) {
    return res.status(403).json({ error: "No autorizado" });
  }
  return deleteUser(req, res, next);
});

export default router;
