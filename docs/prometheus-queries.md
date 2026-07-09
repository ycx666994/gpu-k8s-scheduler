# Prometheus Query Plan

Use these queries after installing kube-state-metrics, NVIDIA device plugin, and DCGM Exporter.

## Allocation

GPU requested by namespace:

```promql
sum by (namespace) (
  kube_pod_container_resource_requests{resource="nvidia_com_gpu"}
)
```

Pending GPU Pods:

```promql
sum by (namespace) (
  kube_pod_status_phase{phase="Pending"}
  * on (namespace, pod) group_left()
  max by (namespace, pod) (
    kube_pod_container_resource_requests{resource="nvidia_com_gpu"} > 0
  )
)
```

## Utilization

Average GPU utilization by Kubernetes namespace requires mapping DCGM metrics to Pods. The exact labels depend on the DCGM Exporter setup.

```promql
avg by (namespace) (
  DCGM_FI_DEV_GPU_UTIL
)
```

GPU memory utilization:

```promql
avg by (namespace) (
  DCGM_FI_DEV_FB_USED / (DCGM_FI_DEV_FB_USED + DCGM_FI_DEV_FB_FREE) * 100
)
```

## Cost

Estimated hourly allocation cost:

```promql
sum by (namespace) (
  kube_pod_container_resource_requests{resource="nvidia_com_gpu"}
) * 2.40
```

Estimated idle GPU cost:

```promql
(
  sum by (namespace) (kube_pod_container_resource_requests{resource="nvidia_com_gpu"})
  *
  (1 - avg by (namespace) (DCGM_FI_DEV_GPU_UTIL) / 100)
) * 2.40
```

Adjust `2.40` to match the hourly cost of the selected GPU type.

