// Ini menggantikan window.storage (yang hanya wujud dalam Claude.ai) dengan
// Firebase Firestore, supaya kod aplikasi KPI (App.jsx) tidak perlu diubah
// langsung. Semua panggilan window.storage.get/set/delete/list akan
// baca/tulis terus ke Firestore.

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const COLLECTION = "psi_kpi_data";

window.storage = {
  async get(key) {
    const ref = doc(db, COLLECTION, key);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      // Sengaja "throw", sama macam window.storage asal Claude:
      // key yang tak wujud dianggap ralat, bukan null.
      throw new Error("Key not found: " + key);
    }
    const data = snap.data();
    return { key, value: data.value, shared: true };
  },

  async set(key, value) {
    const ref = doc(db, COLLECTION, key);
    await setDoc(ref, { value, updatedAt: Date.now() });
    return { key, value, shared: true };
  },

  async delete(key) {
    const ref = doc(db, COLLECTION, key);
    await deleteDoc(ref);
    return { key, deleted: true, shared: true };
  },

  async list(prefix) {
    const snap = await getDocs(collection(db, COLLECTION));
    const keys = [];
    snap.forEach(d => {
      if (!prefix || d.id.startsWith(prefix)) keys.push(d.id);
    });
    return { keys, prefix, shared: true };
  },
};
