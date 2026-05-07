-- Purpose: Stage external reference data as persistent tables in DuckDB.

CREATE OR REPLACE TABLE acs_zip_income_quartiles AS
SELECT
  lpad(zip_code::VARCHAR, 5, '0') AS zip_code,
  median_household_income,
  income_quartile
FROM read_csv_auto('data/reference/acs_zip_income_quartiles.csv', header = true);
