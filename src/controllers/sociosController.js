import { db } from "../config/firebase.js";
import { COLLECTIONS } from "../config/constants.js";

export const listSocios = async (_req, res) => {
  try {
    const snap = await db.collection(COLLECTIONS.SOCIOS).get();
    const uniq = new Map();
    const out = [];

    for (const d of snap.docs) {
      const s = { id: d.id, ...d.data() };
      const key = s.usuario_id || d.id;
      if (uniq.has(key)) continue;
      uniq.set(key, true);

      let usuario = null;
      if (s.usuario_id) {
        const ud = await db.collection(COLLECTIONS.USUARIOS).doc(s.usuario_id).get();
        usuario = ud.exists ? ud.data() : null;
      }

      out.push({
        id: s.id,
        usuario_id: s.usuario_id,
        nombre: usuario?.nombre ?? "-",
        email: usuario?.email ?? "-",
        activo: usuario?.activo ?? true,
        prestamos_activos: s.prestamos_activos ?? 0,
        multas_pendientes: s.multas_pendientes ?? 0,
        nro_socio: s.nro_socio ?? usuario?.nro_socio ?? null,
      });
    }

    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getSocioByUsuarioId = async (req, res) => {
  try {
    const { userId } = req.params;
    const snap = await db.collection(COLLECTIONS.SOCIOS).where("usuario_id", "==", userId).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: "Socio no encontrado" });
    const doc = snap.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
