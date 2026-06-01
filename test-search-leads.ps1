# Test Search Leads API

$searchTerm = "john"

Write-Host "Testing Search Leads API..." -ForegroundColor Cyan
Write-Host "URL: http://localhost:3000/api/leads/search?name=$searchTerm" -ForegroundColor Yellow
Write-Host "Search Term: $searchTerm" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/leads/search?name=$searchTerm" `
        -Method Get `
        -ContentType "application/json"
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Found Leads: $($response.data.Count)" -ForegroundColor Cyan
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
Write-Host "Try different search terms:" -ForegroundColor Yellow
Write-Host "  .\test-search-leads.ps1" -ForegroundColor Gray
Write-Host "  Edit the `$searchTerm variable to search for different names" -ForegroundColor Gray
