#!/usr/bin/env powershell
<#
.SYNOPSIS
    API Testing Script for GoldenHour
.DESCRIPTION
    Tests all main API endpoints and displays results
.EXAMPLE
    .\test-api.ps1
#>

$BASE_URL = "http://localhost:8000/api/v1"

Write-Host "`n=== GoldenHour API Testing ==="  -ForegroundColor Cyan

$passed = 0
$failed = 0

# Test 1: Venues
Write-Host "`nTest 1: Get All Venues" -ForegroundColor Yellow
try {
    $venues = (Invoke-WebRequest -Uri "$BASE_URL/venues?skip=0&limit=100" -UseBasicParsing).Content | ConvertFrom-Json
    if ($venues.Count -eq 12) {
        Write-Host "[PASS] Got 12 venues" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "[FAIL] Expected 12 venues, got $($venues.Count)" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "[FAIL] $_" -ForegroundColor Red
    $failed++
}

# Test 2: Specific Venue
Write-Host "`nTest 2: Get Specific Venue Details" -ForegroundColor Yellow
try {
    $venues = (Invoke-WebRequest -Uri "$BASE_URL/venues?skip=0&limit=1" -UseBasicParsing).Content | ConvertFrom-Json
    $venue = $venues[0]
    Write-Host "[PASS] $($venue.name)" -ForegroundColor Green
    Write-Host "   Address: $($venue.address)"
    Write-Host "   Coordinates: ($($venue.latitude), $($venue.longitude))"
    $passed++
} catch {
    Write-Host "[FAIL] $_" -ForegroundColor Red
    $failed++
}

# Test 3: Deals for Venue
Write-Host "`nTest 3: Get Deals for Venue" -ForegroundColor Yellow
try {
    $venues = (Invoke-WebRequest -Uri "$BASE_URL/venues?skip=0&limit=1" -UseBasicParsing).Content | ConvertFrom-Json
    $deals = (Invoke-WebRequest -Uri "$BASE_URL/venues/$($venues[0].id)/deals" -UseBasicParsing).Content | ConvertFrom-Json
    if ($deals.Count -gt 0) {
        Write-Host "[PASS] Found $($deals.Count) deals for $($venues[0].name)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "[FAIL] No deals found" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "[FAIL] $_" -ForegroundColor Red
    $failed++
}

# Test 4: Sample Deal Details
Write-Host "`nTest 4: Deal Details" -ForegroundColor Yellow
try {
    $venues = (Invoke-WebRequest -Uri "$BASE_URL/venues?skip=0&limit=1" -UseBasicParsing).Content | ConvertFrom-Json
    $deals = (Invoke-WebRequest -Uri "$BASE_URL/venues/$($venues[0].id)/deals" -UseBasicParsing).Content | ConvertFrom-Json
    if ($deals.Count -gt 0) {
        $deal = $deals[0]
        Write-Host "[PASS] $($deal.title)" -ForegroundColor Green
        Write-Host "   Price: \$$($deal.deal_price) (was \$$($deal.original_price))"
        Write-Host "   Discount: $($deal.discount_percentage)%"
        $passed++
    }
} catch {
    Write-Host "[FAIL] $_" -ForegroundColor Red
    $failed++
}

# Test 5: Happy Hours by Day
Write-Host "`nTest 5: Happy Hours Schedule" -ForegroundColor Yellow
try {
    $schedules = (Invoke-WebRequest -Uri "$BASE_URL/happy-hours?day_of_week=5" -UseBasicParsing).Content | ConvertFrom-Json
    Write-Host "[PASS] Friday happy hours: $($schedules.Count) entries" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "[FAIL] $_" -ForegroundColor Red
    $failed++
}

# Test 6: API Documentation
Write-Host "`nTest 6: API Documentation" -ForegroundColor Yellow
try {
    $docs = (Invoke-WebRequest -Uri "http://localhost:8000/docs" -UseBasicParsing).StatusCode
    if ($docs -eq 200) {
        Write-Host "[PASS] Swagger UI available at http://localhost:8000/docs" -ForegroundColor Green
        $passed++
    }
} catch {
    Write-Host "[FAIL] $_" -ForegroundColor Red
    $failed++
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed`n" -ForegroundColor Red

if ($failed -eq 0) {
    Write-Host "All API tests passed!" -ForegroundColor Green
    Write-Host "`nTry these in your browser:"
    Write-Host "  * http://localhost:8000/docs            (API documentation)"
    Write-Host "  * http://localhost:8000/api/v1/venues   (Venues list)`n"
} else {
    Write-Host "Some tests failed." -ForegroundColor Yellow
    Write-Host "Check logs: docker compose logs backend`n"
}
