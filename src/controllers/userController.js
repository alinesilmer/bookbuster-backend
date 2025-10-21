import { db } from "../config/firebase.js";
import bcrypt from "bcryptjs";
import { COLLECTIONS } from "../config/constants.js";

export const getAllUsers = async (_req, res) => {
  res.status(403).json({ error: "No autorizado" });
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const userDoc = await db.collection(COLLECTIONS.USUARIOS).doc(id).get();
    if (!userDoc.exists)
      return res.status(404).json({ error: "Usuario no encontrado" });
    const data = userDoc.data();
    const out = {
      id: userDoc.id,
      email: data.email,
      nombre: data.nombre,
      rol: data.rol,
      activo: data.activo !== false,
      creado_en: data.creado_en || null,
    };
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const createUser = async (_req, res) => {
  res.status(403).json({ error: "No autorizado" });
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, nombre, password } = req.body;

    const userRef = db.collection(COLLECTIONS.USUARIOS).doc(id);
    const userDoc = await userRef.get();
    if (!userDoc.exists)
      return res.status(404).json({ error: "Usuario no encontrado" });

    const updateData = {};
    if (email) updateData.email = email;
    if (nombre) updateData.nombre = nombre;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    await userRef.update(updateData);
    res.json({ message: "Usuario actualizado" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "id requerido" });

    const userRef = db.collection(COLLECTIONS.USUARIOS).doc(id);
    const userDoc = await userRef.get();
    if (!userDoc.exists)
      return res.status(404).json({ error: "Usuario no encontrado" });

    const batch = db.batch();

    const sociosSnap = await db
      .collection(COLLECTIONS.SOCIOS)
      .where("usuario_id", "==", id)
      .get();
    sociosSnap.forEach((d) => batch.delete(d.ref));

    const sesionesSnap = await db
      .collection(COLLECTIONS.SESIONES)
      .where("userId", "==", id)
      .get();
    sesionesSnap.forEach((d) => batch.delete(d.ref));

    batch.delete(userRef);
    await batch.commit();

    res.json({ message: "Usuario eliminado" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
