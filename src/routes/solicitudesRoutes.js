import express from "express";
import { body } from "express-validator";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { listSolicitudes, createSolicitud, approveSolicitud, rejectSolicitud } from "../controllers/solicitudesController.js";

const router = express.Router();

router.get("/", authenticate, requireAdmin, listSolicitudes);

router.post(
  "/",
  [body("nombre").notEmpty(), body("email").isEmail(), validate],
  createSolicitud
);

router.post("/:id/approve", authenticate, requireAdmin, approveSolicitud);
router.post("/:id/reject", authenticate, requireAdmin, [body("motivo").notEmpty(), validate], rejectSolicitud);

export default router;
