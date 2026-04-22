// storage.js — localStorage wrapper (mirrors the Claude widget storage API)
const Storage = {
  get(key) {
    try {
      const val = localStorage.getItem(key);
      return val ? { value: val } : null;
    } catch(e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); return true; } catch(e) { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(key); return true; } catch(e) { return false; }
  }
};
