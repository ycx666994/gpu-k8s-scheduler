# Day 1 - Project Start

Date: 2026-07-09

## Project Thesis

Kubernetes can reduce GPU waste by combining resource isolation, placement constraints, priority-aware scheduling, and utilization feedback. This project should show the difference between unmanaged GPU sharing and a controlled policy setup.

## MVP User Story

Platform engineers need to answer:

- Which team is using GPU resources?
- Which workloads are waiting because of quota or placement constraints?
- Which scheduling policy gives the best utilization and cost tradeoff?
- Which workloads should preempt others during peak demand?

## Architecture

```text
User
  -> Dashboard
      -> Mock scenario data on Day 1
      -> Prometheus API later
          -> kube-state-metrics
          -> NVIDIA DCGM Exporter
          -> Kubernetes API objects

Kubernetes
  -> Namespaces
  -> ResourceQuota / LimitRange
  -> PriorityClass
  -> Node labels / node affinity
  -> GPU workloads
```

## Day 1 Checklist

- [x] Create project folder.
- [x] Write README with project scope.
- [x] Add Namespace and ResourceQuota manifests.
- [x] Add PriorityClass manifests.
- [x] Add GPU node affinity demo workload.
- [x] Add first dashboard mockup.
- [ ] Test manifests against a local or remote cluster.
- [ ] Replace mock dashboard data with Prometheus queries.

## Demo Narrative

1. Start with "baseline" scheduling: workloads compete for GPU nodes without clear team budgets.
2. Add namespace quotas: each team gets a hard GPU budget.
3. Add node affinity: training jobs land on high-memory GPU nodes, inference lands on low-latency nodes.
4. Add priority classes: inference workloads can preempt low-priority batch experiments.
5. Compare utilization, queue pressure, and estimated hourly cost.

## Metrics to Track

- GPU allocation by namespace.
- GPU utilization percentage.
- GPU memory utilization percentage.
- Pending pods by reason.
- Preemption count.
- Estimated GPU cost per hour.
- Idle allocated GPU cost.

## Next Milestone

Build a small data adapter:

- `mock`: static scenario data for demos.
- `prometheus`: query real cluster metrics.
- `kubectl`: optional local collector for object state.

