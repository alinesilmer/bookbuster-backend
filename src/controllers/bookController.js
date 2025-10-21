import { db } from "../config/firebase.js"
import { COLLECTIONS } from "../config/constants.js"

export const getAllBooks = async (req, res) => {
  try {
    const booksSnapshot = await db.collection(COLLECTIONS.LIBROS).get()
    const books = []

    for (const doc of booksSnapshot.docs) {
      const bookData = doc.data()

      // Get authors
      const autoresSnapshot = await db.collection(COLLECTIONS.LIBROS).doc(doc.id).collection("autores").get()
      const autores = autoresSnapshot.docs.map((a) => ({ id: a.id, ...a.data() }))

      // Get genres
      const generosSnapshot = await db.collection(COLLECTIONS.LIBROS).doc(doc.id).collection("generos").get()
      const generos = generosSnapshot.docs.map((g) => ({ id: g.id, ...g.data() }))

      books.push({
        id: doc.id,
        ...bookData,
        autores,
        generos,
      })
    }

    res.json(books)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getBookById = async (req, res) => {
  try {
    const { id } = req.params
    const bookDoc = await db.collection(COLLECTIONS.LIBROS).doc(id).get()

    if (!bookDoc.exists) {
      return res.status(404).json({ error: "Book not found" })
    }

    const bookData = bookDoc.data()

    // Get authors
    const autoresSnapshot = await db.collection(COLLECTIONS.LIBROS).doc(id).collection("autores").get()
    const autores = autoresSnapshot.docs.map((a) => ({ id: a.id, ...a.data() }))

    // Get genres
    const generosSnapshot = await db.collection(COLLECTIONS.LIBROS).doc(id).collection("generos").get()
    const generos = generosSnapshot.docs.map((g) => ({ id: g.id, ...g.data() }))

    res.json({
      id: bookDoc.id,
      ...bookData,
      autores,
      generos,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const createBook = async (req, res) => {
  try {
    const { titulo, descripcion, idioma, portada_url, fecha_publicacion, autores, generos } = req.body

    const bookRef = await db.collection(COLLECTIONS.LIBROS).add({
      titulo,
      descripcion,
      idioma,
      portada_url: portada_url || null,
      fecha_publicacion: fecha_publicacion || null,
    })

    // Add authors as subcollection
    if (autores && autores.length > 0) {
      for (const autor of autores) {
        await bookRef.collection("autores").add({
          nombre: autor.nombre,
        })
      }
    }

    // Add genres as subcollection
    if (generos && generos.length > 0) {
      for (const genero of generos) {
        await bookRef.collection("generos").add({
          nombre: genero.nombre,
        })
      }
    }

    res.status(201).json({
      message: "Book created successfully",
      id: bookRef.id,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateBook = async (req, res) => {
  try {
    const { id } = req.params
    const { titulo, descripcion, idioma, portada_url, fecha_publicacion, autores, generos } = req.body

    const bookDoc = await db.collection(COLLECTIONS.LIBROS).doc(id).get()
    if (!bookDoc.exists) {
      return res.status(404).json({ error: "Book not found" })
    }

    const updateData = {}
    if (titulo) updateData.titulo = titulo
    if (descripcion) updateData.descripcion = descripcion
    if (idioma) updateData.idioma = idioma
    if (portada_url !== undefined) updateData.portada_url = portada_url
    if (fecha_publicacion !== undefined) updateData.fecha_publicacion = fecha_publicacion

    await db.collection(COLLECTIONS.LIBROS).doc(id).update(updateData)

    // Update authors if provided
    if (autores) {
      // Delete existing authors
      const existingAutores = await db.collection(COLLECTIONS.LIBROS).doc(id).collection("autores").get()

      const batch = db.batch()
      existingAutores.docs.forEach((doc) => batch.delete(doc.ref))
      await batch.commit()

      // Add new authors
      for (const autor of autores) {
        await db.collection(COLLECTIONS.LIBROS).doc(id).collection("autores").add({ nombre: autor.nombre })
      }
    }

    // Update genres if provided
    if (generos) {
      // Delete existing genres
      const existingGeneros = await db.collection(COLLECTIONS.LIBROS).doc(id).collection("generos").get()

      const batch = db.batch()
      existingGeneros.docs.forEach((doc) => batch.delete(doc.ref))
      await batch.commit()

      // Add new genres
      for (const genero of generos) {
        await db.collection(COLLECTIONS.LIBROS).doc(id).collection("generos").add({ nombre: genero.nombre })
      }
    }

    res.json({ message: "Book updated successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params

    const bookDoc = await db.collection(COLLECTIONS.LIBROS).doc(id).get()
    if (!bookDoc.exists) {
      return res.status(404).json({ error: "Book not found" })
    }

    // Delete subcollections (authors and genres)
    const autoresSnapshot = await db.collection(COLLECTIONS.LIBROS).doc(id).collection("autores").get()

    const generosSnapshot = await db.collection(COLLECTIONS.LIBROS).doc(id).collection("generos").get()

    const batch = db.batch()
    autoresSnapshot.docs.forEach((doc) => batch.delete(doc.ref))
    generosSnapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()

    // Delete book
    await db.collection(COLLECTIONS.LIBROS).doc(id).delete()

    res.json({ message: "Book deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
