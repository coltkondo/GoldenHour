#!/usr/bin/env powershell
<#
.SYNOPSIS
    Quick Health Check for GoldenHour
.DESCRIPTION
    Verifies Docker, Database, and API are running
.EXAMPLE
    .\health-check.ps1
#>

Write-Host "`n=== GoldenHour Health Check ==="  -ForegroundColor Cyan

# 1. Docker Containers
Write-Host "`n[1] Docker Containers:" -ForegroundColor Yellow
$ps = docker compose ps --format "table {{.Service}}` {{.Status}}" 2>$null
if ($ps) {
    $ps | Select-Object -Skip 1 | ForEach-Object {
        if ($_ -match "healthy|running") {
            Write-Host "    [OK] $_" -ForegroundColor Green
        } else {
            Write-Host "    [WARN] $_" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "    [FAIL] Docker not responding" -ForegroundColor Red
}

# 2. Database
Write-Host "`n[2] Database:" -ForegroundColor Yellow
try {
    $venueCount = docker compose exec -T db psql -U postgres -d goldenhour -c "SELECT count(*) FROM venues;" 2>&1 | Where-Object {$_ -match '^\s*[0-9]'}
    if ($venueCount) {
        $num = $venueCount.Trim()
        Write-Host "    [OK] Connected: $num venues loaded"
    } else {
        Write-Host "    [FAIL] Database query failed"
    }
} catch {
    Write-Host "    [FAIL] Database error" -ForegroundColor Red
}

# 3. API Status
Write-Host "`n[3] API Endpoints:" -ForegroundColor Yellow
@(
    @{ url = "http://localhost:8000/docs"; name = "Swagger Docs" },
    @{ url = "http://localhost:8000/api/v1/venues"; name = "Venues" },
    @{ url = "http://localhost:8000/api/v1/deals/active"; name = "Deals" }
) | ForEach-Object {
    try {
        $status = (Invoke-WebRequest -Uri $_.url -UseBasicParsing -ErrorAction SilentlyContinue).StatusCode
        if ($status -eq 200) {
            Write-Host "    [OK] $($_.name)" -ForegroundColor Green
        } else {
            Write-Host "    [FAIL] $($_.name) - HTTP $status" -ForegroundColor Red
        }
    } catch {
        Write-Host "    [FAIL] $($_.name) - Connection failed" -ForegroundColor Red
    }
}

Write-Host "`n=== Health check complete ==="  -ForegroundColor Green
