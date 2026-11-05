import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const userId = (req.query.user_id as string) || 'default';
  res.json(db.getCycles(userId));
});

router.get('/predict/next', (req: Request, res: Response) => {
  const userId = (req.query.user_id as string) || 'default';
  const cycles = db.getRecentCycles(userId, 6);

  if (cycles.length === 0) {
    return res.json({ prediction: null, message: 'Not enough data to predict' });
  }

  const avgCycleLength = Math.round(
    cycles.reduce((s: number, c: any) => s + c.cycle_length, 0) / cycles.length
  );
  const withPeriod = cycles.filter((c: any) => c.period_length);
  const avgPeriodLength = withPeriod.length > 0
    ? Math.round(withPeriod.reduce((s: number, c: any) => s + c.period_length, 0) / withPeriod.length)
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

router.get('/:id', (req: Request, res: Response) => {
  const cycle = db.getCycle(req.params.id);
  if (!cycle) return res.status(404).json({ error: 'Not found' });
  res.json(cycle);
});

router.post('/', (req: Request, res: Response) => {
  const { start_date, end_date, notes, user_id = 'default' } = req.body;
  if (!start_date) return res.status(400).json({ error: 'start_date is required' });

  let period_length: number | null = null;
  if (end_date) {
    period_length = Math.round((new Date(end_date).getTime() - new Date(start_date).getTime()) / 86400000) + 1;
  }

  const prev = db.getPrevCycle(user_id, start_date);
  let cycle_length: number | null = null;
  if (prev) {
    cycle_length = Math.round((new Date(start_date).getTime() - new Date(prev.start_date).getTime()) / 86400000);
  }

  const cycle = {
    id: uuidv4(), user_id, start_date,
    end_date: end_date || null, cycle_length, period_length,
    notes: notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  res.status(201).json(db.createCycle(cycle));
});

router.put('/:id', (req: Request, res: Response) => {
  const existing: any = db.getCycle(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { start_date, end_date, notes } = req.body;
  const newStart = start_date || existing.start_date;
  const newEnd = end_date !== undefined ? end_date : existing.end_date;
  let period_length: number | null = existing.period_length;
  if (newEnd) period_length = Math.round((new Date(newEnd).getTime() - new Date(newStart).getTime()) / 86400000) + 1;
  res.json(db.updateCycle(req.params.id, { start_date: newStart, end_date: newEnd, period_length, notes }));
});

router.delete('/:id', (req: Request, res: Response) => {
  if (!db.deleteCycle(req.params.id)) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

export default router;
