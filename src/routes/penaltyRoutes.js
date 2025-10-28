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
import { MULTA_TIPO } from "../config/constants.js";

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get("/", getAllPenalties);
router.get("/:id", getPenaltyById);

router.post(
  "/",
  [
    body("socio_id").notEmpty(),
    body("prestamo_id").optional().isString(),
    body("tipo").isIn(Object.values(MULTA_TIPO)),
    body("detalle").optional().isString().isLength({ max: 500 }),
    validate,
  ],
  createPenalty
);

router.patch("/:id", updatePenalty);
router.delete("/:id", deletePenalty);

export default router;
