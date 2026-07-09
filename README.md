# GPU Resource Scheduling and Cost Optimization

This project demonstrates GPU resource isolation, utilization monitoring, and scheduling strategy comparison on Kubernetes.

## Scope

- Namespace isolation for teams and workloads.
- ResourceQuota and LimitRange for GPU, CPU, and memory budgets.
- Node affinity and taints/tolerations for GPU node placement.
- PriorityClass for preemption and workload importance.
- Utilization and cost dashboard using mock metrics first, then Prometheus/DCGM metrics later.
- Strategy comparison: baseline scheduling, quota isolation, node affinity, and priority-based scheduling.

## Repository Layout

```text
docs/
  day1.md                       Day 1 build checklist and learning notes
  day2.md                       First kind cluster deployment notes
  prometheus-queries.md          Prometheus query plan for real metrics
  project-report.md              Chinese project report with screenshots
k8s/
  00-namespaces.yaml             Team namespaces
  10-quotas-limits.yaml          ResourceQuota and LimitRange objects
  namespaces-quotas.yaml         Namespace, quota, and limit examples
  priorityclasses.yaml           PriorityClass examples
  gpu-node-affinity-demo.yaml     Demo workloads using affinity and priority
  gpu-node-affinity-kind-demo.yaml Low CPU/memory GPU request demo for kind
  gpu-inference-kind-demo.yaml    Low CPU/memory inference GPU demo for kind
  quota-exceed-inference-demo.yaml ResourceQuota rejection demo
  monitoring-prometheus-rules.yaml Prometheus alert/rule examples
web/
  index.html                     Local dashboard demo
  styles.css
  app.js
scripts/
  status.ps1                     Print current demo cluster state
  export-cluster-status.ps1      Export kubectl state into the web dashboard
  cleanup.ps1                    Remove demo Kubernetes objects
```

## Day 1 Goal

Build a clear MVP story:

1. Three teams share GPU resources: research, training, and inference.
2. Quotas isolate each team's GPU budget.
3. Node affinity sends workloads to matching GPU node pools.
4. PriorityClass lets production inference win during contention.
5. A dashboard compares utilization and estimated cost across strategies.

## Run the Dashboard

Open this file in a browser:

```text
web/index.html
```

No install step is required. To show live cluster data, export the current Kubernetes state first:

```powershell
.\scripts\export-cluster-status.ps1
```

The exporter writes:

```text
web/data/cluster-status.json
web/data/cluster-status.js
```

## Apply the Kubernetes Manifests

Use these only when you have a Kubernetes cluster with GPU nodes or a simulated GPU resource.

```powershell
kubectl apply -f k8s/00-namespaces.yaml
kubectl apply -f k8s/priorityclasses.yaml
kubectl apply -f k8s/10-quotas-limits.yaml
kubectl apply -f k8s/gpu-node-affinity-demo.yaml
```

For a local kind cluster without real GPU resources, use this lower-resource demo to isolate the GPU scheduling failure reason:

```powershell
kubectl apply -f k8s/gpu-node-affinity-kind-demo.yaml
kubectl apply -f k8s/gpu-inference-kind-demo.yaml
```

For a real GPU cluster, install NVIDIA device plugin and DCGM Exporter before collecting production metrics.

## Check Current Demo State

```powershell
.\scripts\status.ps1
```

Useful local experiment:

```powershell
kubectl label node llm-platform-control-plane accelerator=nvidia-a100 --overwrite
kubectl label node llm-platform-control-plane gpu.platform/pool=inference --overwrite
kubectl label node llm-platform-control-plane topology.kubernetes.io/zone=local-a --overwrite
kubectl describe pod -n ai-inference -l app=gpu-inference-kind-demo
```

Expected local result on kind:

```text
0/1 nodes are available: 1 Insufficient nvidia.com/gpu.
```

Quota rejection experiment:

```powershell
kubectl apply -f k8s/quota-exceed-inference-demo.yaml
```

Expected result when `ai-inference` already uses `3/4` GPU requests:

```text
exceeded quota: inference-gpu-quota
```

Check the admission rejection event:

```powershell
kubectl get events -n ai-inference --field-selector reason=FailedCreate --sort-by=.lastTimestamp
```

## Cleanup

```powershell
.\scripts\cleanup.ps1
```
