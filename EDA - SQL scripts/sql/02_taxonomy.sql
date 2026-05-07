-- Purpose: Load complaint taxonomy mapping and categorize cleaned 311 records.

CREATE OR REPLACE TABLE category_map AS
SELECT
  trim(complaint_type_raw) AS complaint_type,
  operational_category
FROM read_csv_auto('codebook/category_mapping.csv', header = true);

CREATE OR REPLACE TABLE descriptor_override_map AS
SELECT
  trim(complaint_type_raw) AS complaint_type,
  trim(descriptor_raw) AS descriptor,
  operational_category
FROM read_csv_auto('codebook/descriptor_overrides.csv', header = true);

CREATE OR REPLACE VIEW clean_311_categorized AS
SELECT
  c.*,
  coalesce(d.operational_category, m.operational_category, 'OTHER') AS operational_category
FROM clean_311 c
LEFT JOIN descriptor_override_map d
  ON c.complaint_type = d.complaint_type
 AND c.descriptor = d.descriptor
LEFT JOIN category_map m
  ON c.complaint_type = m.complaint_type;
