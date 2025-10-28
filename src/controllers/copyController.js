import { db } from "../config/firebase.js";
import { COLLECTIONS, ESTADO_COPIA, FORMATO_COPIA } from "../config/constants.js";

const normalizeFormato = (v) => {
  if (!v) return null;
  const s = String(v).trim().toUpperCase();
  const map = {
    "FISICO": "FISICO",
    "FÍSICO": "FISICO",
    "PAPEL": "FISICO",
    "IMPRESO": "FISICO",
    "PDF": "PDF",
    "EPUB": "EPUB",
    "E-PUB": "EPUB",
    "AUDIOBOOK": "AUDIOBOOK",
    "AUDIOLIBRO": "AUDIOBOOK",
    "AUDIO": "AUDIOBOOK",
    "DIGITAL": "PDF",
  };
  return map[s] || null;
};

export const getAllCopies = async (req, res) => {
  try {
    const { libro_id } = req.query;
    let query = db.collection(COLLECTIONS.COPIAS);
    if (libro_id) query = query.where("libro_id", "==", libro_id);

    const snap = await query.get();
    const out = [];

    for (const doc of snap.docs) {
      const data = doc.data();

      let bookInfo = null;
      if (data.libro_id) {
        const b = await db.collection(COLLECTIONS.LIBROS).doc(data.libro_id).get();
        if (b.exists) bookInfo = { id: b.id, titulo: b.data().titulo };
      }

      let editorialInfo = null;
      if (data.editorial_id) {
        const e = await db.collection(COLLECTIONS.EDITORIALES).doc(data.editorial_id).get();
        if (e.exists) editorialInfo = { id: e.id, nombre: e.data().nombre };
      }

      out.push({ id: doc.id, ...data, libro: bookInfo, editorial: editorialInfo });
    }

    res.json(out);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCopyById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection(COLLECTIONS.COPIAS).doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Copia no encontrada" });

    const data = doc.data();

    let bookInfo = null;
    if (data.libro_id) {
      const b = await db.collection(COLLECTIONS.LIBROS).doc(data.libro_id).get();
      if (b.exists) bookInfo = { id: b.id, ...b.data() };
    }

    let editorialInfo = null;
    if (data.editorial_id) {
      const e = await db.collection(COLLECTIONS.EDITORIALES).doc(data.editorial_id).get();
      if (e.exists) editorialInfo = { id: e.id, ...e.data() };
    }

    res.json({ id: doc.id, ...data, libro: bookInfo, editorial: editorialInfo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCopy = async (req, res) => {
  try {
    const { libro_id, editorial_id, isbn, edicion, formato } = req.body;

    const b = await db.collection(COLLECTIONS.LIBROS).doc(libro_id).get();
    if (!b.exists) return res.status(404).json({ error: "Libro no encontrado" });

    const e = await db.collection(COLLECTIONS.EDITORIALES).doc(editorial_id).get();
    if (!e.exists) return res.status(404).json({ error: "Editorial no encontrada" });

    const fmt = normalizeFormato(formato);
    if (!fmt || !Object.values(FORMATO_COPIA).includes(fmt)) {
      return res.status(400).json({ error: "formato inválido" });
    }

    const ref = await db.collection(COLLECTIONS.COPIAS).add({
      libro_id,
      editorial_id,
      isbn: isbn || null,
      edicion: edicion || null,
      formato: fmt,
      estado: ESTADO_COPIA.DISPONIBLE,
    });

    res.status(201).json({ message: "Copy created successfully", id: ref.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCopy = async (req, res) => {
  try {
    const { id } = req.params;
    const { libro_id, editorial_id, isbn, edicion, formato, estado } = req.body;

    const doc = await db.collection(COLLECTIONS.COPIAS).doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Copia no encontrada" });

    const patch = {};

    if (libro_id) {
      const b = await db.collection(COLLECTIONS.LIBROS).doc(libro_id).get();
      if (!b.exists) return res.status(404).json({ error: "Libro no encontrado" });
      patch.libro_id = libro_id;
    }

    if (editorial_id) {
      const e = await db.collection(COLLECTIONS.EDITORIALES).doc(editorial_id).get();
      if (!e.exists) return res.status(404).json({ error: "Editorial no encontrada" });
      patch.editorial_id = editorial_id;
    }

    if (isbn !== undefined) patch.isbn = isbn;
    if (edicion !== undefined) patch.edicion = edicion;

    if (formato !== undefined) {
      const fmt = normalizeFormato(formato);
      if (!fmt || !Object.values(FORMATO_COPIA).includes(fmt)) {
        return res.status(400).json({ error: "formato inválido" });
      }
      patch.formato = fmt;
    }

    if (estado !== undefined) {
      if (!Object.values(ESTADO_COPIA).includes(estado)) {
        return res.status(400).json({ error: "estado inválido" });
      }
      patch.estado = estado;
    }

    await db.collection(COLLECTIONS.COPIAS).doc(id).update(patch);
    res.json({ message: "Copia actualizada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCopy = async (req, res) => {
  try {
    const { id } = req.params;

    const copyRef = db.collection(COLLECTIONS.COPIAS).doc(id);
    const copyDoc = await copyRef.get();
    if (!copyDoc.exists) return res.status(404).json({ error: "Copia no encontrada" });

    const activeLoans = await db
      .collection(COLLECTIONS.PRESTAMOS)
      .where("copia_id", "==", id)
      .where("estado", "==", "ACTIVO")
      .get();

    if (!activeLoans.empty) {
      return res.status(400).json({ error: "No se puede eliminar una copia con préstamo activo" });
    }

    await copyRef.delete();
    res.json({ message: "copia eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
