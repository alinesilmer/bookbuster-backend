import bcrypt from "bcryptjs";
import { db } from "../config/firebase.js";
import { COLLECTIONS, ROLES, ESTADO_SOLICITUD } from "../config/constants.js";
import { createSession, destroySession, getSession } from "../utils/session.js";

//USO DE COOKIES PARA SESIONES
function cookieOpts(expiresAt) {
  return { httpOnly: true, sameSite: "lax", secure: false, signed: true, expires: expiresAt };
}

//REGISTRO DE USUARIOS
//TODO: sacar campo contraseña
export const register = async (req, res) => {
  try {
    const { email, password, nombre } = req.body;
    if (!email || !password || !nombre) return res.status(400).json({ error: "Datos incompletos" });
    const existing = await db.collection(COLLECTIONS.USUARIOS).where("email", "==", email).get();
    if (!existing.empty) return res.status(400).json({ error: "Email ya registrado" });
    const password_hash = await bcrypt.hash(password, 10);
    await db.collection(COLLECTIONS.SOLICITUDES).add({
      nombre,
      email,
      telefono: null,
      fecha: new Date().toISOString().split("T")[0],
      estado: ESTADO_SOLICITUD.PENDIENTE,
      password_hash,
    });
    res.status(201).json({ message: "Solicitud enviada" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

//INGRESO DE USUARIOS
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (process.env.DEV_ADMIN_EMAIL && process.env.DEV_ADMIN_PASSWORD && email === process.env.DEV_ADMIN_EMAIL && password === process.env.DEV_ADMIN_PASSWORD) {
      const user = { id: "dev_admin", email, nombre: "Admin Demo", rol: ROLES.ADMIN };
      const { token, expiresAt } = await createSession(user);
      res.cookie("bb_session", token, cookieOpts(new Date(expiresAt)));
      return res.json({ message: "OK", user });
    }

    const snap = await db.collection(COLLECTIONS.USUARIOS).where("email", "==", email).limit(1).get();
    if (snap.empty) return res.status(401).json({ error: "Credenciales inválidas" });

    const doc = snap.docs[0];
    const data = doc.data();
    const ok = await bcrypt.compare(password, data.password_hash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });
    if (data.activo === false) return res.status(403).json({ error: "Usuario suspendido" });

    const user = { id: doc.id, email: data.email, nombre: data.nombre, rol: data.rol };
    const { token, expiresAt } = await createSession(user);
    res.cookie("bb_session", token, cookieOpts(new Date(expiresAt)));
    res.json({ message: "OK", user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

//SALIDA DE SESIÓN DEL USUARIO
export const logout = async (req, res) => {
  try {
    const token = req.signedCookies?.bb_session || req.cookies?.bb_session;
    await destroySession(token);
    res.clearCookie("bb_session");
    res.json({ message: "Sesión cerrada" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

//OBTENER EL PERFIL DE UN USUARIO PARA AUTENTICACIONES
export const getProfile = async (req, res) => {
  try {
    const token = req.signedCookies?.bb_session || req.cookies?.bb_session;
    const sess = await getSession(token);
    if (!sess) return res.status(401).json({ error: "No autenticado" });
    res.json({ id: sess.userId, email: sess.email, nombre: sess.nombre ?? "", rol: sess.rol });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
