window.CLUSTER_STATUS = {
    "generatedAt":  "2026-07-09T15:21:45",
    "context":  "kind-llm-platform",
    "summary":  {
                    "gpuRequested":  5,
                    "gpuQuota":  12,
                    "pendingPods":  5,
                    "failedSchedulingEvents":  5,
                    "failedCreateEvents":  3,
                    "estimatedIdleCostPerHour":  12
                },
    "teams":  [
                  {
                      "namespace":  "ai-research",
                      "team":  "research",
                      "pods":  0,
                      "pendingPods":  0,
                      "gpuRequested":  0,
                      "gpuQuota":  2,
                      "cpuRequested":  0,
                      "cpuQuota":  16,
                      "memoryRequestedGi":  0,
                      "memoryQuotaGi":  64
                  },
                  {
                      "namespace":  "ai-training",
                      "team":  "training",
                      "pods":  2,
                      "pendingPods":  2,
                      "gpuRequested":  2,
                      "gpuQuota":  6,
                      "cpuRequested":  4.1,
                      "cpuQuota":  64,
                      "memoryRequestedGi":  16.12,
                      "memoryQuotaGi":  256
                  },
                  {
                      "namespace":  "ai-inference",
                      "team":  "inference",
                      "pods":  3,
                      "pendingPods":  3,
                      "gpuRequested":  3,
                      "gpuQuota":  4,
                      "cpuRequested":  4.1,
                      "cpuQuota":  32,
                      "memoryRequestedGi":  16.12,
                      "memoryQuotaGi":  128
                  }
              ],
    "nodes":  [
                  {
                      "name":  "llm-platform-control-plane",
                      "ready":  true,
                      "pool":  "inference",
                      "accelerator":  "nvidia-a100",
                      "zone":  "local-a",
                      "allocatableGpu":  "0"
                  }
              ],
    "events":  [
                   {
                       "namespace":  "ai-inference",
                       "reason":  "FailedScheduling",
                       "type":  "Warning",
                       "object":  "pod/realtime-inference-demo-67f8f9fcb5-h67jq",
                       "message":  "0/1 nodes are available: 1 Insufficient memory, 1 Insufficient nvidia.com/gpu. no new claims to deallocate, preemption: 0/1 nodes are available: 1 Preemption is not helpful for scheduling.",
                       "lastTimestamp":  "2026-07-09T07:21:21Z"
                   },
                   {
                       "namespace":  "ai-inference",
                       "reason":  "FailedScheduling",
                       "type":  "Warning",
                       "object":  "pod/gpu-inference-kind-demo-5f5df7f7db-rldmn",
                       "message":  "0/1 nodes are available: 1 Insufficient nvidia.com/gpu. no new claims to deallocate, preemption: 0/1 nodes are available: 1 Preemption is not helpful for scheduling.",
                       "lastTimestamp":  "2026-07-09T07:18:59Z"
                   },
                   {
                       "namespace":  "ai-inference",
                       "reason":  "FailedScheduling",
                       "type":  "Warning",
                       "object":  "pod/realtime-inference-demo-67f8f9fcb5-7zpm2",
                       "message":  "0/1 nodes are available: 1 Insufficient memory, 1 Insufficient nvidia.com/gpu. no new claims to deallocate, preemption: 0/1 nodes are available: 1 Preemption is not helpful for scheduling.",
                       "lastTimestamp":  "2026-07-09T07:18:03Z"
                   },
                   {
                       "namespace":  "ai-training",
                       "reason":  "FailedScheduling",
                       "type":  "Warning",
                       "object":  "pod/gpu-scheduling-kind-demo-8lcz8",
                       "message":  "0/1 nodes are available: 1 node(s) didn\u0027t match Pod\u0027s node affinity/selector. no new claims to deallocate, preemption: 0/1 nodes are available: 1 Preemption is not helpful for scheduling.",
                       "lastTimestamp":  "2026-07-09T07:18:03Z"
                   },
                   {
                       "namespace":  "ai-training",
                       "reason":  "FailedScheduling",
                       "type":  "Warning",
                       "object":  "pod/llama-training-demo-7fv8n",
                       "message":  "0/1 nodes are available: 1 node(s) didn\u0027t match Pod\u0027s node affinity/selector. no new claims to deallocate, preemption: 0/1 nodes are available: 1 Preemption is not helpful for scheduling.",
                       "lastTimestamp":  "2026-07-09T07:18:03Z"
                   },
                   {
                       "namespace":  "ai-inference",
                       "reason":  "FailedCreate",
                       "type":  "Warning",
                       "object":  "replicaset/quota-exceed-inference-demo-654649bb45",
                       "message":  "Error creating: pods \"quota-exceed-inference-demo-654649bb45-vlrj8\" is forbidden: exceeded quota: inference-gpu-quota, requested: requests.nvidia.com/gpu=2, used: requests.nvidia.com/gpu=3, limited: requests.nvidia.com/gpu=4",
                       "lastTimestamp":  "2026-07-09T07:08:56Z"
                   },
                   {
                       "namespace":  "ai-inference",
                       "reason":  "FailedCreate",
                       "type":  "Warning",
                       "object":  "replicaset/quota-exceed-inference-demo-654649bb45",
                       "message":  "Error creating: pods \"quota-exceed-inference-demo-654649bb45-b7fv6\" is forbidden: exceeded quota: inference-gpu-quota, requested: requests.nvidia.com/gpu=2, used: requests.nvidia.com/gpu=3, limited: requests.nvidia.com/gpu=4",
                       "lastTimestamp":  "2026-07-09T06:53:08Z"
                   },
                   {
                       "namespace":  "ai-inference",
                       "reason":  "FailedCreate",
                       "type":  "Warning",
                       "object":  "replicaset/quota-exceed-inference-demo-654649bb45",
                       "message":  "Error creating: pods \"quota-exceed-inference-demo-654649bb45-24sbp\" is forbidden: exceeded quota: inference-gpu-quota, requested: requests.nvidia.com/gpu=2, used: requests.nvidia.com/gpu=3, limited: requests.nvidia.com/gpu=4",
                       "lastTimestamp":  "2026-07-09T06:37:18Z"
                   }
               ]
};