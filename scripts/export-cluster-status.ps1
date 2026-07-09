$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $projectRoot "web\data"
$jsonPath = Join-Path $dataDir "cluster-status.json"
$jsPath = Join-Path $dataDir "cluster-status.js"

New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

function Get-PropertyValue {
  param(
    [Parameter(Mandatory = $true)] $Object,
    [Parameter(Mandatory = $true)] [string] $Name,
    [Parameter(Mandatory = $false)] $Default = "0"
  )

  $property = $Object.PSObject.Properties[$Name]
  if ($null -eq $property -or $null -eq $property.Value) {
    return $Default
  }

  return [string] $property.Value
}

function Convert-ResourceQuantityToNumber {
  param([string] $Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return 0
  }

  if ($Value.EndsWith("m")) {
    return [double]($Value.TrimEnd("m")) / 1000
  }

  if ($Value.EndsWith("Ki")) {
    return [double]($Value.Substring(0, $Value.Length - 2)) / 1048576
  }

  if ($Value.EndsWith("Mi")) {
    return [double]($Value.Substring(0, $Value.Length - 2)) / 1024
  }

  if ($Value.EndsWith("Gi")) {
    return [double]($Value.Substring(0, $Value.Length - 2))
  }

  return [double]$Value
}

$namespaces = @("ai-research", "ai-training", "ai-inference")
$quotasRaw = kubectl get resourcequota -A -o json | ConvertFrom-Json
$podsRaw = kubectl get pods -A -o json | ConvertFrom-Json
$eventsRaw = kubectl get events -A -o json | ConvertFrom-Json
$nodesRaw = kubectl get nodes -o json | ConvertFrom-Json

$teams = @(
foreach ($namespace in $namespaces) {
  $quota = $quotasRaw.items | Where-Object { $_.metadata.namespace -eq $namespace } | Select-Object -First 1
  $pods = @($podsRaw.items | Where-Object { $_.metadata.namespace -eq $namespace })

  $usedGpu = 0
  $hardGpu = 0
  $usedCpu = 0
  $hardCpu = 0
  $usedMemoryGi = 0
  $hardMemoryGi = 0

  if ($quota) {
    $usedGpu = [int](Get-PropertyValue $quota.status.used "requests.nvidia.com/gpu")
    $hardGpu = [int](Get-PropertyValue $quota.status.hard "requests.nvidia.com/gpu")
    $usedCpu = Convert-ResourceQuantityToNumber (Get-PropertyValue $quota.status.used "requests.cpu")
    $hardCpu = Convert-ResourceQuantityToNumber (Get-PropertyValue $quota.status.hard "requests.cpu")
    $usedMemoryGi = Convert-ResourceQuantityToNumber (Get-PropertyValue $quota.status.used "requests.memory")
    $hardMemoryGi = Convert-ResourceQuantityToNumber (Get-PropertyValue $quota.status.hard "requests.memory")
  }

  [pscustomobject]@{
    namespace = $namespace
    team = $namespace.Replace("ai-", "")
    pods = $pods.Count
    pendingPods = @($pods | Where-Object { $_.status.phase -eq "Pending" }).Count
    gpuRequested = $usedGpu
    gpuQuota = $hardGpu
    cpuRequested = $usedCpu
    cpuQuota = $hardCpu
    memoryRequestedGi = [math]::Round($usedMemoryGi, 2)
    memoryQuotaGi = [math]::Round($hardMemoryGi, 2)
  }
}
)

$interestingEvents = @(
  $eventsRaw.items |
    Where-Object { $_.reason -in @("FailedScheduling", "FailedCreate") } |
    Sort-Object { if ($_.lastTimestamp) { [datetime]$_.lastTimestamp } else { [datetime]$_.eventTime } } -Descending |
    Select-Object -First 12 |
    ForEach-Object {
      [pscustomobject]@{
        namespace = $_.metadata.namespace
        reason = $_.reason
        type = $_.type
        object = "$($_.involvedObject.kind.ToLower())/$($_.involvedObject.name)"
        message = $_.message
        lastTimestamp = if ($_.lastTimestamp) { $_.lastTimestamp } else { [string]$_.eventTime }
      }
    }
)

$nodes = @(
foreach ($node in $nodesRaw.items) {
  [pscustomobject]@{
    name = $node.metadata.name
    ready = [bool](@($node.status.conditions | Where-Object { $_.type -eq "Ready" -and $_.status -eq "True" }).Count)
    pool = Get-PropertyValue $node.metadata.labels "gpu.platform/pool" ""
    accelerator = Get-PropertyValue $node.metadata.labels "accelerator" ""
    zone = Get-PropertyValue $node.metadata.labels "topology.kubernetes.io/zone" ""
    allocatableGpu = Get-PropertyValue $node.status.allocatable "nvidia.com/gpu" "0"
  }
}
)

$totalGpuRequested = ($teams | Measure-Object -Property gpuRequested -Sum).Sum
$totalGpuQuota = ($teams | Measure-Object -Property gpuQuota -Sum).Sum
$totalPendingPods = ($teams | Measure-Object -Property pendingPods -Sum).Sum
$failedCreateCount = @($interestingEvents | Where-Object { $_.reason -eq "FailedCreate" }).Count
$failedSchedulingCount = @($interestingEvents | Where-Object { $_.reason -eq "FailedScheduling" }).Count

$clusterStatus = [pscustomobject]@{
  generatedAt = (Get-Date).ToString("s")
  context = (kubectl config current-context)
  summary = [pscustomobject]@{
    gpuRequested = $totalGpuRequested
    gpuQuota = $totalGpuQuota
    pendingPods = $totalPendingPods
    failedSchedulingEvents = $failedSchedulingCount
    failedCreateEvents = $failedCreateCount
    estimatedIdleCostPerHour = [math]::Round($totalGpuRequested * 2.4, 2)
  }
  teams = $teams
  nodes = $nodes
  events = $interestingEvents
}

$json = $clusterStatus | ConvertTo-Json -Depth 8
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($jsonPath, $json, $utf8NoBom)
[System.IO.File]::WriteAllText($jsPath, "window.CLUSTER_STATUS = $json;", $utf8NoBom)

Write-Host "Wrote $jsonPath"
Write-Host "Wrote $jsPath"
