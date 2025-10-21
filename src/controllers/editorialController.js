import { db } from "../config/firebase.js"
import { COLLECTIONS } from "../config/constants.js"

export const getAllEditorials = async (req, res) => {
  try {
    const editorialsSnapshot = await db.collection(COLLECTIONS.EDITORIALES).get()
    const editorials = editorialsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    res.json(editorials)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const createEditorial = async (req, res) => {
  try {
    const { nombre } = req.body

    // Check if editorial already exists
    const existingEditorial = await db.collection(COLLECTIONS.EDITORIALES).where("nombre", "==", nombre).get()

    if (!existingEditorial.empty) {
      return res.status(400).json({ error: "Editorial already exists" })
    }

    const editorialRef = await db.collection(COLLECTIONS.EDITORIALES).add({ nombre })

    res.status(201).json({
      message: "Editorial created successfully",
      id: editorialRef.id,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
