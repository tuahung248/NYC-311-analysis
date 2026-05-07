# Taxonomy Changelog

## v0.1.0 - Initial taxonomy release

- Established 20 uppercase operational categories for NYC311 complaint analysis.
- Populated `category_mapping.csv` with full coverage of complaint types present in `clean_311` (234 distinct values).
- Added `descriptor_overrides.csv` and enforced descriptor-first precedence in SQL taxonomy logic.
- Retained explicit `OTHER` fallback for rare internal/test/system artifacts only.
- Confirmed `SRDE` remains in `OTHER` at negligible volume (1 row, 0.00001% of `clean_311`) and is documented as a non-operational internal/system code.
- Logged baseline data quality anomalies and project caveats (DOHMH reliability, under-reporting bias, 2020-2021 exclusion rationale).
- Set validation guardrails: `OTHER <= 5%` overall and top unmapped complaint type share <= 0.5%.