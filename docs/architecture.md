# Architecture

The MVP uses Kubernetes native policy objects first, then exports live cluster state into a static dashboard. Prometheus and DCGM are planned as the next monitoring layer for real GPU utilization.

![Architecture](./screenshots/architecture.png)

## Flow

1. Platform engineer applies Kubernetes policy manifests.
2. Workloads request GPU resources inside isolated namespaces.
3. ResourceQuota enforces team budgets at admission time.
4. Node Affinity and PriorityClass guide scheduling decisions.
5. Kubernetes events expose Pending and FailedCreate control points.
6. `export-cluster-status.ps1` collects quota, pod, node, and event state.
7. The web dashboard renders exported JSON/JS data locally.

