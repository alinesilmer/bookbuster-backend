//OBJETIVO: Devolver un monto fijo según tipo el tipo de multa, leyendo de la tabla MULTA_MONTOS
//esto permitirá cambias rápidos sin tocar controladores en caso de que la tabla cambia sus valores
//además, el cálculo se encuentra solo en strategy, y otorga consistencia

import { PenaltyStrategy } from "./strategy.js";

export class FixedByTypePenaltyStrategy extends PenaltyStrategy {
  constructor(montos = {}) {
    super();
    this.montos = montos;
  }
  calcular({ tipo }) {
    const v = this.montos?.[tipo];
    return Number.isFinite(v) && v > 0 ? Number(v) : 0;
  }
}
