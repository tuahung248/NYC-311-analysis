-- Purpose: Load complaint taxonomy mapping and categorize cleaned 311 records.

CREATE OR REPLACE TABLE category_map AS
WITH src AS (
  SELECT
    trim(complaint_type_raw) AS complaint_type,
    lower(regexp_replace(trim(complaint_type_raw), '\s+', ' ')) AS complaint_type_norm,
    operational_category
  FROM read_csv_auto('codebook/category_mapping.csv', header = true)
  WHERE nullif(trim(coalesce(complaint_type_raw, '')), '') IS NOT NULL
),
dedup AS (
  SELECT
    *,
    ROW_NUMBER() OVER (PARTITION BY complaint_type_norm ORDER BY complaint_type) AS rn
  FROM src
)
SELECT complaint_type, complaint_type_norm, operational_category
FROM dedup
WHERE rn = 1;

CREATE OR REPLACE TABLE descriptor_override_map AS
WITH src AS (
  SELECT
    trim(complaint_type_raw) AS complaint_type,
    trim(descriptor_raw) AS descriptor,
    lower(regexp_replace(trim(complaint_type_raw), '\s+', ' ')) AS complaint_type_norm,
    lower(regexp_replace(trim(descriptor_raw), '\s+', ' ')) AS descriptor_norm,
    operational_category
  FROM read_csv_auto('codebook/descriptor_overrides.csv', header = true)
  WHERE nullif(trim(coalesce(complaint_type_raw, '')), '') IS NOT NULL
    AND nullif(trim(coalesce(descriptor_raw, '')), '') IS NOT NULL
),
dedup AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY complaint_type_norm, descriptor_norm
      ORDER BY complaint_type, descriptor
    ) AS rn
  FROM src
)
SELECT complaint_type, descriptor, complaint_type_norm, descriptor_norm, operational_category
FROM dedup
WHERE rn = 1;

CREATE OR REPLACE VIEW clean_311_categorized AS
SELECT
  c.*,
  coalesce(d.operational_category, m.operational_category, 'OTHER') AS operational_category
FROM clean_311 c
LEFT JOIN descriptor_override_map d
  ON lower(regexp_replace(trim(coalesce(c.complaint_type, '')), '\s+', ' ')) = d.complaint_type_norm
 AND lower(regexp_replace(trim(coalesce(c.descriptor, '')), '\s+', ' ')) = d.descriptor_norm
LEFT JOIN category_map m
  ON lower(regexp_replace(trim(coalesce(c.complaint_type, '')), '\s+', ' ')) = m.complaint_type_norm;
