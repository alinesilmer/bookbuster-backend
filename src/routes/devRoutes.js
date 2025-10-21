import express from "express";
import bcrypt from "bcryptjs";
import { db } from "../config/firebase.js";
import { COLLECTIONS, ROLES } from "../config/constants.js";

const router = express.Router();

router.post("/seed-admin", async (req, res) => {
  try {
    const email =
      req.body?.email || process.env.DEV_ADMIN_EMAIL || "admin@bookbuster.dev";
    const password =
      req.body?.password || process.env.DEV_ADMIN_PASSWORD || "Admin!234";
    const nombre = req.body?.nombre || "Admin";

    const snap = await db
      .collection(COLLECTIONS.USUARIOS)
      .where("email", "==", email)
      .limit(1)
      .get();
    if (!snap.empty) {
      const ref = snap.docs[0].ref;
      await ref.update({ rol: ROLES.ADMIN, activo: true });
      return res.json({ created: false, id: snap.docs[0].id, email });
    }

    const hashed = await bcrypt.hash(password, 10);
    const ref = await db.collection(COLLECTIONS.USUARIOS).add({
      email,
      password: hashed,
      nombre,
      rol: ROLES.ADMIN,
      activo: true,
      creado_en: new Date().toISOString(),
    });

    res.status(201).json({ created: true, id: ref.id, email });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
