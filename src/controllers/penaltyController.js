import { db } from "../config/firebase.js";
import { COLLECTIONS, ESTADO_MULTA } from "../config/constants.js";

export const getAllPenalties = async (req, res) => {
  try {
    const { socio_id } = req.query;
    let query = db.collection(COLLECTIONS.MULTAS);
    if (socio_id) query = query.where("socio_id", "==", socio_id);

    const penaltiesSnapshot = await query.get();
    const penalties = [];

    for (const doc of penaltiesSnapshot.docs) {
      const penaltyData = doc.data();

      // socio info
      let socioInfo = null;
      if (penaltyData.socio_id) {
        const socioDoc = await db
          .collection(COLLECTIONS.SOCIOS)
          .doc(penaltyData.socio_id)
          .get();
        if (socioDoc.exists) {
          const socioData = socioDoc.data();
          const userDoc = await db
            .collection(COLLECTIONS.USUARIOS)
            .doc(socioData.usuario_id)
            .get();
          socioInfo = {
            id: socioDoc.id,
            dni: socioData.dni,
            nombre: userDoc.exists ? userDoc.data().nombre : null,
          };
        }
      }

      penalties.push({ id: doc.id, ...penaltyData, socio: socioInfo });
    }

    res.json(penalties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPenaltyById = async (req, res) => {
  try {
    const { id } = req.params;
    const penaltyDoc = await db.collection(COLLECTIONS.MULTAS).doc(id).get();
    if (!penaltyDoc.exists)
      return res.status(404).json({ error: "Multa no encontrada" });

    const penaltyData = penaltyDoc.data();

    let socioInfo = null;
    if (penaltyData.socio_id) {
      const socioDoc = await db
        .collection(COLLECTIONS.SOCIOS)
        .doc(penaltyData.socio_id)
        .get();
      if (socioDoc.exists) {
        const socioData = socioDoc.data();
        const userDoc = await db
          .collection(COLLECTIONS.USUARIOS)
          .doc(socioData.usuario_id)
          .get();
        socioInfo = {
          id: socioDoc.id,
          ...socioData,
          nombre: userDoc.exists ? userDoc.data().nombre : null,
        };
      }
    }

    let prestamoInfo = null;
    if (penaltyData.prestamo_id) {
      const prestamoDoc = await db
        .collection(COLLECTIONS.PRESTAMOS)
        .doc(penaltyData.prestamo_id)
        .get();
      if (prestamoDoc.exists)
        prestamoInfo = { id: prestamoDoc.id, ...prestamoDoc.data() };
    }

    res.json({
      id: penaltyDoc.id,
      ...penaltyData,
      socio: socioInfo,
      prestamo: prestamoInfo,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPenalty = async (req, res) => {
  try {
    const { socio_id, prestamo_id, monto, motivo, detalle } = req.body;

    // socio must exist
    const socioDoc = await db
      .collection(COLLECTIONS.SOCIOS)
      .doc(socio_id)
      .get();
    if (!socioDoc.exists)
      return res.status(404).json({ error: "Socio no encontrado" });

    // prestamo is optional
    let prestamoIdToSave = null;
    if (prestamo_id) {
      const prestamoDoc = await db
        .collection(COLLECTIONS.PRESTAMOS)
        .doc(prestamo_id)
        .get();
      if (!prestamoDoc.exists)
        return res.status(404).json({ error: "Prestamo no encontrado" });
      prestamoIdToSave = prestamo_id;
    }

    const penaltyRef = await db.collection(COLLECTIONS.MULTAS).add({
      socio_id,
      prestamo_id: prestamoIdToSave,
      monto: Number.parseFloat(monto),
      motivo,
      detalle: detalle || null,
      fecha: new Date().toISOString().slice(0, 10),
      estado: ESTADO_MULTA.PENDIENTE,
    });

    res
      .status(201)
      .json({ message: "Multa creada exitosamente", id: penaltyRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePenalty = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, motivo, detalle, estado } = req.body;

    const penaltyDoc = await db.collection(COLLECTIONS.MULTAS).doc(id).get();
    if (!penaltyDoc.exists)
      return res.status(404).json({ error: "Multa no encontrada" });

    const updateData = {};
    if (monto !== undefined) updateData.monto = Number.parseFloat(monto);
    if (motivo) updateData.motivo = motivo;
    if (detalle !== undefined) updateData.detalle = detalle;
    if (estado) updateData.estado = estado;

    await db.collection(COLLECTIONS.MULTAS).doc(id).update(updateData);
    res.json({ message: "Multa actualizada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePenalty = async (req, res) => {
  try {
    const { id } = req.params;
    const penaltyDoc = await db.collection(COLLECTIONS.MULTAS).doc(id).get();
    if (!penaltyDoc.exists)
      return res.status(404).json({ error: "Multa no encontrada" });

    await db.collection(COLLECTIONS.MULTAS).doc(id).delete();
    res.json({ message: "Multa eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
