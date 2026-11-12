package com.cap12.warehouse;

import com.cap12.warehouse.dto.AnalyticsDto;
import com.cap12.warehouse.dto.ApprovalResponseDto;
import com.cap12.warehouse.dto.DemandItemDto;
import com.cap12.warehouse.model.Product;
import com.cap12.warehouse.model.ReplenishmentAlert;
import com.cap12.warehouse.model.RouteResult;
import com.cap12.warehouse.model.SlotRecommendation;
import com.cap12.warehouse.service.AnalyticsService;
import com.cap12.warehouse.service.DemandService;
import com.cap12.warehouse.service.ProductService;
import com.cap12.warehouse.service.ReplenishmentService;
import com.cap12.warehouse.service.RouteService;
import com.cap12.warehouse.service.SlotService;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class WarehouseApplicationTests {

    @Autowired
    private ProductService productService;

    @Autowired
    private DemandService demandService;

    @Autowired
    private SlotService slotService;

    @Autowired
    private RouteService routeService;

    @Autowired
    private ReplenishmentService replenishmentService;

    @Autowired
    private AnalyticsService analyticsService;

    @Test
    @Order(1)
    void contextLoads() {
        assertNotNull(productService);
        assertNotNull(slotService);
        assertNotNull(analyticsService);
    }

    @Test
    @Order(2)
    void testGetAllProducts() {
        List<Product> products = productService.getAllProducts();
        assertEquals(30, products.size(), "Should load exactly 30 products");
        assertTrue(products.stream().anyMatch(p -> "SKU001".equals(p.skuId())));
    }

    @Test
    @Order(3)
    void testDemandClassification() {
        List<DemandItemDto> demand = demandService.getDemandClassification();
        assertEquals(30, demand.size(), "Demand items count should be 30");

        long fastCount = demand.stream().filter(d -> "Fast".equalsIgnoreCase(d.demandClass())).count();
        long mediumCount = demand.stream().filter(d -> "Medium".equalsIgnoreCase(d.demandClass())).count();
        long slowCount = demand.stream().filter(d -> "Slow".equalsIgnoreCase(d.demandClass())).count();

        assertEquals(10, fastCount, "Should have 10 Fast SKUs");
        assertEquals(10, mediumCount, "Should have 10 Medium SKUs");
        assertEquals(10, slowCount, "Should have 10 Slow SKUs");
    }

    @Test
    @Order(4)
    void testGetSlotRecommendations() {
        List<SlotRecommendation> recs = slotService.getRecommendations();
        assertEquals(30, recs.size(), "Should have 30 slot recommendations");

        long recommended = recs.stream().filter(r -> "RECOMMENDED".equalsIgnoreCase(r.recommendationStatus())).count();
        long noLocation = recs.stream().filter(r -> "NO_FEASIBLE_LOCATION".equalsIgnoreCase(r.recommendationStatus())).count();

        assertTrue(recommended > 0, "Should have recommended slots");
        assertTrue(noLocation > 0, "Should have products with NO_FEASIBLE_LOCATION");
    }

    @Test
    @Order(5)
    void testSupervisorApprovalTransaction() {
        // Find first RECOMMENDED item
        List<SlotRecommendation> recs = slotService.getRecommendations();
        SlotRecommendation rec = recs.stream()
                .filter(r -> "RECOMMENDED".equalsIgnoreCase(r.recommendationStatus()))
                .findFirst()
                .orElseThrow();

        String recId = rec.recommendationId();
        String targetLoc = rec.recommendedLocation();

        // Execute approval
        ApprovalResponseDto response = slotService.approveRecommendation(recId);
        assertTrue(response.success());
        assertEquals("APPROVED", response.updatedStatus());
        assertEquals(targetLoc, response.assignedLocation());

        // Verify that trying to approve the same recommendation again throws IllegalStateException
        assertThrows(IllegalStateException.class, () -> slotService.approveRecommendation(recId));
    }

    @Test
    @Order(6)
    void testSupervisorRejection() {
        // Find a different RECOMMENDED item to reject
        List<SlotRecommendation> recs = slotService.getRecommendations();
        SlotRecommendation rec = recs.stream()
                .filter(r -> "RECOMMENDED".equalsIgnoreCase(r.recommendationStatus()))
                .findFirst()
                .orElseThrow();

        String recId = rec.recommendationId();
        ApprovalResponseDto response = slotService.rejectRecommendation(recId);
        assertTrue(response.success());
        assertEquals("REJECTED", response.updatedStatus());
    }

    @Test
    @Order(7)
    void testRouteResults() {
        List<RouteResult> routes = routeService.getAllRoutes();
        assertEquals(50, routes.size(), "Should have 50 route evaluations");

        Optional<RouteResult> ord1 = routeService.getRouteByOrderId("ORD001");
        assertTrue(ord1.isPresent(), "ORD001 should be present");

        // Verify that suboptimal route case exists in database
        long worseCount = routes.stream().filter(r -> "WORSE".equalsIgnoreCase(r.routeStatus())).count();
        assertTrue(worseCount > 0, "Honest route evaluation must include orders where NN was worse");
    }

    @Test
    @Order(8)
    void testReplenishmentAlerts() {
        List<ReplenishmentAlert> alerts = replenishmentService.getReplenishmentAlerts();
        assertEquals(6, alerts.size(), "Should identify 6 SKUs requiring replenishment");
        assertTrue(alerts.stream().anyMatch(a -> "OUT_OF_STOCK".equalsIgnoreCase(a.stockStatus())));
    }

    @Test
    @Order(9)
    void testAnalyticsKpiSummary() {
        AnalyticsDto analytics = analyticsService.getWarehouseAnalytics();
        assertEquals(30, analytics.totalProducts());
        assertEquals(40, analytics.totalLocations());
        assertEquals(50, analytics.totalOrders());
        assertTrue(analytics.averageBaselineDistance() > 0);
        assertTrue(analytics.averageOptimizedDistance() > 0);
        assertTrue(analytics.averageDistanceReductionPct() > 0);
        assertTrue(analytics.worseOrdersCount() > 0);
        assertEquals(6, analytics.replenishmentAlertsCount());
    }
}

