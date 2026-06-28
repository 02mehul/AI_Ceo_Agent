# CEO Agent — Run locally WITHOUT Docker (requires PostgreSQL running separately)
# Usage: .\start-local.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== CEO Agent Local Dev ===" -ForegroundColor Cyan

# Backend
Write-Host "[+] Starting backend (FastAPI)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'D:\MS Projects\Ceo_Agent\backend'; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -WindowStyle Normal

Start-Sleep -Seconds 2

# Frontend
Write-Host "[+] Starting frontend (Next.js)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'D:\MS Projects\Ceo_Agent\frontend'; & 'C:\Program Files (x86)\Yarn\bin\yarn.cmd' dev" -WindowStyle Normal

Write-Host ""
Write-Host "=== Services starting ===" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "NOTE: You need PostgreSQL running on localhost:5432" -ForegroundColor Yellow
Write-Host "      Or just use Docker: .\start.ps1" -ForegroundColor Yellow
