import { db } from "../src/config/firebase.js";
import { COLLECTIONS } from "../src/config/constants.js";

const names = [
  "Planeta (ES)",
  "Seix Barral (ES)",
  "Destino (ES)",
  "Espasa (ES)",
  "Tusquets (ES)",
  "Anagrama (ES)",
  "Alianza Editorial (ES)",
  "Debate (ES)",
  "Siruela (ES)",
  "Akal (ES)",
  "RBA (ES)",
  "Salamandra (ES)",
  "SM (ES)",
  "Santillana (ES)",
  "Plaza & Janés (ES)",
  "Grijalbo (ES)",
  "Ediciones B (ES)",
  "Alfaguara (AR)",
  "Sudamericana (AR)",
  "Emecé (AR)",
  "Paidós (AR)",
  "Siglo XXI Editores (AR)",
  "Eudeba (AR)",
  "Colihue (AR)",
  "Kapelusz (AR)",
  "Interzona (AR)",
  "Edhasa (AR)",
  "De la Flor (AR)"
];

async function run() {
  for (const nombre of names) {
    const q = await db.collection(COLLECTIONS.EDITORIALES).where("nombre", "==", nombre).limit(1).get();
    if (q.empty) await db.collection(COLLECTIONS.EDITORIALES).add({ nombre });
  }
  process.exit(0);
}
run();
