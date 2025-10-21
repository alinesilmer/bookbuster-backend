import { getSession } from "../utils/session.js";
import { ROLES } from "../config/constants.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.signedCookies?.bb_session || req.cookies?.bb_session;
    const sess = await getSession(token);
    if (!sess) return res.status(401).json({ error: "No autenticado" });

    req.user = { id: sess.userId, email: sess.email, rol: sess.rol };
    next();
  } catch {
    res.status(401).json({ error: "No autenticado" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== ROLES.ADMIN) {
    return res.status(403).json({ error: "Requiere ADMIN" });
  }
  next();
};
