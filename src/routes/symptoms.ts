import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';

const router = Router();

const VALID_TYPES = [
  'cramps', 'headache', 'bloating', 'fatigue', 'mood_swings',
  'breast_tenderness', 'acne', 'back_pain', 'nausea', 'spotting',
  'flow_light', 'flow_medium', 'flow_heavy', 'other'
];

// GET symptoms
router.get('/', (req: Request, res: Response) => {
  const userId = (req.query.user_id as string) || 'default';
  const { from, to } = req.query;
  const db = getDb();

  let query = 'SELECT * FROM symptoms WHERE user_id = ?';
  const params: any[] = [userId];

  if (from) { query += ' AND date >= ?'; params.push(from); }
  if (to)   { query += ' AND date <= ?'; params.push(to); }
  query += ' ORDER BY date DESC';

  const symptoms = db.prepare(query).all(...params);
  res.json(symptoms);
});

// POST log symptom
router.post('/', (req: Request, res: Response) => {
  const { date, type, severity, notes, cycle_id, user_id = 'default' } = req.body;
  if (!date || !type) return res.status(400).json({ error: 'date and type are required' });
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid symptom type', valid: VALID_TYPES });

  const db = getDb();
  const id = uuidv4();
  db.prepare(
    'INSERT INTO symptoms (id, cycle_id, user_id, date, type, severity, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, cycle_id || null, user_id, date, type, severity || null, notes || null);

  const symptom = db.prepare('SELECT * FROM symptoms WHERE id = ?').get(id);
  res.status(201).json(symptom);
});

// DELETE symptom
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM symptoms WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Symptom not found' });
  res.json({ deleted: true });
});

export default router;
