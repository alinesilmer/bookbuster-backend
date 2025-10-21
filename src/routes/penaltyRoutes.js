import express from "express";
import { body } from "express-validator";
import {
  getAllPenalties,
  getPenaltyById,
  createPenalty,
  updatePenalty,
  deletePenalty,
} from "../controllers/penaltyController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";

const router = express.Router();

// All penalty routes 
router.use(authenticate, requireAdmin);

router.get("/", getAllPenalties);
router.get("/:id", getPenaltyById);

router.post(
  "/",
  [
    body("socio_id").notEmpty().withMessage("Socio ID is required"),
    body("prestamo_id").optional(),
    body("monto").isNumeric().withMessage("Amount must be numeric"),
    body("motivo").notEmpty().withMessage("Reason is required"),
    validate,
  ],
  createPenalty
);

router.put("/:id", updatePenalty);
router.delete("/:id", deletePenalty);

export default router;
