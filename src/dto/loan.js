import { body } from "express-validator";

export const CreateLoan = [
  body("copia_id").isString().notEmpty(),
  body("socio_id").optional().isString().notEmpty(),
  body("fecha_vencimiento").optional().isISO8601(),
];

export const ReturnLoan = [
  body("createPenalty").optional().isBoolean(),
  body("penalty").optional().isObject(),
  body("penalty.motivo").optional().isString().isLength({ min: 2 }),
  body("penalty.monto").optional().isFloat({ gt: 0 }),
  body("penalty.detalle").optional().isString().isLength({ max: 500 }),
];

