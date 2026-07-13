#!/usr/bin/env bash
set -e

# Run stryker mutation testing
npx stryker run

# Check if mutation score is 100%
SCORE=$(grep -oP 'Mutation score: \K\d+(?=\.\d+%)' .stryker-tmp/report.html 2>/dev/null || echo "0")
if (( SCORE < 100 )); then
  echo "Mutation score is $SCORE%, expected 100%"
  exit 1
fi
echo "Mutation score is $SCORE% - PASS"