'use strict';
const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');

const router = Router();
const VALID_TYPES = ['cramps','headache','bloating','fatigue','mood_swings','breast_tenderness','acne','back_pain','nausea','spotting','flow_light','flow_medium','flow_heavy','other'];

router.get('/', (req, res) => {
  const userId = req.query.user_id || 'default';
  res.json(db.getSymptoms(userId, req.query.from, req.query.to));
});

router.post('/', (req, res) => {
  const { date, type, severity, notes, cycle_id, user_id = 'default' } = req.body;
  if (!date || !type) return res.status(400).json({ error: 'date and type required' });
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid type', valid: VALID_TYPES });
  const symptom = {
    id: uuidv4(), cycle_id: cycle_id || null, user_id, date, type,
    severity: severity || null, notes: notes || null,
    created_at: new Date().toISOString()
  };
  res.status(201).json(db.createSymptom(symptom));
});

router.delete('/:id', (req, res) => {
  if (!db.deleteSymptom(req.params.id)) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

module.exports = router;
