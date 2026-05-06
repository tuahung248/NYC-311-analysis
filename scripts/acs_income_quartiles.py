import os
import sys
import pathlib
import requests
import pandas as pd
from requests.exceptions import JSONDecodeError as RequestsJSONDecodeError

ACS_YEAR = 2022
ACS_TABLE = "S1901"  
ACS_VARIABLE = "S1901_C01_012E"  
CENSUS_BASE_URL = f"https://api.census.gov/data/{ACS_YEAR}/acs/acs5/subject"

PARAMS = {
    "get": f"NAME,{ACS_VARIABLE}",
    "for": "zip code tabulation area:*",
}

API_KEY = os.environ.get("CENSUS_API_KEY")
if API_KEY:
    PARAMS["key"] = API_KEY

OUTPUT_PATH = pathlib.Path("data/reference/acs_zip_income_quartiles.csv")

# NYC ZIPs fall in the range 10001–11697 (Manhattan through Staten Island)
NYC_ZIP_MIN = 10001
NYC_ZIP_MAX = 11697

def fetch_acs() -> pd.DataFrame:
    print(f"Fetching ACS {ACS_YEAR} S1901 data from Census Bureau...")
    resp = requests.get(CENSUS_BASE_URL, params=PARAMS, timeout=60)

    if resp.status_code != 200:
        print(f"ERROR: Census API returned {resp.status_code}")
        print(resp.text[:500])
        sys.exit(1)

    try:
        data = resp.json()
    except RequestsJSONDecodeError:
        print("ERROR: Census API response was not valid JSON.")
        print(f"URL: {resp.url}")
        print(resp.text[:500])
        sys.exit(1)
    headers = data[0]
    rows = data[1:]

    df = pd.DataFrame(rows, columns=headers)
    print(f"  → {len(df):,} ZCTAs returned for New York State")
    return df

def process(df: pd.DataFrame) -> pd.DataFrame:
    df = df.rename(
        columns={
            "zip code tabulation area": "zip_code",
            ACS_VARIABLE: "median_household_income",
        }
    )

    # Keep only zip_code and income
    df = df[["zip_code", "median_household_income"]].copy()
    df["median_household_income"] = pd.to_numeric(
        df["median_household_income"], errors="coerce"
    )
    missing_before = df["median_household_income"].isna().sum()
    df = df[df["median_household_income"] > 0].copy()
    print(f"  → Dropped {missing_before:,} ZCTAs with missing / suppressed income")

    # Filter to NYC ZIP range
    df["zip_int"] = df["zip_code"].astype(int)
    nyc = df[(df["zip_int"] >= NYC_ZIP_MIN) & (df["zip_int"] <= NYC_ZIP_MAX)].copy()
    df = df.drop(columns="zip_int")
    nyc = nyc.drop(columns="zip_int")
    print(f"  → {len(nyc):,} NYC ZIPs retained (range {NYC_ZIP_MIN}–{NYC_ZIP_MAX})")

    if len(nyc) == 0:
        print("WARNING: No NYC ZIPs found — using all New York State ZIPs instead.")
        nyc = df

    nyc["income_quartile"] = pd.qcut(
        nyc["median_household_income"],
        q=4,
        labels=[1, 2, 3, 4],
    ).astype(int)

    nyc = nyc.sort_values("zip_code").reset_index(drop=True)

    return nyc

def save(df: pd.DataFrame) -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"\n✓ Saved {len(df):,} rows → {OUTPUT_PATH}")
    print(f"\nIncome quartile distribution:")
    print(df["income_quartile"].value_counts().sort_index().to_string())
    print(f"\nMedian income range:")
    print(
        f"  Q1 (lowest):  ${df[df.income_quartile==1].median_household_income.min():,.0f} – ${df[df.income_quartile==1].median_household_income.max():,.0f}"
    )
    print(
        f"  Q2:           ${df[df.income_quartile==2].median_household_income.min():,.0f} – ${df[df.income_quartile==2].median_household_income.max():,.0f}"
    )
    print(
        f"  Q3:           ${df[df.income_quartile==3].median_household_income.min():,.0f} – ${df[df.income_quartile==3].median_household_income.max():,.0f}"
    )
    print(
        f"  Q4 (highest): ${df[df.income_quartile==4].median_household_income.min():,.0f} – ${df[df.income_quartile==4].median_household_income.max():,.0f}"
    )

if __name__ == "__main__":
    raw = fetch_acs()
    clean = process(raw)
    save(clean)
