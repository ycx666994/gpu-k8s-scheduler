$ErrorActionPreference = "Stop"

kubectl delete -f .\k8s\gpu-node-affinity-demo.yaml --ignore-not-found
kubectl delete -f .\k8s\10-quotas-limits.yaml --ignore-not-found
kubectl delete -f .\k8s\priorityclasses.yaml --ignore-not-found
kubectl delete -f .\k8s\00-namespaces.yaml --ignore-not-found

