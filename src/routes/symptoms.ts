import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';

const router = Router();

const VALID_TYPES = [
  'cramps','headache','bloating','fatigue','mood_swings',
  'breast_tenderness','acne','back_pain','nausea','spotting',
  'flow_light','flow_medium','flow_heavy','other'
];

router.get('/', (req: Request, res: Response) => {
  const userId = (req.query.user_id as string) || 'default';
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  res.json(db.getSymptoms(userId, from, to));
});

router.post('/', (req: Request, res: Response) => {
  const { date, type, severity, notes, cycle_id, user_id = 'default' } = req.body;
  if (!date || !type) return res.status(400).json({ error: 'date and type are required' });
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid symptom type', valid: VALID_TYPES });
  const symptom = {
    id: uuidv4(), cycle_id: cycle_id || null, user_id, date, type,
    severity: severity || null, notes: notes || null,
    created_at: new Date().toISOString()
  };
  res.status(201).json(db.createSymptom(symptom));
});

router.delete('/:id', (req: Request, res: Response) => {
  if (!db.deleteSymptom(req.params.id)) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

export default router;
