$ErrorActionPreference = 'Continue'

function Test-HttpEndpoint {
    param(
        [string]$Name,
        [string]$Uri,
        [int[]]$ExpectedStatus = @(200)
    )

    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $Uri -TimeoutSec 8
        if ($ExpectedStatus -contains [int]$response.StatusCode) {
            Write-Host "[PASS] $Name -> $($response.StatusCode)" -ForegroundColor Green
            return $true
        }
        Write-Host "[FAIL] $Name -> unexpected status $($response.StatusCode)" -ForegroundColor Red
        return $false
    } catch {
        $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 'connection failed' }
        Write-Host "[FAIL] $Name -> $status" -ForegroundColor Red
        return $false
    }
}

$checks = @()
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host '[FAIL] Docker CLI is not installed or unavailable.' -ForegroundColor Red
    exit 1
}

try {
    docker info *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Docker daemon is unavailable.' }
    Write-Host '[PASS] Docker daemon is available.' -ForegroundColor Green
} catch {
    Write-Host '[FAIL] Docker daemon is unavailable. Start Docker Desktop first.' -ForegroundColor Red
    exit 1
}

$composeOutput = docker compose ps --status running --services 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host '[FAIL] docker compose ps failed.' -ForegroundColor Red
    exit 1
}

$expectedServices = @('mysql', 'redis', 'rabbitmq', 'eureka-server', 'auth-service', 'property-rental-service', 'billing-payment-service', 'notification-service', 'api-gateway', 'frontend')
foreach ($service in $expectedServices) {
    if ($composeOutput -contains $service) {
        Write-Host "[PASS] Compose service running: $service" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Compose service not running: $service" -ForegroundColor Red
        $checks += $false
    }
}

$checks += Test-HttpEndpoint -Name 'Frontend' -Uri 'http://localhost:5173/'
$checks += Test-HttpEndpoint -Name 'Eureka' -Uri 'http://localhost:8761/'
$checks += Test-HttpEndpoint -Name 'Gateway public room search' -Uri 'http://localhost:8080/api/v1/rooms/search'

if ($checks -contains $false) {
    Write-Host "`nStack preflight FAILED. Inspect with: docker compose ps and docker compose logs <service>" -ForegroundColor Red
    exit 1
}

Write-Host "`nStack preflight PASSED. You can continue with API smoke tests and the race-condition demo." -ForegroundColor Green
exit 0
