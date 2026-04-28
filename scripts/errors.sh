#!/usr/bin/env bash
# scripts/errors.sh — show recent errors across all MesaHomes Lambdas.
#
# Usage:
#   bash scripts/errors.sh              # last 1 hour, all lambdas
#   bash scripts/errors.sh 24           # last 24 hours
#   bash scripts/errors.sh 24 content   # only lambdas matching "content"
#   bash scripts/errors.sh 1 "" --tail  # also stream new errors as they arrive
#
# Requires: aws cli, Msahms profile, jq optional.

set -euo pipefail

HOURS=${1:-1}
FILTER_NAME=${2:-}
TAIL=${3:-}

START_MS=$(( ($(date +%s) - HOURS * 3600) * 1000 ))

echo "=== errors in the last ${HOURS}h across MesaHomes Lambdas ==="
echo ""

LOG_GROUPS=$(aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/mesahomes \
  --profile Msahms --region us-west-2 \
  --query 'logGroups[].logGroupName' \
  --output text)

for lg in $LOG_GROUPS; do
  lambda_name="${lg#/aws/lambda/mesahomes-}"

  if [ -n "$FILTER_NAME" ] && [[ "$lambda_name" != *"$FILTER_NAME"* ]]; then
    continue
  fi

  # Grab events matching common error patterns.
  # Only ERROR-level + truly fatal patterns — skip INFO summaries
  # that happen to contain the word "error" (e.g. "errors": 0).
  events=$(aws logs filter-log-events \
    --log-group-name "$lg" \
    --start-time "$START_MS" \
    --filter-pattern '?"ERROR" ?"Uncaught" ?"Unhandled"' \
    --profile Msahms --region us-west-2 \
    --query 'events[].[timestamp,message]' \
    --output json 2>/dev/null || echo '[]')

  count=$(echo "$events" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))" 2>/dev/null || echo 0)

  if [ "$count" -gt 0 ]; then
    echo "--- $lambda_name ($count events) ---"
    echo "$events" | python3 -c "
import json, sys
from datetime import datetime
for ts, msg in json.load(sys.stdin):
    d = datetime.fromtimestamp(ts/1000).strftime('%H:%M:%S')
    msg = msg.strip().replace('\t', ' ')[:200]
    print(f'  {d}  {msg}')
"
    echo ""
  fi
done

echo "=== done. ==="
echo ""
echo "Tips:"
echo "  - Full message: aws logs filter-log-events --log-group-name <lg> --start-time $START_MS --profile Msahms --region us-west-2"
echo "  - CloudWatch Logs Insights: https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2#logsV2:logs-insights"
