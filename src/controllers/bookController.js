import { db } from "../config/firebase.js";
import { COLLECTIONS } from "../config/constants.js";
import { CatalogoService } from "../services/CatalogoService.js";
//CONTROLADOR DE LIBROS UTILIZANDO EL SERVICIO CATÁLOGO COMO FACHADA

//OBTENER TODOS LOS LIBROS -- en este ejemplo se puede ver que no se usa la fachada, con lo cual el controlador tiene acceso
//a las colecciones de firebase, y el código se vuelve más largo y complejo
export const getAllBooks = async (_req, res) => {
  try {
    const booksSnapshot = await db.collection(COLLECTIONS.LIBROS).get();
    const books = [];
    for (const doc of booksSnapshot.docs) {
      const bookData = doc.data();
      const autoresSnapshot = await db.collection(COLLECTIONS.LIBROS).doc(doc.id).collection("autores").get();
      const generosSnapshot = await db.collection(COLLECTIONS.LIBROS).doc(doc.id).collection("generos").get();
      books.push({
        id: doc.id,
        ...bookData,
        autores: autoresSnapshot.docs.map(a => ({ id: a.id, ...a.data() })),
        generos: generosSnapshot.docs.map(g => ({ id: g.id, ...g.data() })),
      });
    }
    res.json(books);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

//OBTENER UN LIBRO EN ESPECÍFICO
export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const bookDoc = await db.collection(COLLECTIONS.LIBROS).doc(id).get();
    if (!bookDoc.exists) return res.status(404).json({ error: "Book not found" });
    const autoresSnapshot = await db.collection(COLLECTIONS.LIBROS).doc(id).collection("autores").get();
    const generosSnapshot = await db.collection(COLLECTIONS.LIBROS).doc(id).collection("generos").get();
    res.json({
      id: bookDoc.id,
      ...bookDoc.data(),
      autores: autoresSnapshot.docs.map(a => ({ id: a.id, ...a.data() })),
      generos: generosSnapshot.docs.map(g => ({ id: g.id, ...g.data() })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


//CREAR UN LIBRO USANDO FACHADA
export const createBook = async (req, res) => {
  try {
    const { id } = await CatalogoService.crearLibro(req.body);
    res.status(201).json({ message: "Book created successfully", id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


//ACTUALIZAR UN LIBRO USANDO FACHADA
export const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    await CatalogoService.actualizarLibro(id, req.body);
    res.json({ message: "Book updated successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


//ELIMINAR UN LIBRO
export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const bookRef = db.collection(COLLECTIONS.LIBROS).doc(id);
    const bookDoc = await bookRef.get();
    if (!bookDoc.exists) return res.status(404).json({ error: "Book not found" });

    const autoresSnapshot = await bookRef.collection("autores").get();
    const generosSnapshot = await bookRef.collection("generos").get();

    const batch = db.batch();
    autoresSnapshot.docs.forEach(d => batch.delete(d.ref));
    generosSnapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();

    await bookRef.delete();
    res.json({ message: "Book deleted successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
