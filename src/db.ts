import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'days-tracker.json');

interface DbData {
  cycles: Record<string, any>;
  symptoms: Record<string, any>;
}

let data: DbData = { cycles: {}, symptoms: {} };

export function initDb(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try {
      data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch {
      data = { cycles: {}, symptoms: {} };
    }
  }
  console.log('DB initialised at', DB_FILE);
}

function save(): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

export const db = {
  // Cycles
  getCycles(userId: string): any[] {
    return Object.values(data.cycles)
      .filter((c: any) => c.user_id === userId)
      .sort((a: any, b: any) => b.start_date.localeCompare(a.start_date));
  },
  getCycle(id: string): any | null {
    return data.cycles[id] || null;
  },
  createCycle(cycle: any): any {
    data.cycles[cycle.id] = cycle;
    save();
    return cycle;
  },
  updateCycle(id: string, updates: Partial<any>): any | null {
    if (!data.cycles[id]) return null;
    data.cycles[id] = { ...data.cycles[id], ...updates, updated_at: new Date().toISOString() };
    save();
    return data.cycles[id];
  },
  deleteCycle(id: string): boolean {
    if (!data.cycles[id]) return false;
    delete data.cycles[id];
    save();
    return true;
  },
  getPrevCycle(userId: string, beforeDate: string): any | null {
    const prev = Object.values(data.cycles)
      .filter((c: any) => c.user_id === userId && c.start_date < beforeDate)
      .sort((a: any, b: any) => b.start_date.localeCompare(a.start_date));
    return prev[0] || null;
  },
  getRecentCycles(userId: string, limit: number): any[] {
    return Object.values(data.cycles)
      .filter((c: any) => c.user_id === userId && c.cycle_length != null)
      .sort((a: any, b: any) => b.start_date.localeCompare(a.start_date))
      .slice(0, limit);
  },

  // Symptoms
  getSymptoms(userId: string, from?: string, to?: string): any[] {
    return Object.values(data.symptoms)
      .filter((s: any) => {
        if (s.user_id !== userId) return false;
        if (from && s.date < from) return false;
        if (to && s.date > to) return false;
        return true;
      })
      .sort((a: any, b: any) => b.date.localeCompare(a.date));
  },
  createSymptom(symptom: any): any {
    data.symptoms[symptom.id] = symptom;
    save();
    return symptom;
  },
  deleteSymptom(id: string): boolean {
    if (!data.symptoms[id]) return false;
    delete data.symptoms[id];
    save();
    return true;
  }
};
