import express from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { listSocios, getSocioByUsuarioId } from "../controllers/sociosController.js";

const router = express.Router();

router.use(authenticate);
router.get("/", requireAdmin, listSocios);
router.get("/by-user/:userId", getSocioByUsuarioId);

export default router;
