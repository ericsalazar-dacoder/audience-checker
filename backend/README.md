# Audience Checker Backend

Node.js/Express backend for the audience checker application with local SQLite database.

## Features

- **Campaign Management**: Create, read, update, and delete campaigns
- **Audience Checkers**: Manage multiple audience checkers per campaign
- **Business Rules**: Define and manage rules for audience validation
- **Local Database**: SQLite for simple, file-based data persistence
- **RESTful API**: Clean REST endpoints for all operations

## Project Structure

```
audience-checker-backend/
├── src/
│   ├── controllers/
│   │   ├── campaignController.js
│   │   └── checkerController.js
│   ├── routes/
│   │   ├── campaigns.js
│   │   └── checkers.js
│   ├── database.js
│   └── server.js
├── scripts/
│   └── seed.js
├── data/
│   └── audience-checker.db (created on first run)
├── package.json
├── .env
└── README.md
```

## Installation

1. Navigate to the backend directory:

   ```bash
   cd audience-checker-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Start Development Server

```bash
npm run dev
```

Server will run at `http://localhost:5000`

### Seed Sample Data

```bash
npm run seed
```

### Start Production Server

```bash
npm start
```

## API Endpoints

### Campaigns

- `GET /api/campaigns` - Get all campaigns
- `GET /api/campaigns/:id` - Get campaign by ID with checkers
- `POST /api/campaigns` - Create new campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Audience Checkers

- `GET /api/checkers/campaign/:campaignId` - Get all checkers for a campaign
- `GET /api/checkers/:id` - Get checker by ID with rules
- `POST /api/checkers` - Create new checker
- `PUT /api/checkers/:id` - Update checker
- `DELETE /api/checkers/:id` - Delete checker

### Rules

- `POST /api/checkers/:checkerId/rules` - Add rule to checker
- `DELETE /api/checkers/rules/:ruleId` - Delete rule

## Database Schema

### Campaigns Table

```sql
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  campaignType TEXT,
  jbpmId TEXT,
  activeFlag INTEGER DEFAULT 1,
  lockedFlag INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
)
```

### Audience Checkers Table

```sql
CREATE TABLE audience_checkers (
  id TEXT PRIMARY KEY,
  campaignId TEXT NOT NULL,
  name TEXT NOT NULL,
  rules TEXT,
  status TEXT DEFAULT 'pending',
  alignmentStatus TEXT,
  lastChecked TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(campaignId) REFERENCES campaigns(id) ON DELETE CASCADE
)
```

### Rules Table

```sql
CREATE TABLE rules (
  id TEXT PRIMARY KEY,
  checkerId TEXT NOT NULL,
  field TEXT NOT NULL,
  operator TEXT NOT NULL,
  value TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(checkerId) REFERENCES audience_checkers(id) ON DELETE CASCADE
)
```

## Example Requests

### Create Campaign

```bash
curl -X POST http://localhost:5000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 2026 Campaign",
    "description": "First quarter campaign",
    "campaignType": "promotional",
    "jbpmId": "campaign_q1_2026"
  }'
```

### Create Audience Checker

```bash
curl -X POST http://localhost:5000/api/checkers \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-uuid-here",
    "name": "Mobile Users Checker",
    "rules": []
  }'
```

### Add Rule to Checker

```bash
curl -X POST http://localhost:5000/api/checkers/checker-uuid-here/rules \
  -H "Content-Type: application/json" \
  -d '{
    "field": "device_type",
    "operator": "equals",
    "value": "mobile"
  }'
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)
- `DATABASE_PATH` - Path to SQLite database file

## Notes

- Database file is automatically created on first run at `./data/audience-checker.db`
- All IDs use UUID v4 for uniqueness
- Timestamps are automatically managed (createdAt, updatedAt, lastChecked)
- Foreign key constraints ensure referential integrity
- Cascading deletes remove related checkers when a campaign is deleted
