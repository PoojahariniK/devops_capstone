"""
Data Loader Module for Warehouse Optimization Engine.
Loads and validates cleaned datasets for products, locations, orders, and inventory.
"""

from pathlib import Path
from typing import Dict, Tuple
import pandas as pd
import logging

logger = logging.getLogger(__name__)

EXPECTED_SCHEMAS = {
    "products": {
        "filename": "products_clean.csv",
        "required_columns": [
            "SKU_ID",
            "Product_Name",
            "Category",
            "Required_Capacity",
            "Current_Location",
        ],
        "numeric_columns": ["Required_Capacity"],
    },
    "locations": {
        "filename": "warehouse_locations_clean.csv",
        "required_columns": [
            "Location_ID",
            "Aisle",
            "X",
            "Y",
            "Capacity",
            "Status",
            "Allowed_Category",
        ],
        "numeric_columns": ["X", "Y", "Capacity"],
    },
    "order_lines": {
        "filename": "order_lines_clean.csv",
        "required_columns": [
            "Order_Line_ID",
            "Order_ID",
            "Order_Date",
            "SKU_ID",
            "Quantity",
        ],
        "numeric_columns": ["Quantity"],
    },
    "inventory": {
        "filename": "inventory_clean.csv",
        "required_columns": ["SKU_ID", "Current_Stock", "Minimum_Stock"],
        "numeric_columns": ["Current_Stock", "Minimum_Stock"],
    },
}


def load_clean_data(
    base_dir: str = "datasets/cleaned",
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Loads all four cleaned warehouse datasets and validates schemas and types.

    Args:
        base_dir: Directory path where cleaned CSV files are stored.

    Returns:
        Tuple containing (products_df, locations_df, order_lines_df, inventory_df).

    Raises:
        FileNotFoundError: If any expected CSV file does not exist.
        ValueError: If expected columns are missing or numeric conversion fails.
    """
    data_dir = Path(base_dir)
    if not data_dir.exists():
        raise FileNotFoundError(f"Cleaned datasets directory not found at: {data_dir.resolve()}")

    loaded_dfs: Dict[str, pd.DataFrame] = {}

    for dataset_key, schema in EXPECTED_SCHEMAS.items():
        file_path = data_dir / schema["filename"]
        if not file_path.exists():
            raise FileNotFoundError(
                f"Missing required dataset file: {schema['filename']} at {file_path.resolve()}"
            )

        logger.info(f"Loading {dataset_key} from {file_path.name}...")
        df = pd.read_csv(file_path)

        # Check required columns
        missing_cols = set(schema["required_columns"]) - set(df.columns)
        if missing_cols:
            raise ValueError(
                f"Dataset {schema['filename']} is missing required columns: {sorted(list(missing_cols))}"
            )

        # Strip whitespace from string columns
        str_cols = df.select_dtypes(include=["object", "string"]).columns
        for col in str_cols:
            df[col] = df[col].astype(str).str.strip()

        # Validate and convert numeric columns
        for num_col in schema["numeric_columns"]:
            try:
                df[num_col] = pd.to_numeric(df[num_col], errors="raise")
            except Exception as e:
                raise ValueError(
                    f"Failed to convert column '{num_col}' in {schema['filename']} to numeric: {str(e)}"
                )

        loaded_dfs[dataset_key] = df

    logger.info("Successfully loaded and validated all four cleaned warehouse datasets.")
    return (
        loaded_dfs["products"],
        loaded_dfs["locations"],
        loaded_dfs["order_lines"],
        loaded_dfs["inventory"],
    )

