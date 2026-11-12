from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
import math
import pandas as pd
import logging

from src.optimization_engine.aisle_network import (
    build_warehouse_graph,
    get_dispatch_node,
    get_shortest_distance,
    Graph,
)

logger = logging.getLogger(__name__)


def recommend_slots(
    products_df: pd.DataFrame,
    locations_df: pd.DataFrame,
    demand_df: pd.DataFrame,
    dispatch_point: Tuple[float, float] = (0.0, 0.0),
    output_path: Optional[str] = "outputs/slot_recommendations.csv",
    graph: Optional[Graph] = None,
    dispatch_node: Optional[str] = None,
) -> pd.DataFrame:
    """
    Generates slot recommendations for products into currently empty locations.

    Ranking & Assignment Algorithm:
    1. Filter locations where Status == 'EMPTY'.
    2. Calculate aisle-network shortest-path distance from each empty location to the
       configurable dispatch point (using Dijkstra's algorithm on the warehouse graph).
    3. Rank empty locations by aisle-network distance to dispatch point ascending (closest first).
    4. Rank products by Demand_Class (Fast > Medium > Slow), then Order_Frequency descending,
       then Total_Quantity descending.
    5. For each prioritized product, search for the best available empty location that satisfies:
       - Location is not already allocated to another product in this run (1-to-1).
       - Location Capacity >= Product Required_Capacity.
       - Location Allowed_Category is 'ALL' or matches Product Category (case-insensitive).
    6. If a compatible empty location is found, assign it with status 'RECOMMENDED'.
    7. If no compatible empty location exists (either due to constraints or all empty locations
       being assigned), assign status 'NO_FEASIBLE_LOCATION' with an explainable reason.
    8. Existing product locations remain untouched until supervisor approves.

    Args:
        products_df:   Products master DataFrame.
        locations_df:  Warehouse locations master DataFrame.
        demand_df:     Demand analysis DataFrame containing Demand_Class, Order_Frequency,
                       Total_Quantity.
        dispatch_point: (X, Y) coordinates of the dispatch / depot point.
        output_path:   Path to save recommendations CSV.
        graph:         Pre-built warehouse aisle-network graph (optional — built from
                       locations_df if not supplied).
        dispatch_node: Graph node ID for the dispatch point (optional — resolved from
                       dispatch_point if not supplied).

    Returns:
        DataFrame containing slot recommendations.
    """
    logger.info(
        f"Starting slot recommendation with dispatch point at {dispatch_point}..."
    )

    # Build graph if not supplied
    if graph is None:
        graph = build_warehouse_graph(locations_df)
    if dispatch_node is None:
        dispatch_node = get_dispatch_node(graph, dispatch_point, locations_df)

    # 1. Merge products with demand information
    prod_data = products_df.copy()
    if "Demand_Class" not in prod_data.columns:
        prod_data = prod_data.merge(
            demand_df[["SKU_ID", "Demand_Class", "Order_Frequency", "Total_Quantity"]],
            on="SKU_ID",
            how="left",
        )

    # Map priority: Fast (1), Medium (2), Slow (3)
    priority_map = {"Fast": 1, "Medium": 2, "Slow": 3}
    prod_data["Priority"] = prod_data["Demand_Class"].map(priority_map).fillna(4)

    # Sort products: Priority asc, Order_Frequency desc, Total_Quantity desc, SKU_ID asc
    sorted_products = prod_data.sort_values(
        by=["Priority", "Order_Frequency", "Total_Quantity", "SKU_ID"],
        ascending=[True, False, False, True],
    ).reset_index(drop=True)

    # 2. Extract and evaluate EMPTY locations only
    empty_locs = locations_df[locations_df["Status"] == "EMPTY"].copy()
    logger.info(f"Identified {len(empty_locs)} empty locations in warehouse.")

    if empty_locs.empty:
        logger.warning("No empty locations available in warehouse.")

    # Calculate aisle-network shortest-path distance to dispatch node
    empty_locs["Distance_To_Dispatch"] = empty_locs["Location_ID"].apply(
        lambda loc_id: get_shortest_distance(graph, dispatch_node, loc_id)
    )

    # Sort empty locations: closest to dispatch point first, then higher capacity first
    sorted_empty = empty_locs.sort_values(
        by=["Distance_To_Dispatch", "Capacity"], ascending=[True, False]
    ).reset_index(drop=True)

    # 3. Perform 1-to-1 feasible assignments
    assigned_location_ids: Set[str] = set()
    recommendation_rows: List[Dict] = []
    rec_counter = 1

    for _, prod in sorted_products.iterrows():
        sku = prod["SKU_ID"]
        pname = prod["Product_Name"]
        dclass = prod["Demand_Class"]
        curr_loc = prod["Current_Location"]
        req_cap = prod["Required_Capacity"]
        category = str(prod["Category"]).strip().upper()

        assigned = False

        for _, eloc in sorted_empty.iterrows():
            loc_id = eloc["Location_ID"]
            loc_cap = eloc["Capacity"]
            allowed_cat = str(eloc["Allowed_Category"]).strip().upper()
            loc_dist = eloc["Distance_To_Dispatch"]

            # Check if already assigned
            if loc_id in assigned_location_ids:
                continue

            # Check capacity
            if loc_cap < req_cap:
                continue

            # Check category compatibility
            if allowed_cat != "ALL" and allowed_cat != category:
                continue

            # Feasible assignment found
            assigned_location_ids.add(loc_id)
            recommendation_rows.append(
                {
                    "Recommendation_ID": f"REC{rec_counter:03d}",
                    "SKU_ID": sku,
                    "Product_Name": pname,
                    "Demand_Class": dclass,
                    "Current_Location": curr_loc,
                    "Recommended_Location": loc_id,
                    "Distance": round(loc_dist, 2),
                    "Recommendation_Status": "RECOMMENDED",
                    "Reason": (
                        f"Feasible slot for {dclass} mover. Meets capacity "
                        f"({loc_cap} >= req {req_cap}) and category '{allowed_cat}'. "
                        f"Aisle-network distance to dispatch: {loc_dist:.2f}"
                    ),
                }
            )
            rec_counter += 1
            assigned = True
            break

        if not assigned:
            # Determine specific explanation
            remaining_unassigned = sorted_empty[
                ~sorted_empty["Location_ID"].isin(assigned_location_ids)
            ]
            if remaining_unassigned.empty:
                reason = "All available empty warehouse locations have been allocated to higher-priority products"
            else:
                reason = (
                    f"No remaining empty location satisfies both capacity (>= {req_cap}) "
                    f"and category ('{category}') constraints"
                )

            recommendation_rows.append(
                {
                    "Recommendation_ID": f"REC{rec_counter:03d}",
                    "SKU_ID": sku,
                    "Product_Name": pname,
                    "Demand_Class": dclass,
                    "Current_Location": curr_loc,
                    "Recommended_Location": "NONE",
                    "Distance": 0.0,
                    "Recommendation_Status": "NO_FEASIBLE_LOCATION",
                    "Reason": reason,
                }
            )
            rec_counter += 1

    recommendations_df = pd.DataFrame(recommendation_rows)

    # Save to file if path provided
    if output_path:
        out_file = Path(output_path)
        out_file.parent.mkdir(parents=True, exist_ok=True)
        recommendations_df.to_csv(out_file, index=False)
        logger.info(f"Slot recommendations saved to {out_file.resolve()}")

    rec_counts = recommendations_df["Recommendation_Status"].value_counts().to_dict()
    logger.info(f"Slot recommendations summary: {rec_counts}")

    return recommendations_df

