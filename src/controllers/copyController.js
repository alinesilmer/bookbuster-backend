import { db } from "../config/firebase.js";
import {
  COLLECTIONS,
  ESTADO_COPIA,
  FORMATO_COPIA,
} from "../config/constants.js";

export const getAllCopies = async (req, res) => {
  try {
    const { libro_id } = req.query;
    let query = db.collection(COLLECTIONS.COPIAS);

    if (libro_id) {
      query = query.where("libro_id", "==", libro_id);
    }

    const copiesSnapshot = await query.get();
    const copies = [];

    for (const doc of copiesSnapshot.docs) {
      const copyData = doc.data();

      // Get book info
      let bookInfo = null;
      if (copyData.libro_id) {
        const bookDoc = await db
          .collection(COLLECTIONS.LIBROS)
          .doc(copyData.libro_id)
          .get();
        if (bookDoc.exists) {
          bookInfo = { id: bookDoc.id, titulo: bookDoc.data().titulo };
        }
      }

      // Get editorial info
      let editorialInfo = null;
      if (copyData.editorial_id) {
        const editorialDoc = await db
          .collection(COLLECTIONS.EDITORIALES)
          .doc(copyData.editorial_id)
          .get();
        if (editorialDoc.exists) {
          editorialInfo = {
            id: editorialDoc.id,
            nombre: editorialDoc.data().nombre,
          };
        }
      }

      copies.push({
        id: doc.id,
        ...copyData,
        libro: bookInfo,
        editorial: editorialInfo,
      });
    }

    res.json(copies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCopyById = async (req, res) => {
  try {
    const { id } = req.params;
    const copyDoc = await db.collection(COLLECTIONS.COPIAS).doc(id).get();

    if (!copyDoc.exists) {
      return res.status(404).json({ error: "Copia no encontrada" });
    }

    const copyData = copyDoc.data();

    // Get book info
    let bookInfo = null;
    if (copyData.libro_id) {
      const bookDoc = await db
        .collection(COLLECTIONS.LIBROS)
        .doc(copyData.libro_id)
        .get();
      if (bookDoc.exists) {
        bookInfo = { id: bookDoc.id, ...bookDoc.data() };
      }
    }

    // Get editorial info
    let editorialInfo = null;
    if (copyData.editorial_id) {
      const editorialDoc = await db
        .collection(COLLECTIONS.EDITORIALES)
        .doc(copyData.editorial_id)
        .get();
      if (editorialDoc.exists) {
        editorialInfo = { id: editorialDoc.id, ...editorialDoc.data() };
      }
    }

    res.json({
      id: copyDoc.id,
      ...copyData,
      libro: bookInfo,
      editorial: editorialInfo,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCopy = async (req, res) => {
  try {
    const { libro_id, editorial_id, isbn, edicion, formato } = req.body;

    const bookDoc = await db.collection(COLLECTIONS.LIBROS).doc(libro_id).get();
    if (!bookDoc.exists) {
      return res.status(404).json({ error: "Libro no encontrado" });
    }

    const editorialDoc = await db
      .collection(COLLECTIONS.EDITORIALES)
      .doc(editorial_id)
      .get();
    if (!editorialDoc.exists) {
      return res.status(404).json({ error: "Editorial no encontrada" });
    }

    // Validate formato
    if (!Object.values(FORMATO_COPIA).includes(formato)) {
      return res.status(400).json({ error: "formato inválido" });
    }

    const copyRef = await db.collection(COLLECTIONS.COPIAS).add({
      libro_id,
      editorial_id,
      isbn: isbn || null,
      edicion: edicion || null,
      formato,
      estado: ESTADO_COPIA.DISPONIBLE,
    });

    res.status(201).json({
      message: "Copy created successfully",
      id: copyRef.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCopy = async (req, res) => {
  try {
    const { id } = req.params;
    const { libro_id, editorial_id, isbn, edicion, formato, estado } = req.body;

    const copyDoc = await db.collection(COLLECTIONS.COPIAS).doc(id).get();
    if (!copyDoc.exists) {
      return res.status(404).json({ error: "Copia no encontrada" });
    }

    const updateData = {};

    if (libro_id) {
      const bookDoc = await db
        .collection(COLLECTIONS.LIBROS)
        .doc(libro_id)
        .get();
      if (!bookDoc.exists) {
        return res.status(404).json({ error: "Book not found" });
      }
      updateData.libro_id = libro_id;
    }

    if (editorial_id) {
      const editorialDoc = await db
        .collection(COLLECTIONS.EDITORIALES)
        .doc(editorial_id)
        .get();
      if (!editorialDoc.exists) {
        return res.status(404).json({ error: "Editorial no encontrada" });
      }
      updateData.editorial_id = editorial_id;
    }

    if (isbn !== undefined) updateData.isbn = isbn;
    if (edicion !== undefined) updateData.edicion = edicion;
    if (formato) {
      if (!Object.values(FORMATO_COPIA).includes(formato)) {
        return res.status(400).json({ error: "formato inválido" });
      }
      updateData.formato = formato;
    }
    if (estado) {
      if (!Object.values(ESTADO_COPIA).includes(estado)) {
        return res.status(400).json({ error: "estado inválido" });
      }
      updateData.estado = estado;
    }

    await db.collection(COLLECTIONS.COPIAS).doc(id).update(updateData);

    res.json({ message: "Copia actualizada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCopy = async (req, res) => {
  try {
    const { id } = req.params;

    const copyDoc = await db.collection(COLLECTIONS.COPIAS).doc(id).get();
    if (!copyDoc.exists) {
      return res.status(404).json({ error: "Copia no encontrada" });
    }

    // Check if copy has active loans
    const activeLoans = await db
      .collection(COLLECTIONS.PRESTAMOS)
      .where("copia_id", "==", id)
      .where("estado", "==", "ACTIVO")
      .get();

    if (!activeLoans.empty) {
      return res
        .status(400)
        .json({ error: "No se puede eliminar una copia con préstamo activo" });
    }

    await db.collection(COLLECTIONS.COPIAS).doc(id).delete();

    res.json({ message: "copia eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
