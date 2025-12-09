# PowerShell script to kill process on port 4000
$port = 4000

Write-Host "Finding process using port $port..." -ForegroundColor Yellow

$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($process) {
    Write-Host "Found process $process using port $port" -ForegroundColor Green
    Write-Host "Killing process..." -ForegroundColor Yellow
    
    Stop-Process -Id $process -Force
    
    Write-Host "Process killed successfully!" -ForegroundColor Green
    Write-Host "You can now start the server with: npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "No process found using port $port" -ForegroundColor Red
}