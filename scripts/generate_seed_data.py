"""
Generate frontend/public/seed_data.js containing the project's cleaned datasets and optimization results.
This allows the React UI to run immediately in standalone mode as well as live via Spring Boot REST APIs.
"""
import json
import os
import pandas as pd

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cleaned_dir = os.path.join(base_dir, 'datasets', 'cleaned')
outputs_dir = os.path.join(base_dir, 'outputs')
public_dir = os.path.join(base_dir, 'frontend', 'public')

os.makedirs(public_dir, exist_ok=True)

# 1. Products
df_prod = pd.read_csv(os.path.join(cleaned_dir, 'products_clean.csv'))
products = []
for _, row in df_prod.iterrows():
    products.append({
        "skuId": str(row['SKU_ID']),
        "productName": str(row['Product_Name']),
        "category": str(row['Category']),
        "requiredCapacity": int(row['Required_Capacity']),
        "currentLocation": str(row['Current_Location'])
    })

# 2. Locations
df_loc = pd.read_csv(os.path.join(cleaned_dir, 'warehouse_locations_clean.csv'))
locations = []
for _, row in df_loc.iterrows():
    locations.append({
        "locationId": str(row['Location_ID']),
        "aisle": str(row['Aisle']),
        "x": float(row['X']),
        "y": float(row['Y']),
        "capacity": int(row['Capacity']),
        "status": str(row['Status']),
        "allowedCategory": str(row['Allowed_Category'])
    })

# 3. Demand
df_dem = pd.read_csv(os.path.join(outputs_dir, 'demand_analysis.csv'))
demand = []
for _, row in df_dem.iterrows():
    demand.append({
        "skuId": str(row['SKU_ID']),
        "productName": str(row['Product_Name']),
        "category": str(row['Category']),
        "orderFrequency": int(row['Order_Frequency']),
        "totalQuantity": int(row['Total_Quantity']),
        "demandClass": str(row['Demand_Class'])
    })

# 4. Slot recommendations
df_recs = pd.read_csv(os.path.join(outputs_dir, 'slot_recommendations.csv'))
recs = []
for _, row in df_recs.iterrows():
    recs.append({
        "recommendationId": str(row['Recommendation_ID']),
        "skuId": str(row['SKU_ID']),
        "productName": str(row['Product_Name']),
        "demandClass": str(row['Demand_Class']),
        "currentLocation": str(row['Current_Location']),
        "recommendedLocation": str(row['Recommended_Location']),
        "distance": float(row['Distance']),
        "recommendationStatus": str(row['Recommendation_Status']),
        "reason": str(row['Reason'])
    })

# 5. Routes
df_routes = pd.read_csv(os.path.join(outputs_dir, 'route_comparison.csv'))
df_base = pd.read_csv(os.path.join(outputs_dir, 'baseline_routes.csv')).set_index('Order_ID')
df_opt = pd.read_csv(os.path.join(outputs_dir, 'optimized_routes.csv')).set_index('Order_ID')

routes = []
for _, row in df_routes.iterrows():
    oid = str(row['Order_ID'])
    base_seq = str(df_base.loc[oid, 'Route_Sequence']) if oid in df_base.index else ''
    opt_seq = str(df_opt.loc[oid, 'Route_Sequence']) if oid in df_opt.index else ''
    routes.append({
        "orderId": oid,
        "baselineRouteSequence": base_seq,
        "optimizedRouteSequence": opt_seq,
        "baselineDistance": float(row['Baseline_Distance']),
        "optimizedDistance": float(row['Optimized_Distance']),
        "distanceSaved": float(row['Distance_Saved']),
        "pctDistanceReduction": float(row['Pct_Distance_Reduction']),
        "baselineTimeSec": float(row['Baseline_Time_Sec']),
        "optimizedTimeSec": float(row['Optimized_Time_Sec']),
        "timeSavedSec": float(row['Time_Saved_Sec']),
        "routeStatus": str(row['Route_Status']),
        "notes": str(row['Notes'])
    })

# 6. Replenishment
df_rep = pd.read_csv(os.path.join(outputs_dir, 'replenishment_alerts.csv'))
replenishment = []
for _, row in df_rep.iterrows():
    replenishment.append({
        "skuId": str(row['SKU_ID']),
        "productName": str(row['Product_Name']),
        "currentStock": int(row['Current_Stock']),
        "minimumStock": int(row['Minimum_Stock']),
        "stockStatus": str(row['Stock_Status']),
        "replenishmentRequired": str(row['Replenishment_Required'])
    })

# 7. Analytics
total_products = len(products)
total_locations = len(locations)
occupied = sum(1 for l in locations if l['status'] == 'OCCUPIED')
empty = sum(1 for l in locations if l['status'] == 'EMPTY')
fast = sum(1 for d in demand if d['demandClass'] == 'FAST')
med = sum(1 for d in demand if d['demandClass'] == 'MEDIUM')
slow = sum(1 for d in demand if d['demandClass'] == 'SLOW')
total_orders = len(routes)
avg_base_dist = round(sum(r['baselineDistance'] for r in routes) / total_orders, 2)
avg_opt_dist = round(sum(r['optimizedDistance'] for r in routes) / total_orders, 2)
total_saved = round(sum(r['distanceSaved'] for r in routes), 2)
avg_pct_reduction = round(sum(r['pctDistanceReduction'] for r in routes) / total_orders, 2)
improved_cnt = sum(1 for r in routes if r['routeStatus'] == 'IMPROVED')
worse_cnt = sum(1 for r in routes if r['routeStatus'] == 'WORSE')
ident_cnt = sum(1 for r in routes if r['routeStatus'] == 'IDENTICAL')
rec_cnt = sum(1 for r in recs if r['recommendationStatus'] == 'RECOMMENDED')
app_cnt = sum(1 for r in recs if r['recommendationStatus'] == 'APPROVED')
rej_cnt = sum(1 for r in recs if r['recommendationStatus'] == 'REJECTED')

analytics = {
    "totalProducts": total_products,
    "totalLocations": total_locations,
    "occupiedLocations": occupied,
    "emptyLocations": empty,
    "fastProducts": fast,
    "mediumProducts": med,
    "slowProducts": slow,
    "totalOrders": total_orders,
    "averageBaselineDistance": avg_base_dist,
    "averageOptimizedDistance": avg_opt_dist,
    "totalDistanceSaved": total_saved,
    "averageDistanceReductionPct": avg_pct_reduction,
    "improvedOrdersCount": improved_cnt,
    "worseOrdersCount": worse_cnt,
    "identicalOrdersCount": ident_cnt,
    "replenishmentAlertsCount": len(replenishment),
    "recommendedSlotsCount": rec_cnt,
    "approvedSlotsCount": app_cnt,
    "rejectedSlotsCount": rej_cnt
}

seed_data = {
    "products": products,
    "locations": locations,
    "demand": demand,
    "recommendations": recs,
    "routes": routes,
    "replenishment": replenishment,
    "analytics": analytics
}

out_file = os.path.join(public_dir, 'seed_data.js')
with open(out_file, 'w', encoding='utf-8') as f:
    f.write('window.__SEED_DATA__ = ' + json.dumps(seed_data, indent=2) + ';\n')

print(f"Successfully generated {out_file} ({len(products)} prods, {len(locations)} locs, {len(routes)} routes)")
