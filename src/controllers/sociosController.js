import { db } from "../config/firebase.js";
import {
  COLLECTIONS,
  ESTADO_PRESTAMO,
  ESTADO_MULTA,
} from "../config/constants.js";

export const getSocioByUsuarioId = async (req, res) => {
  try {
    const { userId } = req.params;
    const snap = await db
      .collection(COLLECTIONS.SOCIOS)
      .where("usuario_id", "==", userId)
      .limit(1)
      .get();
    if (snap.empty) return res.status(404).json({ error: "Socio not found" });
    const doc = snap.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const listSocios = async (_req, res) => {
  try {
    const sociosSnap = await db.collection(COLLECTIONS.SOCIOS).get();
    const out = [];
    for (const s of sociosSnap.docs) {
      const socio = s.data();
      const userDoc = await db
        .collection(COLLECTIONS.USUARIOS)
        .doc(socio.usuario_id)
        .get();
      if (!userDoc.exists) continue;
      const u = userDoc.data();
      const prestamosSnap = await db
        .collection(COLLECTIONS.PRESTAMOS)
        .where("socio_id", "==", s.id)
        .where("estado", "==", ESTADO_PRESTAMO.ACTIVO)
        .get();
      const multasSnap = await db
        .collection(COLLECTIONS.MULTAS)
        .where("socio_id", "==", s.id)
        .get();
      let deuda = 0;
      multasSnap.forEach((m) => {
        const d = m.data();
        if (d.estado !== ESTADO_MULTA.PAGADA) deuda += Number(d.monto || 0);
      });
      out.push({
        id: s.id,
        usuario_id: socio.usuario_id,
        dni: socio.dni || null,
        nombre: u.nombre,
        email: u.email,
        activo: u.activo !== false,
        prestamos_activos: prestamosSnap.size,
        multas_pendientes: deuda,
      });
    }
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
