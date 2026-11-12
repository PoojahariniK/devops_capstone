import sys
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger("optimization_engine")

from src.optimization_engine.data_loader import load_clean_data
from src.optimization_engine.demand_classifier import classify_demand
from src.optimization_engine.slot_recommender import recommend_slots
from src.optimization_engine.pick_path import (
    calculate_baseline_routes,
    calculate_optimized_routes,
    compare_routes,
)
from src.optimization_engine.validation import (
    validate_slot_assignment,
    check_replenishment_alerts,
)
from src.optimization_engine.aisle_network import (
    build_warehouse_graph,
    get_dispatch_node,
    validate_graph,
)
from src.optimization_engine.snowflake_sync import SnowflakeSync


def run_pipeline(
    data_dir: str = "datasets/cleaned",
    output_dir: str = "outputs",
    dispatch_point: tuple = (0.0, 0.0),
    walking_speed: float = 1.2,
    pick_handling_time: float = 15.0,
):
    """
    Executes the end-to-end warehouse slotting and route optimization pipeline.
    """
    logger.info("=" * 70)
    logger.info("STARTING WAREHOUSE SLOTTING & PICK-PATH OPTIMIZATION PIPELINE")
    logger.info("=" * 70)

    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    # 1. Load datasets
    logger.info("\n--- Step 1: Loading Cleaned Datasets ---")
    try:
        products_df, locations_df, order_lines_df, inventory_df = load_clean_data(data_dir)
        logger.info(
            f"Loaded {len(products_df)} products, {len(locations_df)} locations, "
            f"{len(order_lines_df)} order lines, {len(inventory_df)} inventory records."
        )
    except Exception as e:
        logger.error(f"Data loading failed: {e}")
        raise

    # 1b. Build Warehouse Aisle Network Graph
    logger.info("\n--- Step 1b: Building Warehouse Aisle Network Graph ---")
    warehouse_graph = build_warehouse_graph(locations_df)
    dispatch_node = get_dispatch_node(warehouse_graph, dispatch_point, locations_df)
    validate_graph(warehouse_graph, locations_df)
    logger.info(
        f"Graph built: {len(warehouse_graph)} nodes. Dispatch node: '{dispatch_node}'"
    )

    # 2. Demand classification
    logger.info("\n--- Step 2: Demand Classification ---")
    demand_df = classify_demand(
        order_lines_df=order_lines_df,
        products_df=products_df,
        output_path=str(out_path / "demand_analysis.csv"),
        summary_path=str(out_path / "demand_summary.csv"),
    )

    # 3. Slot recommendations
    logger.info(f"\n--- Step 3: Slot Recommendations (Dispatch: {dispatch_point}) ---")
    recommendations_df = recommend_slots(
        products_df=products_df,
        locations_df=locations_df,
        demand_df=demand_df,
        dispatch_point=dispatch_point,
        output_path=str(out_path / "slot_recommendations.csv"),
        graph=warehouse_graph,
        dispatch_node=dispatch_node,
    )

    # 4. Baseline routes
    logger.info("\n--- Step 4: Baseline Pick-Path Calculation ---")
    baseline_routes_df = calculate_baseline_routes(
        order_lines_df=order_lines_df,
        products_df=products_df,
        locations_df=locations_df,
        dispatch_point=dispatch_point,
        walking_speed=walking_speed,
        pick_handling_time=pick_handling_time,
        output_path=str(out_path / "baseline_routes.csv"),
        graph=warehouse_graph,
        dispatch_node=dispatch_node,
    )

    # 5. Optimized routes (Nearest Neighbor)
    logger.info("\n--- Step 5: Optimized Pick-Path Calculation (Nearest Neighbor) ---")
    # For initial route calculation, we optimize path with current assignments.
    # Note: proposed slot changes can also be applied via overrides when approved.
    optimized_routes_df = calculate_optimized_routes(
        order_lines_df=order_lines_df,
        products_df=products_df,
        locations_df=locations_df,
        dispatch_point=dispatch_point,
        walking_speed=walking_speed,
        pick_handling_time=pick_handling_time,
        output_path=str(out_path / "optimized_routes.csv"),
        graph=warehouse_graph,
        dispatch_node=dispatch_node,
    )

    # 6. Route comparison
    logger.info("\n--- Step 6: Route Performance Comparison ---")
    comparison_df = compare_routes(
        baseline_df=baseline_routes_df,
        optimized_df=optimized_routes_df,
        output_path=str(out_path / "route_comparison.csv"),
    )

    # 7. Compatibility validation check (Demonstrate constraint enforcement)
    logger.info("\n--- Step 7: Constraint Validation & Edge Case Demonstration ---")
    # Valid candidate test
    v_ok, msg_ok = validate_slot_assignment(
        sku_id="SKU006",  # USB Hub (Accessories, Req_Cap: 12)
        target_location_id="E01",  # Empty, Cap: 20, Allowed: ACCESSORIES
        products_df=products_df,
        locations_df=locations_df,
    )
    logger.info(f"Valid Slot Test (SKU006 -> E01): is_valid={v_ok} | {msg_ok}")

    # Category mismatch violation test
    v_cat, msg_cat = validate_slot_assignment(
        sku_id="SKU001",  # Laptop (Computing)
        target_location_id="E01",  # Allowed: ACCESSORIES only
        products_df=products_df,
        locations_df=locations_df,
    )
    logger.info(f"Category Violation Test (SKU001 -> E01): is_valid={v_cat} | {msg_cat}")

    # Capacity violation test
    v_cap, msg_cap = validate_slot_assignment(
        sku_id="SKU002",  # Tablet (Required_Capacity: 18)
        target_location_id="E05",  # Empty, but Capacity: 10
        products_df=products_df,
        locations_df=locations_df,
    )
    logger.info(f"Capacity Violation Test (SKU002 -> E05): is_valid={v_cap} | {msg_cap}")

    # Occupied location violation test
    v_occ, msg_occ = validate_slot_assignment(
        sku_id="SKU002",
        target_location_id="A01",  # Currently OCCUPIED
        products_df=products_df,
        locations_df=locations_df,
    )
    logger.info(f"Occupied Violation Test (SKU002 -> A01): is_valid={v_occ} | {msg_occ}")

    # 8. Replenishment alerts
    logger.info("\n--- Step 8: Replenishment Alerts ---")
    replenishment_df = check_replenishment_alerts(
        inventory_df=inventory_df,
        products_df=products_df,
        output_path=str(out_path / "replenishment_alerts.csv"),
    )

    # 9. Snowflake synchronization (if configured)
    logger.info("\n--- Step 9: Snowflake Result Synchronization ---")
    sf_sync = SnowflakeSync()
    if sf_sync.configured:
        logger.info("Snowflake credentials detected. Syncing results to Snowflake...")
        sf_sync.sync_results(
            slot_recs_df=recommendations_df,
            route_comparison_df=comparison_df,
            baseline_routes_df=baseline_routes_df,
            optimized_routes_df=optimized_routes_df,
            replenishment_df=replenishment_df,
        )
    else:
        logger.info(
            f"Snowflake sync skipped: {sf_sync.status_message} "
            f"(SQL schema scripts ready in sql/ for manual or automated pipeline execution)."
        )

    # 10. Summary Report
    logger.info("\n" + "=" * 70)
    logger.info("OPTIMIZATION ENGINE EXECUTION SUMMARY")
    logger.info("=" * 70)
    logger.info(f"Total Products Processed: {len(products_df)}")
    logger.info(f"Total Warehouse Locations: {len(locations_df)}")
    logger.info(f"Total Orders Evaluated: {len(baseline_routes_df)}")

    rec_status_counts = recommendations_df["Recommendation_Status"].value_counts().to_dict()
    logger.info(f"Slot Recommendations: {rec_status_counts}")

    avg_baseline_dist = baseline_routes_df["Total_Distance"].mean()
    avg_opt_dist = optimized_routes_df["Total_Distance"].mean()
    avg_reduction = comparison_df["Pct_Distance_Reduction"].mean()
    worse_cases = comparison_df[comparison_df["Route_Status"] == "WORSE"]

    logger.info(f"Average Baseline Route Distance: {avg_baseline_dist:.2f} units")
    logger.info(f"Average Optimized Route Distance: {avg_opt_dist:.2f} units")
    logger.info(f"Mean Distance Reduction: {avg_reduction:.2f}%")
    logger.info(f"Orders where Nearest Neighbor was Worse: {len(worse_cases)} / {len(comparison_df)}")

    if not worse_cases.empty:
        logger.info("Honest Evaluation of Suboptimal Heuristic Cases:")
        for _, w in worse_cases.iterrows():
            logger.info(
                f"  - Order {w['Order_ID']}: Baseline={w['Baseline_Distance']:.2f}, "
                f"Optimized={w['Optimized_Distance']:.2f} (WORSE by {abs(w['Distance_Saved']):.2f} units / {abs(w['Pct_Distance_Reduction']):.1f}%)"
            )

    logger.info(f"Inventory Replenishment Alerts: {len(replenishment_df)} items triggered.")
    logger.info("All output files successfully generated in 'outputs/' folder.")
    logger.info("=" * 70)


def main():
    try:
        run_pipeline()
    except Exception as e:
        logger.error(f"Fatal error in optimization pipeline: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()

