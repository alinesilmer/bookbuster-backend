import { db } from "../config/firebase.js";
import { COLLECTIONS } from "../config/constants.js";

export const getAllEditorials = async (req, res) => {
  try {
    const snap = await db.collection(COLLECTIONS.EDITORIALES).orderBy("nombre").get();
    const out = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const createEditorial = async (req, res) => {
  try {
    const nombre = String(req.body.nombre || "").trim();
    if (!nombre) return res.status(400).json({ error: "Name is required" });
    const exists = await db.collection(COLLECTIONS.EDITORIALES).where("nombre", "==", nombre).limit(1).get();
    if (!exists.empty) return res.status(400).json({ error: "Editorial already exists" });
    const ref = await db.collection(COLLECTIONS.EDITORIALES).add({ nombre });
    res.status(201).json({ message: "Editorial created successfully", id: ref.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
