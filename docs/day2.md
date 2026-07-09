# Day 2 - Apply Policies to kind

Date: 2026-07-09

## Cluster

- Context: `kind-llm-platform`
- Kubernetes: v1.36.1
- Node count: 1
- Node name: `llm-platform-control-plane`
- GPU device plugin: not installed
- Real GPU allocatable resource: not present

## Applied Objects

```powershell
kubectl apply -f k8s/00-namespaces.yaml
kubectl apply -f k8s/priorityclasses.yaml
kubectl apply -f k8s/10-quotas-limits.yaml
kubectl apply -f k8s/gpu-node-affinity-demo.yaml
```

## Current State

Namespaces:

- `ai-research`
- `ai-training`
- `ai-inference`

Priority classes:

- `gpu-critical-inference`: value `100000`, preemption enabled
- `gpu-training`: value `50000`, preemption enabled
- `gpu-batch-low`: value `10000`, preemption disabled

Quota usage after creating demo workloads:

| Namespace | Pods | CPU Requests | Memory Requests | GPU Requests |
| --- | ---: | ---: | ---: | ---: |
| `ai-research` | `0/20` | `0/16` | `0/64Gi` | `0/2` |
| `ai-training` | `1/30` | `4/64` | `16Gi/256Gi` | `1/6` |
| `ai-inference` | `2/40` | `4/32` | `16Gi/128Gi` | `2/4` |

## Observation

The demo GPU Pods are `Pending`, which is correct for the current kind cluster.

Training Pod:

```text
0/1 nodes are available: 1 node(s) didn't match Pod's node affinity/selector.
```

This proves the first scheduling gate: Node Affinity prevents a GPU workload from landing on a node that is not labeled as a matching GPU pool.

The quota counters still increased even though Pods are not scheduled. This is useful for the dashboard story: namespace budgets account for requested resources before actual execution.

## Next Experiments

### Experiment A - Affinity Gate

Label the kind node as a simulated training GPU pool:

```powershell
kubectl label node llm-platform-control-plane accelerator=nvidia-a100 gpu.platform/pool=training
```

Expected result:

- Training job passes the affinity gate.
- It should then remain Pending because the node still has no allocatable `nvidia.com/gpu`.
- Inference deployment still fails affinity because the node pool is `training`, not `inference`.

Observed result after labeling `llm-platform-control-plane`:

```text
0/1 nodes are available: 1 Insufficient memory, 1 Insufficient nvidia.com/gpu.
```

The original training demo uses realistic resource requests, so kind also reports memory pressure. Use `k8s/gpu-node-affinity-kind-demo.yaml` for a cleaner local scheduling experiment with low CPU and memory requests.

```powershell
kubectl apply -f k8s/gpu-node-affinity-kind-demo.yaml
kubectl describe pod -n ai-training -l app=gpu-scheduling-kind-demo
```

### Experiment B - Inference Pool

Switch the simulated node pool:

```powershell
kubectl label node llm-platform-control-plane gpu.platform/pool=inference --overwrite
kubectl label node llm-platform-control-plane topology.kubernetes.io/zone=local-a --overwrite
```

Expected result:

- Inference Pods pass the pool affinity gate.
- They should then remain Pending because the cluster has no GPU device plugin and no allocatable GPU.
- Training job fails affinity because the node pool is no longer `training`.

Observed result after switching to the inference pool and adding a simulated zone:

```text
0/1 nodes are available: 1 Insufficient memory, 1 Insufficient nvidia.com/gpu.
```

The original inference demo uses realistic resource requests, so kind may also report memory pressure. Use `k8s/gpu-inference-kind-demo.yaml` for a cleaner local inference scheduling experiment.

```powershell
kubectl apply -f k8s/gpu-inference-kind-demo.yaml
kubectl describe pod -n ai-inference -l app=gpu-inference-kind-demo
```

Observed result for the low-resource inference sample:

```text
0/1 nodes are available: 1 Insufficient nvidia.com/gpu.
```

Quota usage after adding the low-resource inference sample:

```text
requests.nvidia.com/gpu: 3/4
```

This confirms that `PriorityClass` and `Node Affinity` metadata are accepted, namespace quota accounting is active, and the remaining scheduling blocker is the lack of allocatable GPU on the kind node.

### Experiment D - Quota Rejection

When `ai-inference` has already requested `3/4` GPUs, submit a workload requesting 2 more GPUs:

```powershell
kubectl apply -f k8s/quota-exceed-inference-demo.yaml
```

Expected result:

```text
exceeded quota: inference-gpu-quota
```

This demonstrates a different control point from scheduling. ResourceQuota rejects the workload at admission time before the scheduler can place it or mark it Pending.

Observed result:

```text
Error creating: pods "quota-exceed-inference-demo-..." is forbidden:
exceeded quota: inference-gpu-quota,
requested: requests.nvidia.com/gpu=2,
used: requests.nvidia.com/gpu=3,
limited: requests.nvidia.com/gpu=4
```

Deployment state:

```text
READY 0/1, UP-TO-DATE 0, AVAILABLE 0
```

ReplicaSet state:

```text
DESIRED 1, CURRENT 0, READY 0
```

No Pod was created for this workload. This is the clean contrast with earlier Pending Pods:

- `Pending`: Pod exists, scheduler cannot place it.
- `FailedCreate`: Pod is rejected before scheduling because quota admission blocks it.

### Experiment C - Real GPU Cluster

On a GPU cluster:

1. Install NVIDIA device plugin.
2. Install DCGM Exporter.
3. Label GPU nodes by pool and accelerator type.
4. Apply the same manifests.
5. Replace dashboard mock data with Prometheus queries.

## Cleanup

```powershell
kubectl delete -f k8s/gpu-node-affinity-demo.yaml
kubectl delete -f k8s/10-quotas-limits.yaml
kubectl delete -f k8s/priorityclasses.yaml
kubectl delete -f k8s/00-namespaces.yaml
```
