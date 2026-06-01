# Test Filter Leads API

$status = "NEW"

Write-Host "Testing Filter Leads API..." -ForegroundColor Cyan
Write-Host "URL: http://localhost:3000/api/leads/filter?status=$status" -ForegroundColor Yellow
Write-Host "Filter Status: $status" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/leads/filter?status=$status" `
        -Method Get `
        -ContentType "application/json"
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Found Leads with status '$status': $($response.data.Count)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}

Write-Host ""
Write-Host "Try different status values:" -ForegroundColor Yellow
Write-Host "  NEW, CONTACTED, QUALIFIED, CONVERTED, LOST" -ForegroundColor Gray
Write-Host "  Edit the `$status variable to filter by different status" -ForegroundColor Gray