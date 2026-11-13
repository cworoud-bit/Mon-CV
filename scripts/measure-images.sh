#!/usr/bin/env bash
# Usage : scripts/measure-images.sh <label> build|scan
set -uo pipefail
LABEL="${1:?usage: measure-images.sh <label> build|scan}"
MODE="${2:?usage: measure-images.sh <label> build|scan}"
cd "$(dirname "$0")/.."
OUT="$HOME/mesures-$LABEL.txt"

if [ "$MODE" = "build" ]; then
  docker builder prune -af > /dev/null
  for spec in "devsecops-api:./api" "devsecops-portfolio:./devsecops-portfolio"; do
    name="${spec%%:*}"; ctx="${spec#*:}"; tag="$name:$LABEL"
    start=$(date +%s)
    if docker build --network=host -t "$tag" "$ctx" > "/tmp/build-$name-$LABEL.log" 2>&1; then
      secs=$(( $(date +%s) - start ))
      size=$(docker image inspect "$tag" --format '{{.Size}}' | awk '{printf "%.0f", $1/1000000}')
      echo "BUILD $tag taille=${size}Mo build=${secs}s" | tee -a "$OUT"
    else
      echo "ECHEC build $tag (voir /tmp/build-$name-$LABEL.log)" | tee -a "$OUT"
    fi
  done
fi

if [ "$MODE" = "scan" ]; then
  for name in devsecops-api devsecops-portfolio; do
    tag="$name:$LABEL"
    tmp=$(mktemp)
    if docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v trivy-cache:/root/.cache/ \
        aquasec/trivy:latest image --quiet --skip-db-update --scanners vuln --format json "$tag" > "$tmp" 2> /tmp/trivy-err.log; then
      python3 - "$tmp" "$tag" << 'PY' | tee -a "$OUT"
import json, sys, collections
path, tag = sys.argv[1:3]
data = json.load(open(path))
c = collections.Counter()
for r in data.get("Results", []):
    for v in r.get("Vulnerabilities") or []:
        c[v["Severity"]] += 1
print(f"SCAN {tag} total={sum(c.values())} CRITICAL={c['CRITICAL']} HIGH={c['HIGH']} MEDIUM={c['MEDIUM']} LOW={c['LOW']}")
PY
    else
      echo "ECHEC scan $tag (voir /tmp/trivy-err.log)" | tee -a "$OUT"
    fi
    rm -f "$tmp"
  done
fi
