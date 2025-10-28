//CONFIGURACIÓN DE FIREBASE

import admin from "firebase-admin"
import { readFileSync } from "fs"
import dotenv from "dotenv"

dotenv.config()

// Inicializar Firebase 
const serviceAccount = JSON.parse(readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8"))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

export { admin, db }
