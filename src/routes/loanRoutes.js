import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { listLoans, createLoan, returnLoan } from "../controllers/loanController.js";

const router = Router();

router.get("/", authenticate, listLoans);
router.post("/", authenticate, createLoan);
router.patch("/:id/return", authenticate, returnLoan);

export default router;
