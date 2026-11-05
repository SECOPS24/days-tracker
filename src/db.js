'use strict';
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'days-tracker.json');

let data = { cycles: {}, symptoms: {} };

function initDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try { data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
    catch { data = { cycles: {}, symptoms: {} }; }
  }
  console.log('DB initialised at', DB_FILE);
}

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const db = {
  getCycles(userId) {
    return Object.values(data.cycles)
      .filter(c => c.user_id === userId)
      .sort((a, b) => b.start_date.localeCompare(a.start_date));
  },
  getCycle(id) { return data.cycles[id] || null; },
  createCycle(cycle) { data.cycles[cycle.id] = cycle; save(); return cycle; },
  updateCycle(id, updates) {
    if (!data.cycles[id]) return null;
    data.cycles[id] = { ...data.cycles[id], ...updates, updated_at: new Date().toISOString() };
    save();
    return data.cycles[id];
  },
  deleteCycle(id) {
    if (!data.cycles[id]) return false;
    delete data.cycles[id]; save(); return true;
  },
  getPrevCycle(userId, beforeDate) {
    const prev = Object.values(data.cycles)
      .filter(c => c.user_id === userId && c.start_date < beforeDate)
      .sort((a, b) => b.start_date.localeCompare(a.start_date));
    return prev[0] || null;
  },
  getRecentCycles(userId, limit) {
    return Object.values(data.cycles)
      .filter(c => c.user_id === userId && c.cycle_length != null)
      .sort((a, b) => b.start_date.localeCompare(a.start_date))
      .slice(0, limit);
  },
  getSymptoms(userId, from, to) {
    return Object.values(data.symptoms)
      .filter(s => {
        if (s.user_id !== userId) return false;
        if (from && s.date < from) return false;
        if (to && s.date > to) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  },
  createSymptom(symptom) { data.symptoms[symptom.id] = symptom; save(); return symptom; },
  deleteSymptom(id) {
    if (!data.symptoms[id]) return false;
    delete data.symptoms[id]; save(); return true;
  }
};

module.exports = { initDb, db };
