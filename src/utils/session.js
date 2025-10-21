import { db } from "../config/firebase.js";
import crypto from "crypto";
import { COLLECTIONS } from "../config/constants.js";

export async function createSession(user) {
  const token = crypto.randomBytes(24).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // 7d

  await db
    .collection(COLLECTIONS.SESIONES)
    .doc(token)
    .set({
      userId: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre || "",
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

  return { token, expiresAt };
}

export async function getSession(token) {
  if (!token) return null;
  const doc = await db.collection(COLLECTIONS.SESIONES).doc(token).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data.expiresAt || new Date(data.expiresAt) < new Date()) {
    await db.collection(COLLECTIONS.SESIONES).doc(token).delete();
    return null;
  }
  return { id: token, ...data };
}

export async function destroySession(token) {
  if (!token) return;
  await db.collection(COLLECTIONS.SESIONES).doc(token).delete();
}
