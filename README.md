# Dashboard Application

## Quick Start

### Frontend (Terminal 1)
```bash
cd frontend
npm start
```
Runs on http://localhost:3000

### Backend (Terminal 2)
```bash
cd backend
go run main.go
```
Runs on http://localhost:8080

## Test Credentials
- Email: admin@example.com
- Password: password123

or

- Email: user@example.com
- Password: password123

## Project Structure
```
dashboard-app/
├── frontend/          # React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   └── package.json
└── backend/           # Go API
    ├── handlers/
    ├── middleware/
    ├── models/
    └── main.go
```
