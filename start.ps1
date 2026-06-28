# CEO Agent — Quick Start Script
# Usage: .\start.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== CEO Agent Setup ===" -ForegroundColor Cyan

# Check .env
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "[!] Created .env from .env.example" -ForegroundColor Yellow
    Write-Host "[!] Add your GROQ_API_KEY to .env before starting." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    Get a free key at: https://console.groq.com" -ForegroundColor White
    exit 0
}

$envContent = Get-Content ".env" -Raw
if ($envContent -match "GROQ_API_KEY=gsk_your_groq_api_key_here" -or $envContent -match "GROQ_API_KEY=$") {
    Write-Host "[!] GROQ_API_KEY is not set in .env" -ForegroundColor Red
    Write-Host "    Get a free key at: https://console.groq.com" -ForegroundColor White
    Write-Host "    Then edit .env and replace GROQ_API_KEY with your real key." -ForegroundColor White
    exit 1
}

Write-Host "[+] .env found with API key configured" -ForegroundColor Green

# Check Docker
try {
    docker info 2>&1 | Out-Null
    Write-Host "[+] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "[!] Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Cyan
docker compose up --build -d

Write-Host ""
Write-Host "=== CEO Agent is starting up ===" -ForegroundColor Green
Write-Host ""
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Wait ~30 seconds for services to be ready, then open http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop:  docker compose down" -ForegroundColor Gray
Write-Host "To logs:  docker compose logs -f" -ForegroundColor Gray
