import { body } from "express-validator";

export const CreateCopyDTO = [
  body("libro_id").isString().notEmpty(),
  body("editorial_id").isString().notEmpty(),
  body("formato").isString().notEmpty(),
  body("isbn").optional().isString(),
  body("edicion").optional().isString(),
];

export const UpdateCopyDTO = [
  body("libro_id").optional().isString(),
  body("editorial_id").optional().isString(),
  body("formato").optional().isString(),
  body("isbn").optional().isString(),
  body("edicion").optional().isString(),
  body("estado").optional().isString(),
];
