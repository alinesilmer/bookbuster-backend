import bcrypt from "bcryptjs";
import { db } from "../config/firebase.js";
import { COLLECTIONS, ROLES, ESTADO_SOLICITUD } from "../config/constants.js";

export const listSolicitudes = async (_req, res) => {
  try {
    const snap = await db
      .collection(COLLECTIONS.SOLICITUDES)
      .where("estado", "==", ESTADO_SOLICITUD.PENDIENTE)
      .get();
    const out = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const approveSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db.collection(COLLECTIONS.SOLICITUDES).doc(id);
    const doc = await ref.get();
    if (!doc.exists)
      return res.status(404).json({ error: "Solicitud no encontrada" });
    const data = doc.data();
    if (data.estado !== ESTADO_SOLICITUD.PENDIENTE)
      return res.status(400).json({ error: "Solicitud ya procesada" });

    const exists = await db
      .collection(COLLECTIONS.USUARIOS)
      .where("email", "==", data.email)
      .limit(1)
      .get();
    if (!exists.empty)
      return res.status(400).json({ error: "Email ya registrado" });

    const userRef = await db.collection(COLLECTIONS.USUARIOS).add({
      email: data.email,
      password: data.password_hash || (await bcrypt.hash("temporal123", 10)),
      nombre: data.nombre,
      rol: ROLES.SOCIO,
      activo: true,
      creado_en: new Date().toISOString(),
    });

    await db.collection(COLLECTIONS.SOCIOS).add({
      usuario_id: userRef.id,
      dni: data.dni || null,
      creado_en: new Date().toISOString(),
    });

    await ref.update({ estado: ESTADO_SOLICITUD.APROBADA });
    res.json({ message: "Solicitud aprobada" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const rejectSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db.collection(COLLECTIONS.SOLICITUDES).doc(id);
    const doc = await ref.get();
    if (!doc.exists)
      return res.status(404).json({ error: "Solicitud no encontrada" });
    await ref.update({ estado: ESTADO_SOLICITUD.RECHAZADA });
    res.json({ message: "Solicitud rechazada" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
