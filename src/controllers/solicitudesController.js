import { db } from "../config/firebase.js";
import { COLLECTIONS } from "../config/constants.js";
import { MailerAdapter } from "../adapters/MailerAdapter.js";
import { approvalEmailHTML, rejectionEmailHTML } from "../utils/mailer.js";

const todayISO = () => new Date().toISOString().slice(0, 10);

export const listSolicitudes = async (_req, res) => {
  try {
    const ref = db.collection(COLLECTIONS.SOLICITUDES).where("estado", "==", "PENDIENTE");
    const snap = await ref.get();
    const out = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const createSolicitud = async (req, res) => {
  try {
    const { nombre, email, telefono } = req.body;
    if (!nombre || !email) return res.status(400).json({ error: "Nombre y email son obligatorios" });

    const ref = await db.collection(COLLECTIONS.SOLICITUDES).add({
      nombre,
      email,
      telefono: telefono || null,
      fecha: todayISO(),
      estado: "PENDIENTE",
    });

    const adminTo = process.env.EMAIL_ADMIN || "";
    if (adminTo) {
      await MailerAdapter.send(
        adminTo,
        "Nueva solicitud de registro",
        `<p>Nombre: ${nombre}</p><p>Email: ${email}</p><p>Teléfono: ${telefono || "-"}</p>`
      );
    }

    //ADAPTER: para enviar el aviso “recibimos tu solicitud” al postulante
    await MailerAdapter.send(
      email,
      "Recibimos tu solicitud",
      `<p>Hola ${nombre},</p><p>Recibimos tu solicitud de registro. Te avisaremos si es aprobada.</p>`
    );

    res.status(201).json({ id: ref.id, message: "Solicitud creada" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const approveSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const appUrl = process.env.APP_URL || "http://localhost:3000";

    const solRef = db.collection(COLLECTIONS.SOLICITUDES).doc(id);
    const solDoc = await solRef.get();
    if (!solDoc.exists) return res.status(404).json({ error: "Solicitud no encontrada" });
    const sol = solDoc.data();
    if (sol.estado && sol.estado !== "PENDIENTE") {
      return res.status(409).json({ error: "Solicitud ya procesada" });
    }

    const userQ = await db.collection(COLLECTIONS.USUARIOS).where("email", "==", sol.email).limit(1).get();
    let usuarioId;
    if (!userQ.empty) {
      usuarioId = userQ.docs[0].id;
      await db.collection(COLLECTIONS.USUARIOS).doc(usuarioId).set(
        {
          nombre: sol.nombre || userQ.docs[0].data().nombre || "",
          rol: "SOCIO",
          activo: true,
          creado_en: userQ.docs[0].data().creado_en || new Date().toISOString(),
        },
        { merge: true }
      );
    } else {
      const uRef = await db.collection(COLLECTIONS.USUARIOS).add({
        nombre: sol.nombre,
        email: sol.email,
        rol: "SOCIO",
        activo: true,
        creado_en: new Date().toISOString(),
      });
      usuarioId = uRef.id;
    }

    const lastSnap = await db.collection(COLLECTIONS.SOCIOS).orderBy("nro_socio", "desc").limit(1).get();
    const lastNumber = lastSnap.empty ? 0 : Number(lastSnap.docs[0].data().nro_socio || 0);
    const nextNumber = lastNumber + 1;

    const socioQ = await db.collection(COLLECTIONS.SOCIOS).where("usuario_id", "==", usuarioId).limit(1).get();
    let socioId;
    if (!socioQ.empty) {
      const doc = socioQ.docs[0];
      socioId = doc.id;
      await doc.ref.set(
        {
          nro_socio: doc.data().nro_socio ?? nextNumber,
          prestamos_activos: doc.data().prestamos_activos ?? 0,
          multas_pendientes: doc.data().multas_pendientes ?? 0,
          dni: doc.data().dni ?? null,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else {
      const socioRef = await db.collection(COLLECTIONS.SOCIOS).add({
        usuario_id: usuarioId,
        nro_socio: nextNumber,
        prestamos_activos: 0,
        multas_pendientes: 0,
        dni: null,
        createdAt: new Date().toISOString(),
      });
      socioId = socioRef.id;
    }

    await db.collection(COLLECTIONS.USUARIOS).doc(usuarioId).set({ nro_socio: nextNumber }, { merge: true });
    await solRef.update({
      estado: "APROBADA",
      usuario_id: usuarioId,
      socio_id: socioId,
      nro_socio: nextNumber,
      resuelta_en: todayISO(),
    });

    const html = approvalEmailHTML({ nombre: sol.nombre, email: sol.email, appUrl });
    //ADAPTER: después de aprobada una solicitud, se envía el mail de aprobación
    await MailerAdapter.send(sol.email, "Solicitud aprobada – BookBuster", html);

    res.json({ message: "Solicitud aprobada", nro_socio: nextNumber, usuario_id: usuarioId, socio_id: socioId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const rejectSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const solRef = db.collection(COLLECTIONS.SOLICITUDES).doc(id);
    const solDoc = await solRef.get();
    if (!solDoc.exists) return res.status(404).json({ error: "Solicitud no encontrada" });
    const sol = solDoc.data();
    if (sol.estado && sol.estado !== "PENDIENTE") {
      return res.status(409).json({ error: "Solicitud ya procesada" });
    }

    await solRef.update({ estado: "RECHAZADA", motivo: motivo || "", resuelta_en: todayISO() });

    const html = rejectionEmailHTML({ nombre: sol.nombre, motivo });
    ////ADAPTER: después de rechazada una solicitud, se envía el mail de rechazo
    await MailerAdapter.send(sol.email, "Solicitud rechazada – BookBuster", html);

    res.json({ message: "Solicitud rechazada" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
