---
status: open
type: feature
priority: low
created: 2026-01-24
tags: [data, charts, reports]
---

# Bead: [Tab 8] Reports & Heatmap Logic

## Objective

Build the visual data insights tab using the pre-aggregated `daily_rollup` data.

## Requirements

- **Charts:** Hourly density heatmap (0-23 hours).
- **Aggregation:** Query ONLY `daily_rollup` (Zero-latency read).
- **Date Range:** Picker for trailing 7/30 days.

## Context

- **Spec:** Tab [8] Schema in `docs/specs/Brew_House_Specifications.md`
