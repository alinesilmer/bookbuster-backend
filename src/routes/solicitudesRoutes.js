import express from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  listSolicitudes,
  approveSolicitud,
  rejectSolicitud,
} from "../controllers/solicitudesController.js";

const router = express.Router();

router.get("/", authenticate, requireAdmin, listSolicitudes);
router.post("/:id/approve", authenticate, requireAdmin, approveSolicitud);
router.post("/:id/reject", authenticate, requireAdmin, rejectSolicitud);

export default router;
