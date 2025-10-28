import { db } from "../config/firebase.js";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS, ESTADO_COPIA, ESTADO_PRESTAMO } from "../config/constants.js";
import { LoanFactory } from "../factory/LoanFactory.js";

const iso = (d) => d.toISOString().slice(0, 10);

export const BibliotecaService = {

  //CREAR PRÉSTAMO
  async prestar({ copia_id, socio_id, fecha_vencimiento, actor }) {
    let socioId = socio_id;
    if (!socioId) {
      const snap = await db
        .collection(COLLECTIONS.SOCIOS)
        .where("usuario_id", "==", actor?.id)
        .limit(1)
        .get();
      if (snap.empty) throw new Error("Socio no encontrado");
      socioId = snap.docs[0].id;
    }

    const copyRef = db.collection(COLLECTIONS.COPIAS).doc(copia_id);
    const socioRef = db.collection(COLLECTIONS.SOCIOS).doc(socioId);
    const loansRef = db.collection(COLLECTIONS.PRESTAMOS);

    const result = await db.runTransaction(async (tx) => {
      const copyDoc = await tx.get(copyRef);
      if (!copyDoc.exists) throw new Error("Copia no existe");
      const copy = copyDoc.data();
      if (copy.estado !== ESTADO_COPIA.DISPONIBLE) throw new Error("La copia no está disponible");

      const socioDoc = await tx.get(socioRef);
      if (!socioDoc.exists) throw new Error("Socio no encontrado");
      const socio = socioDoc.data();
      if (socio.activo === false) throw new Error("Socio inactivo");

      const loanRef = loansRef.doc();

      //FACTORY: USO DEL LOANFACTORY PARA CREAR UN PRÉSTAMO
      const loan = LoanFactory.crear({ socio_id: socioId, copia_id, fecha_vencimiento });

      //se persiste el préstamo
      tx.update(copyRef, { estado: ESTADO_COPIA.PRESTADO });
      tx.set(loanRef, loan);
      tx.update(socioRef, { prestamos_activos: FieldValue.increment(1) });

      return { id: loanRef.id, socio_id: socioId, fecha_vencimiento: loan.fecha_vencimiento };
    });

    return result;
  },



//DEVOLVER PRÉSTAMO
  async devolver({ prestamo_id }) {
    const loanRef = db.collection(COLLECTIONS.PRESTAMOS).doc(prestamo_id);

    return await db.runTransaction(async (tx) => {
      const now = new Date();
      const loanDoc = await tx.get(loanRef);
      if (!loanDoc.exists) throw new Error("Préstamo no existe");
      const loan = loanDoc.data();
      if (loan.estado !== ESTADO_PRESTAMO.ACTIVO) throw new Error("Préstamo no activo");

      const copyRef = db.collection(COLLECTIONS.COPIAS).doc(loan.copia_id);
      const socioRef = db.collection(COLLECTIONS.SOCIOS).doc(loan.socio_id);

      tx.update(loanRef, { estado: ESTADO_PRESTAMO.DEVUELTO, fecha_devolucion: iso(now) });
      tx.update(copyRef, { estado: ESTADO_COPIA.DISPONIBLE });
      tx.update(socioRef, { prestamos_activos: FieldValue.increment(-1) });

      return { prestamo_id };
    });
  },
};


