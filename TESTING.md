# GoldenHour Testing Scripts

Quick scripts to test your GoldenHour system after cloning or deploying.

## Available Scripts

### 1. **Complete System Test** (Recommended)
Tests everything: containers, database, API endpoints, data quality
```powershell
.\test-system.ps1
```
- ✅ Checks Docker containers health
- ✅ Verifies database seeding (12 venues, 84 deals, 67 schedules)
- ✅ Tests all API endpoints
- ✅ Validates data quality
- ⏱️ Takes ~30 seconds

### 2. **Quick Health Check**
One-line status of system health
```powershell
.\health-check.ps1
```
- ✅ Container status
- ✅ Database connection
- ✅ API availability
- ⏱️ Takes ~5 seconds

### 3. **API Testing**
Detailed tests of API endpoints with sample responses
```powershell
.\test-api.ps1
```
- ✅ Venues endpoint
- ✅ Deals endpoint
- ✅ Happy hours endpoint
- ✅ Data structure validation
- ⏱️ Takes ~10 seconds

## Quick Start

### First Time Setup
```powershell
# 1. Clone repo and navigate
git clone <repo-url>
cd GoldenHour

# 2. Start services
docker compose up -d

# 3. Wait for initialization
Start-Sleep -Seconds 15

# 4. Run complete test
.\test-system.ps1
```

### Daily Testing
```powershell
# Quick health check
.\health-check.ps1

# If all checks pass, you're good to go!
# If any fail, run full test for details
.\test-system.ps1
```

## Expected Output

### ✅ Successful Test
```
╔════════════════════════════════════════════╗
║   GoldenHour Complete System Test         ║
╚════════════════════════════════════════════╝

PHASE 1: Docker Containers
  • backend: Up
  • db: Up (healthy)
  • redis: Up (healthy)
✅ All containers running

PHASE 2: Database Seeding
  • Venues: 12
  • Deals: 84
  • Schedules: 67
✅ Database correctly seeded

PHASE 3: API Endpoints
Test 1: GET /api/v1/venues
  ✅ Returned 12 venues
Test 2: GET /api/v1/venues/{id}/deals
  ✅ Returned X deals
...

════════════════════════════════════════════
✅ ALL TESTS PASSED!
```

### ❌ Failed Test
```
❌ Tests Failed

Troubleshooting:
  • Check Docker: docker compose ps
  • Check logs: docker compose logs backend
  • Verify seeding: docker compose logs backend | Select-String 'imported'
  • Restart: docker compose restart
```

## Troubleshooting

### "Docker is not running"
```powershell
# Start Docker Desktop (Windows/Mac) or:
sudo systemctl start docker  # Linux
```

### "Backend container not running"
```powershell
docker compose up -d
Start-Sleep -Seconds 15
.\health-check.ps1
```

### "Database not seeded"
```powershell
# Check if auto-seed ran
docker compose logs backend | Select-String "Done! Imported"

# If not, restart backend
docker compose restart backend
Start-Sleep -Seconds 10
docker compose logs backend | Select-String "imported"
```

### "API returning 404"
```powershell
# Verify backend is fully started
docker compose logs backend | Select-String "Application startup complete"

# Check if port 8000 is in use
netstat -ano | findstr :8000
```

## Testing Workflow

```
┌─────────────────────────────────────┐
│   1. Clone Repository               │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   2. docker compose up -d           │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   3. .\health-check.ps1             │
└─────────────┬───────────────────────┘
              │
        ┌─────┴──────┐
        │ All pass?  │
        └─────┬──────┘
         Yes  │  No
             ▼
        Wait & retry
        
        │
        ▼
┌──────────────────────────────────────┐
│   4. .\test-system.ps1 (full test)   │
└──────────────────────────────────────┘
              │
              ▼
        ✅ Ready to use!
```

## API Endpoints to Test

Once tests pass, try these in your browser:

| Endpoint | Purpose |
|----------|---------|
| `http://localhost:8000/docs` | Interactive API docs (Swagger) |
| `http://localhost:8000/api/v1/venues` | List all venues |
| `http://localhost:8000/api/v1/venues?neighborhood=Downtown` | Filter venues |

## Next Steps After Passing Tests

### Start Admin Web UI
```powershell
cd admin-web
npm install  # first time only
npm run dev
# Open http://localhost:5173
```

### Start Mobile App
```powershell
cd mobile
npm install  # first time only
npx expo start
# Scan QR code with Expo Go app
```

## For Developers

### Running Tests Multiple Times
```powershell
# Full reset between tests
docker compose down
docker volume rm goldenhour_postgres_data -f
docker compose up -d
Start-Sleep -Seconds 20
.\test-system.ps1
```

### Viewing Database Directly
```powershell
# Connect to database
docker compose exec db psql -U postgres -d goldenhour

# In psql terminal:
\dt public.*          # List all tables
SELECT * FROM venues LIMIT 5;
SELECT * FROM deals WHERE venue_id = '...';
SELECT COUNT(*) FROM happy_hour_schedules;
\q                    # Quit
```

### Checking Backend Logs
```powershell
# Last 50 lines
docker compose logs backend --tail 50

# Follow logs in real-time (Ctrl+C to stop)
docker compose logs -f backend

# Search for specific messages
docker compose logs backend | Select-String "imported|error|failed"
```

---

**Questions?** Check the main README.md or run:
```powershell
.\test-system.ps1
```
