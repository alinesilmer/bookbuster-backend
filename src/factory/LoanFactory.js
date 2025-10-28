import { ESTADO_PRESTAMO } from "../config/constants.js";

const iso = (d) => d.toISOString().slice(0, 10);

export class LoanFactory {
  //FACTORY: crea las validaciones para crear un préstamo
  static crear({ socio_id, copia_id, fecha_vencimiento }) {
    const start = new Date();
    let due = fecha_vencimiento ? new Date(fecha_vencimiento) : new Date(start);
    //SETEA UNA FECHA DE VENCIMIENTO AUTOMÁTICA
    if (!fecha_vencimiento) due.setDate(due.getDate() + 14);
    return {
      socio_id,
      copia_id,
      fecha_inicio: iso(start),
      fecha_vencimiento: iso(due),
      estado: ESTADO_PRESTAMO.ACTIVO,
    };
  }
}


