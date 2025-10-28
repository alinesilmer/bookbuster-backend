import { db } from "../config/firebase.js";
import { COLLECTIONS } from "../config/constants.js";
import { BibliotecaService } from "../services/BibliotecaService.js";
import { MailerAdapter } from "../adapters/MailerAdapter.js";
import { loanCreatedEmailHTML } from "../utils/mailer.js";

export const listLoans = async (req, res) => {
  try {
    const { socio_id, estado } = req.query;
    if (!socio_id) return res.status(400).json({ error: "socio_id requerido" });

    let ref = db.collection(COLLECTIONS.PRESTAMOS).where("socio_id", "==", socio_id);
    if (estado) ref = ref.where("estado", "==", estado);

    const snap = await ref.get();
    const items = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        let bookTitle = null;

        if (data.copia_id) {
          const copyDoc = await db.collection(COLLECTIONS.COPIAS).doc(data.copia_id).get();
          if (copyDoc.exists) {
            const copy = copyDoc.data();
            if (copy.libro_id) {
              const bookDoc = await db.collection(COLLECTIONS.LIBROS).doc(copy.libro_id).get();
              if (bookDoc.exists) {
                const b = bookDoc.data();
                bookTitle = b?.titulo ?? null;
              }
            }
          }
        }

        return {
          id: d.id,
          socio_id: data.socio_id,
          copia_id: data.copia_id,
          fecha_inicio: data.fecha_inicio,
          fecha_vencimiento: data.fecha_vencimiento,
          estado: data.estado,
          bookTitle,
        };
      })
    );

    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const createLoan = async (req, res) => {
  try {
    const { copia_id, socio_id, fecha_vencimiento } = req.body;
    if (!copia_id) return res.status(400).json({ error: "copia_id requerido" });

    const result = await BibliotecaService.prestar({
      copia_id,
      socio_id,
      fecha_vencimiento,
      actor: req.user || null,
    });

    try {
      const socioDoc = await db.collection(COLLECTIONS.SOCIOS).doc(result.socio_id).get();
      const socio = socioDoc.exists ? socioDoc.data() : null;

      let email = null;
      let nombre = null;
      if (socio?.usuario_id) {
        const userDoc = await db.collection(COLLECTIONS.USUARIOS).doc(socio.usuario_id).get();
        if (userDoc.exists) {
          const u = userDoc.data();
          email = u?.email ?? null;
          nombre = u?.nombre ?? null;
        }
      }

      let titulo = "Libro";
      const copyDoc = await db.collection(COLLECTIONS.COPIAS).doc(copia_id).get();
      if (copyDoc.exists && copyDoc.data()?.libro_id) {
        const bookDoc = await db.collection(COLLECTIONS.LIBROS).doc(copyDoc.data().libro_id).get();
        if (bookDoc.exists) titulo = bookDoc.data()?.titulo ?? titulo;
      }

      if (email) {
        const html = loanCreatedEmailHTML({
          nombre: nombre || "Usuario",
          titulo,
          fecha_vencimiento: result.fecha_vencimiento,
        });
        //ADAPTER: tras crear el préstamo, envía el mail de confirmación del préstamo.
        await MailerAdapter.send(email, "Préstamo creado", html);
      }
    } catch {}

    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message || "No se pudo crear el préstamo" });
  }
};

export const returnLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { createPenalty, penalty } = req.body || {};

    const result = await BibliotecaService.devolver({
      prestamo_id: id,
      createPenalty: !!createPenalty,
      penalty: penalty || null,
    });

    res.json({ message: "Préstamo devuelto", ...result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
