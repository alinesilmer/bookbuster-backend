//OBJETIVO: homogenizar y validar los datos de entrada para crear y actualizar libros

import { body } from "express-validator";

export const CreateBookDTO = [
  body("titulo").isString().notEmpty(),
  body("descripcion").optional().isString(),
  body("idioma").optional().isString(),
  body("portada_url").optional().isURL().bail().isString(),
  body("fecha_publicacion").optional().isISO8601(),
  body("autores").optional().isArray(),
  body("autores.*.nombre").optional().isString().notEmpty(),
  body("generos").optional().isArray(),
  body("generos.*.nombre").optional().isString().notEmpty(),
];

export const UpdateBookDTO = [
  body("titulo").optional().isString(),
  body("descripcion").optional().isString(),
  body("idioma").optional().isString(),
  body("portada_url").optional().isString(),
  body("fecha_publicacion").optional().isISO8601(),
  body("autores").optional().isArray(),
  body("autores.*.nombre").optional().isString().notEmpty(),
  body("generos").optional().isArray(),
  body("generos.*.nombre").optional().isString().notEmpty(),
];
