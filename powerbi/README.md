# Power BI Performance Analytics Integration Guide

## 1. Overview

This document provides step-by-step instructions for connecting Power BI Desktop to the Snowflake database `CAP12_WAREHOUSE` (Schema `CLEAN`) or importing the generated CSV outputs to create interactive warehouse management dashboards.

---

## 2. Data Connection Modes

### Option A: Snowflake DirectQuery / Import (Recommended)

1. Open **Power BI Desktop**.
2. Select **Get Data** -> **Snowflake**.
3. Enter connection parameters:
   - **Server**: `<your-account>.snowflakecomputing.com` (e.g. `xy12345.us-east-1`)
   - **Warehouse**: `CAP12_WH`
   - **Database**: `CAP12_WAREHOUSE`
   - **Schema**: `CLEAN`
   - **Data Connectivity mode**: `DirectQuery` or `Import`
4. Authenticate using **Database** username and password.
5. In the Navigator pane, select the analytical views:
   - `VW_PERFORMANCE_ANALYTICS`
   - `VW_DEMAND_DISTRIBUTION`
   - `VW_WAREHOUSE_OCCUPANCY`
   - `VW_SLOT_APPROVAL_STATUS`
   - `VW_REPLENISHMENT_PRIORITY`
   - `ROUTE_RESULTS`
   - `SLOT_RECOMMENDATIONS`

### Option B: Local CSV Folder Import

If Snowflake credentials are not configured, import directly from the project's `outputs/` folder:
- `outputs/route_comparison.csv`
- `outputs/demand_analysis.csv`
- `outputs/slot_recommendations.csv`
- `outputs/replenishment_alerts.csv`

---

## 3. Recommended Visualizations & Dashboard Layout

### Page 1: Executive KPI & Pick-Path Efficiency
- **KPI Card 1**: Average Travel Distance Reduction % (`14.25%`)
- **KPI Card 2**: Total Travel Units Saved (`799.37 units`)
- **KPI Card 3**: Total Time Saved (`666.14 seconds`)
- **KPI Card 4**: Replenishment Alerts (`6 items`)
- **Clustered Bar Chart**: Baseline Distance vs. Optimized Distance by Order ID (`ORD001` - `ORD050`)
- **Donut Chart**: Route Outcome Distribution (Improved: 44, Worse: 5, Identical: 1)
- **Callout Note**: Transparent disclaimer highlighting 5 suboptimal edge cases (`ORD012`, `ORD016`, `ORD028`, `ORD038`, `ORD045`) where Nearest Neighbor greedy heuristic yielded higher distance.

### Page 2: Storage Slotting & Physical Layout
- **Scatter Plot (Warehouse Map)**:
  - X-Axis: `X` coordinate
  - Y-Axis: `Y` coordinate
  - Legend: `Status` (Occupied vs Empty)
  - Tooltip: `Location_ID`, `Aisle`, `Capacity`, `Allowed_Category`
- **Table Visual**: `SLOT_RECOMMENDATIONS` with columns:
  - `Recommendation_ID`, `SKU_ID`, `Product_Name`, `Demand_Class`, `Current_Location`, `Recommended_Location`, `Distance`, `Recommendation_Status`, `Reason`
- **Bar Chart**: Recommendations by Status (`RECOMMENDED`: 9, `NO_FEASIBLE_LOCATION`: 21)

### Page 3: Demand Profiling & Inventory Replenishment
- **Treemap**: Products segmented by Category and sized by `Total_Quantity`, colored by `Demand_Class` (Fast/Medium/Slow).
- **Matrix / Table Visual**: Replenishment Action Priority
  - Columns: `SKU_ID`, `Product_Name`, `Current_Stock`, `Minimum_Stock`, `Stock_Deficit`, `Stock_Status`
  - Conditional Formatting: Background Red for `OUT_OF_STOCK`, Orange for `LOW_STOCK`.

---

## 4. Key DAX Measures

```dax
// Average Distance Reduction Percentage
Avg_Distance_Reduction_Pct = 
AVERAGE(ROUTE_RESULTS[PCT_DISTANCE_REDUCTION])

// Total Distance Saved
Total_Distance_Saved = 
SUM(ROUTE_RESULTS[DISTANCE_SAVED])

// Total Time Saved in Minutes
Total_Time_Saved_Min = 
DIVIDE(SUM(ROUTE_RESULTS[TIME_SAVED_SEC]), 60)

// Suboptimal Order Count (Heuristic Worse)
Suboptimal_Order_Count = 
CALCULATE(
    COUNTROWS(ROUTE_RESULTS),
    ROUTE_RESULTS[ROUTE_STATUS] = "WORSE"
)

// Suboptimal Order Percentage
Suboptimal_Rate_Pct = 
DIVIDE([Suboptimal_Order_Count], COUNTROWS(ROUTE_RESULTS), 0) * 100

// Warehouse Occupancy Rate %
Warehouse_Occupancy_Pct = 
VAR OccupiedCount = CALCULATE(COUNTROWS(WAREHOUSE_LOCATIONS), WAREHOUSE_LOCATIONS[STATUS] = "OCCUPIED")
VAR TotalCount = COUNTROWS(WAREHOUSE_LOCATIONS)
RETURN
DIVIDE(OccupiedCount, TotalCount, 0) * 100
```

