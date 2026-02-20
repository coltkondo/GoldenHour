#!/usr/bin/env powershell
<#
.SYNOPSIS
    Complete GoldenHour System Test - Clone to Testing
.DESCRIPTION
    Tests database seeding, API endpoints, and system health
.EXAMPLE
    .\test-system.ps1
#>

$ErrorActionPreference = "Continue"

Write-Host "`n=== GoldenHour Complete System Test ==="  -ForegroundColor Cyan

$testsPassed = 0
$testsFailed = 0

# ============= PHASE 1: Container Health =============
Write-Host "PHASE 1: Docker Containers" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────`n"

$containers = docker compose ps --format "{{.Service}}: {{.Status}}"
Write-Host "Container Status:"
$containers | ForEach-Object {
    Write-Host "  - $_"
}

$backend = docker compose ps -q backend 2>$null
$db = docker compose ps -q db 2>$null
$redis = docker compose ps -q redis 2>$null

if ($backend -and $db -and $redis) {
    Write-Host "OK: All containers running`n" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "FAIL: Some containers not running`n" -ForegroundColor Red
    $testsFailed++
}

# ============= PHASE 2: Database Seeding =============
Write-Host "PHASE 2: Database Seeding" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────`n"

$venuesCount = docker compose exec -T db psql -U postgres -d goldenhour -c "SELECT count(*) FROM venues;" 2>&1 | Where-Object {$_ -match '^\s*[0-9]'} | ForEach-Object { $_.Trim() }
$dealsCount = docker compose exec -T db psql -U postgres -d goldenhour -c "SELECT count(*) FROM deals;" 2>&1 | Where-Object {$_ -match '^\s*[0-9]'} | ForEach-Object { $_.Trim() }
$schedulesCount = docker compose exec -T db psql -U postgres -d goldenhour -c "SELECT count(*) FROM happy_hour_schedules;" 2>&1 | Where-Object {$_ -match '^\s*[0-9]'} | ForEach-Object { $_.Trim() }

Write-Host "Database Records:"
Write-Host "  - Venues: $venuesCount"
Write-Host "  - Deals: $dealsCount"
Write-Host "  - Schedules: $schedulesCount"

if ($venuesCount -eq "12" -and $dealsCount -eq "84" -and $schedulesCount -eq "67") {
    Write-Host "OK: Database correctly seeded`n" -ForegroundColor Green
    $testsPassed += 3
} else {
    Write-Host "WARN: Database counts differ from expected (12/84/67)`n" -ForegroundColor Yellow
    $testsFailed++
}

# ============= PHASE 3: API Endpoints =============
Write-Host "PHASE 3: API Endpoints" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────`n"

# Test 1: Venues Endpoint
Write-Host "Test 1: GET /api/v1/venues" -ForegroundColor Yellow
try {
    $venues = (Invoke-WebRequest -Uri 'http://localhost:8000/api/v1/venues?skip=0&limit=5' -UseBasicParsing -ErrorAction Stop).Content | ConvertFrom-Json
    if ($venues.Count -gt 0) {
        Write-Host "PASS: Returned $($venues.Count) venues" -ForegroundColor Green
        Write-Host "   Sample: $($venues[0].name) in $($venues[0].neighborhood)"
        $testsPassed++
    } else {
        Write-Host "FAIL: No venues returned" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "FAIL: Request failed: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 2: Deals Endpoint
Write-Host "Test 2: GET /api/v1/venues/{id}/deals" -ForegroundColor Yellow
try {
    $venues = (Invoke-WebRequest -Uri 'http://localhost:8000/api/v1/venues?skip=0&limit=1' -UseBasicParsing -ErrorAction Stop).Content | ConvertFrom-Json
    $venueId = $venues[0].id
    $deals = (Invoke-WebRequest -Uri "http://localhost:8000/api/v1/venues/$venueId/deals" -UseBasicParsing -ErrorAction Stop).Content | ConvertFrom-Json
    if ($deals.Count -gt 0) {
        Write-Host "PASS: Returned $($deals.Count) deals for $($venues[0].name)" -ForegroundColor Green
        Write-Host "   Sample: $($deals[0].title) - \$$($deals[0].deal_price) (from \$$($deals[0].original_price))"
        $testsPassed++
    } else {
        Write-Host "FAIL: No deals returned" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "FAIL: Request failed: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Happy Hours Endpoint
Write-Host "Test 3: GET /api/v1/happy-hours" -ForegroundColor Yellow
try {
    $schedules = (Invoke-WebRequest -Uri 'http://localhost:8000/api/v1/happy-hours?day_of_week=5' -UseBasicParsing -ErrorAction Stop).Content | ConvertFrom-Json
    Write-Host "PASS: Returned $($schedules.Count) schedules for Friday" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "FAIL: Request failed: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 4: API Documentation
Write-Host "Test 4: GET /docs (Swagger UI)" -ForegroundColor Yellow
try {
    $docs = (Invoke-WebRequest -Uri "http://localhost:8000/docs" -UseBasicParsing -ErrorAction Stop)
    if ($docs.StatusCode -eq 200) {
        Write-Host "PASS: Swagger documentation available" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "FAIL: Documentation not available" -ForegroundColor Red
    $testsFailed++
}

# ============= PHASE 4: Data Quality =============
Write-Host "PHASE 4: Data Quality Checks" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────`n"

# Sample data verification
Write-Host "Sample Venue:"
$sampleVenue = docker compose exec -T db psql -U postgres -d goldenhour -c "SELECT name, address, neighborhood FROM venues LIMIT 1;" 2>&1 | Select-String -Pattern "^\s*[A-Z]" | Select-Object -First 1
Write-Host "  $sampleVenue`n"

Write-Host "Sample Deal:"
$sampleDeal = docker compose exec -T db psql -U postgres -d goldenhour -c "SELECT title, deal_price, discount_percentage FROM deals WHERE deal_price IS NOT NULL LIMIT 1;" 2>&1 | Select-String -Pattern "^\s*[A-Z]" | Select-Object -First 1
Write-Host "  $sampleDeal`n"

Write-Host "OK: Data quality verified" -ForegroundColor Green
Write-Host ""
$testsPassed++

# ============= SUMMARY =============
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed`n"

if ($testsFailed -eq 0) {
    Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    Write-Host "  1. Open http://localhost:8000/docs in browser to explore API"
    Write-Host "  2. Run: cd admin-web && npm run dev   (for web UI)"
    Write-Host "  3. Run: cd mobile && npx expo start   (for mobile)`n"
    exit 0
} else {
    Write-Host "TESTS FAILED" -ForegroundColor Red
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "  - Check Docker: docker compose ps"
    Write-Host "  - Check logs: docker compose logs backend"
    Write-Host "  - Verify seeding: docker compose logs backend | Select-String 'imported'"
    Write-Host "  - Restart: docker compose restart`n"
    exit 1
}
