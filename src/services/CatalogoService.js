import { db } from "../config/firebase.js";
import { COLLECTIONS } from "../config/constants.js";
import { BookFactory } from "../factory/BookFactory.js";

export const CatalogoService = {
  async crearLibro(dto) {
    //FACTORY: utiliza el Book Factory para crear un libro y normalizar campos múltiples como lo son autores y géneros
    const base = BookFactory.crear(dto);
    const autores = BookFactory.normalizarAutores(dto.autores);
    const generos = BookFactory.normalizarGeneros(dto.generos);

    const ref = await db.collection(COLLECTIONS.LIBROS).add(base);
    if (autores.length) {
      for (const a of autores) await ref.collection("autores").add(a);
    }
    if (generos.length) {
      for (const g of generos) await ref.collection("generos").add(g);
    }
    return { id: ref.id };
  },

  async actualizarLibro(id, dto) {
    const patch = {};
    if (dto.titulo !== undefined) patch.titulo = String(dto.titulo || "").trim();
    if (dto.descripcion !== undefined) patch.descripcion = dto.descripcion ?? null;
    if (dto.idioma !== undefined) patch.idioma = dto.idioma ?? null;
    if (dto.portada_url !== undefined) patch.portada_url = dto.portada_url || null;
    if (dto.fecha_publicacion !== undefined) patch.fecha_publicacion = dto.fecha_publicacion || null;

    await db.collection(COLLECTIONS.LIBROS).doc(id).update(patch);

    if (dto.autores) {
      const snap = await db.collection(COLLECTIONS.LIBROS).doc(id).collection("autores").get();
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      const autores = BookFactory.normalizarAutores(dto.autores);
      for (const a of autores) await db.collection(COLLECTIONS.LIBROS).doc(id).collection("autores").add(a);
    }

    if (dto.generos) {
      const snap = await db.collection(COLLECTIONS.LIBROS).doc(id).collection("generos").get();
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      const generos = BookFactory.normalizarGeneros(dto.generos);
      for (const g of generos) await db.collection(COLLECTIONS.LIBROS).doc(id).collection("generos").add(g);
    }
  },
};
