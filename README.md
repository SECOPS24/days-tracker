# Days Tracker

A private menstrual cycle tracking app built with Node.js, Express, SQLite and vanilla JS.

## Features
- Log period start/end dates
- Predict next period and ovulation date
- Track symptoms with severity ratings
- Monthly calendar view with period and prediction highlights
- Cycle statistics dashboard

## Running locally
```bash
npm install
npm run build
npm start
```

Or with Docker:
```bash
docker build -t days-tracker .
docker run -p 3000:3000 -v $(pwd)/data:/data days-tracker
```

## API Endpoints
- `GET /api/cycles` — List all cycles
- `POST /api/cycles` — Log a period
- `GET /api/cycles/predict/next` — Get next period prediction
- `GET /api/symptoms` — List symptoms
- `POST /api/symptoms` — Log a symptom
- `GET /health` — Health check
