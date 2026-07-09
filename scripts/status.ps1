$ErrorActionPreference = "Stop"

kubectl get ns ai-research ai-training ai-inference --show-labels
kubectl get priorityclass gpu-critical-inference gpu-training gpu-batch-low
kubectl get resourcequota -A
kubectl get pods -n ai-training -o wide
kubectl get pods -n ai-inference -o wide

Write-Host ""
Write-Host "Recent scheduling and admission events:"
kubectl get events -A --field-selector reason=FailedScheduling --sort-by=.lastTimestamp
kubectl get events -A --field-selector reason=FailedCreate --sort-by=.lastTimestamp
