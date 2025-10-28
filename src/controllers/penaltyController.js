import { db } from "../config/firebase.js";
import {
  COLLECTIONS,
  ESTADO_MULTA,
  MULTA_TIPO,
  MULTA_MONTOS,
} from "../config/constants.js";
import { FixedByTypePenaltyStrategy } from "../strategy/FixedByTypePenaltyStrategy.js";

const isoToday = () => new Date().toISOString().slice(0, 10);

async function getSocioInfoById(socioId) {
  const socioDoc = await db.collection(COLLECTIONS.SOCIOS).doc(socioId).get();
  if (!socioDoc.exists) return null;
  const socioData = socioDoc.data();
  const userDoc = socioData?.usuario_id
    ? await db.collection(COLLECTIONS.USUARIOS).doc(socioData.usuario_id).get()
    : null;

  return {
    id: socioDoc.id,
    dni: socioData?.dni ?? null,
    nombre: userDoc?.exists ? userDoc.data().nombre : null,
  };
}

async function getPrestamoInfoById(prestamoId) {
  const prestamoDoc = await db.collection(COLLECTIONS.PRESTAMOS).doc(prestamoId).get();
  if (!prestamoDoc.exists) return null;
  return { id: prestamoDoc.id, ...prestamoDoc.data() };
}

export const getAllPenalties = async (req, res) => {
  try {
    const { socio_id } = req.query;
    let query = db.collection(COLLECTIONS.MULTAS);
    if (socio_id) query = query.where("socio_id", "==", socio_id);

    const snap = await query.get();
    const penalties = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        const socio = data.socio_id ? await getSocioInfoById(data.socio_id) : null;
        return { id: d.id, ...data, socio };
      })
    );

    res.json(penalties);
  } catch (error) {
    res.status(500).json({ error: error.message || "Error" });
  }
};

export const getPenaltyById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection(COLLECTIONS.MULTAS).doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Multa no encontrada" });

    const data = doc.data();
    const socio = data.socio_id ? await getSocioInfoById(data.socio_id) : null;
    const prestamo = data.prestamo_id ? await getPrestamoInfoById(data.prestamo_id) : null;

    res.json({ id: doc.id, ...data, socio, prestamo });
  } catch (error) {
    res.status(500).json({ error: error.message || "Error" });
  }
};

export const createPenalty = async (req, res) => {
  try {
    const { socio_id, prestamo_id, tipo, detalle } = req.body;

    if (!Object.values(MULTA_TIPO).includes(tipo)) {
      return res.status(400).json({ error: "Tipo de multa inválido" });
    }

    const socioDoc = await db.collection(COLLECTIONS.SOCIOS).doc(socio_id).get();
    if (!socioDoc.exists) return res.status(404).json({ error: "Socio no encontrado" });

    let prestamoIdToSave = null;
    if (prestamo_id) {
      const prestamoDoc = await db.collection(COLLECTIONS.PRESTAMOS).doc(prestamo_id).get();
      if (!prestamoDoc.exists) return res.status(404).json({ error: "Préstamo no encontrado" });
      prestamoIdToSave = prestamo_id;
    }

    //STRATEGY: se pasa a la estrategia la tabla de montos y se le delega el cálculo
    const strategy = new FixedByTypePenaltyStrategy(MULTA_MONTOS);
    const monto = strategy.calcular({ tipo });
    if (!Number.isFinite(monto) || monto <= 0) {
      return res.status(400).json({ error: "Monto no definido para el tipo de multa" });
    }

    const motivo =
      tipo === MULTA_TIPO.DEVOLUCION_TARDIA
        ? "Devolución tardía"
        : tipo === MULTA_TIPO.LIBRO_DANIADO
        ? "Libro dañado"
        : "Libro perdido";

    const ref = await db.collection(COLLECTIONS.MULTAS).add({
      socio_id,
      prestamo_id: prestamoIdToSave,
      monto,
      motivo,
      detalle: detalle || null,
      tipo,
      fecha: isoToday(),
      estado: ESTADO_MULTA.PENDIENTE,
    });

    res.status(201).json({ message: "Multa creada exitosamente", id: ref.id });
  } catch (error) {
    res.status(500).json({ error: error.message || "Error" });
  }
};

export const updatePenalty = async (req, res) => {
  try {
    const { id } = req.params;
    const { detalle, estado } = req.body;

    const doc = await db.collection(COLLECTIONS.MULTAS).doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Multa no encontrada" });

    const updateData = {};
    if (detalle !== undefined) updateData.detalle = detalle;
    if (estado) updateData.estado = estado;

    await db.collection(COLLECTIONS.MULTAS).doc(id).update(updateData);
    res.json({ message: "Multa actualizada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message || "Error" });
  }
};

export const deletePenalty = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection(COLLECTIONS.MULTAS).doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Multa no encontrada" });

    await db.collection(COLLECTIONS.MULTAS).doc(id).delete();
    res.json({ message: "Multa eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message || "Error" });
  }
};
