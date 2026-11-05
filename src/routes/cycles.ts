import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';

const router = Router();

// GET all cycles
router.get('/', (req: Request, res: Response) => {
  const userId = (req.query.user_id as string) || 'default';
  const db = getDb();
  const cycles = db.prepare('SELECT * FROM cycles WHERE user_id = ? ORDER BY start_date DESC').all(userId);
  res.json(cycles);
});

// GET single cycle
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const cycle = db.prepare('SELECT * FROM cycles WHERE id = ?').get(req.params.id);
  if (!cycle) return res.status(404).json({ error: 'Cycle not found' });
  res.json(cycle);
});

// POST create cycle
router.post('/', (req: Request, res: Response) => {
  const { start_date, end_date, notes, user_id = 'default' } = req.body;
  if (!start_date) return res.status(400).json({ error: 'start_date is required' });

  const db = getDb();
  const id = uuidv4();

  // Calculate period_length if end_date provided
  let period_length: number | null = null;
  if (end_date) {
    const start = new Date(start_date);
    const end = new Date(end_date);
    period_length = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  // Calculate cycle_length from previous cycle
  const prev = db.prepare(
    'SELECT start_date FROM cycles WHERE user_id = ? AND start_date < ? ORDER BY start_date DESC LIMIT 1'
  ).get(user_id, start_date) as { start_date: string } | undefined;

  let cycle_length: number | null = null;
  if (prev) {
    const prevStart = new Date(prev.start_date);
    const currStart = new Date(start_date);
    cycle_length = Math.round((currStart.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24));
  }

  db.prepare(
    'INSERT INTO cycles (id, user_id, start_date, end_date, cycle_length, period_length, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, user_id, start_date, end_date || null, cycle_length, period_length, notes || null);

  const cycle = db.prepare('SELECT * FROM cycles WHERE id = ?').get(id);
  res.status(201).json(cycle);
});

// PUT update cycle
router.put('/:id', (req: Request, res: Response) => {
  const { start_date, end_date, notes } = req.body;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM cycles WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Cycle not found' });

  const newStart = start_date || existing.start_date;
  const newEnd = end_date !== undefined ? end_date : existing.end_date;

  let period_length: number | null = existing.period_length;
  if (newEnd) {
    period_length = Math.round((new Date(newEnd).getTime() - new Date(newStart).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  db.prepare(
    'UPDATE cycles SET start_date=?, end_date=?, period_length=?, notes=?, updated_at=datetime(\'now\') WHERE id=?'
  ).run(newStart, newEnd || null, period_length, notes !== undefined ? notes : existing.notes, req.params.id);

  const cycle = db.prepare('SELECT * FROM cycles WHERE id = ?').get(req.params.id);
  res.json(cycle);
});

// DELETE cycle
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM cycles WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Cycle not found' });
  res.json({ deleted: true });
});

// GET predictions
router.get('/predict/next', (req: Request, res: Response) => {
  const userId = (req.query.user_id as string) || 'default';
  const db = getDb();
  const cycles = db.prepare(
    'SELECT * FROM cycles WHERE user_id = ? AND cycle_length IS NOT NULL ORDER BY start_date DESC LIMIT 6'
  ).all(userId) as any[];

  if (cycles.length === 0) {
    return res.json({ prediction: null, message: 'Not enough data to predict' });
  }

  const avgCycleLength = Math.round(
    cycles.reduce((sum: number, c: any) => sum + c.cycle_length, 0) / cycles.length
  );
  const avgPeriodLength = cycles.filter((c: any) => c.period_length).length > 0
    ? Math.round(cycles.filter((c: any) => c.period_length).reduce((sum: number, c: any) => sum + c.period_length, 0) / cycles.filter((c: any) => c.period_length).length)
    : 5;

  const lastStart = new Date(cycles[0].start_date);
  const nextStart = new Date(lastStart);
  nextStart.setDate(nextStart.getDate() + avgCycleLength);
  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextEnd.getDate() + avgPeriodLength - 1);

  const ovulation = new Date(nextStart);
  ovulation.setDate(ovulation.getDate() - 14);

  res.json({
    prediction: {
      next_period_start: nextStart.toISOString().split('T')[0],
      next_period_end: nextEnd.toISOString().split('T')[0],
      ovulation_date: ovulation.toISOString().split('T')[0],
      avg_cycle_length: avgCycleLength,
      avg_period_length: avgPeriodLength,
      based_on_cycles: cycles.length
    }
  });
});

export default router;
