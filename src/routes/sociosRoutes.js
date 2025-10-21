import express from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  getSocioByUsuarioId,
  listSocios,
} from "../controllers/sociosController.js";

const router = express.Router();

router.get("/", authenticate, requireAdmin, listSocios);
router.get("/by-user/:userId", authenticate, getSocioByUsuarioId);

export default router;
