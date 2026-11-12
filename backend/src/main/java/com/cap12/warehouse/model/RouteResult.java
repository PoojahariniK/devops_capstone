package com.cap12.warehouse.model;

public record RouteResult(
    String orderId,
    String baselineRouteSequence,
    String optimizedRouteSequence,
    double baselineDistance,
    double optimizedDistance,
    double distanceSaved,
    double pctDistanceReduction,
    double baselineTimeSec,
    double optimizedTimeSec,
    double timeSavedSec,
    String routeStatus,
    String notes
) {}

