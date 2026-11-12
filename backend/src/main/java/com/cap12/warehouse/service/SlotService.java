package com.cap12.warehouse.service;

import com.cap12.warehouse.dto.ApprovalResponseDto;
import com.cap12.warehouse.model.Product;
import com.cap12.warehouse.model.SlotRecommendation;
import com.cap12.warehouse.model.WarehouseLocation;
import com.cap12.warehouse.repository.LocationRepository;
import com.cap12.warehouse.repository.ProductRepository;
import com.cap12.warehouse.repository.SlotRecommendationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SlotService {

    private final SlotRecommendationRepository recommendationRepository;
    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;

    public SlotService(
            SlotRecommendationRepository recommendationRepository,
            ProductRepository productRepository,
            LocationRepository locationRepository
    ) {
        this.recommendationRepository = recommendationRepository;
        this.productRepository = productRepository;
        this.locationRepository = locationRepository;
    }

    public List<SlotRecommendation> getRecommendations() {
        return recommendationRepository.findAll();
    }

    @Transactional
    public ApprovalResponseDto approveRecommendation(String recommendationId) {
        SlotRecommendation rec = recommendationRepository.findById(recommendationId)
                .orElseThrow(() -> new IllegalArgumentException("Recommendation not found with ID: " + recommendationId));

        if (!"RECOMMENDED".equalsIgnoreCase(rec.recommendationStatus())) {
            throw new IllegalStateException("Cannot approve recommendation in status: " + rec.recommendationStatus());
        }

        String targetLocId = rec.recommendedLocation();
        if (targetLocId == null || "NONE".equalsIgnoreCase(targetLocId)) {
            throw new IllegalStateException("Recommendation has no feasible target location to assign.");
        }

        // Validate target location availability
        WarehouseLocation targetLoc = locationRepository.findByLocationId(targetLocId)
                .orElseThrow(() -> new IllegalArgumentException("Target location not found: " + targetLocId));

        if (!"EMPTY".equalsIgnoreCase(targetLoc.status())) {
            throw new IllegalStateException("Conflict: Target location " + targetLocId + " is no longer EMPTY (Status: " + targetLoc.status() + "). Approval blocked to prevent duplicate assignment.");
        }

        Product product = productRepository.findBySkuId(rec.skuId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + rec.skuId()));

        String oldLocId = product.currentLocation();

        // 1. Update product's current location
        productRepository.updateLocation(product.skuId(), targetLocId);

        // 2. Mark old location as EMPTY
        if (oldLocId != null && !oldLocId.isBlank()) {
            locationRepository.updateStatus(oldLocId, "EMPTY");
        }

        // 3. Mark new location as OCCUPIED
        locationRepository.updateStatus(targetLocId, "OCCUPIED");

        // 4. Record recommendation status as APPROVED
        recommendationRepository.updateStatus(recommendationId, "APPROVED");

        return new ApprovalResponseDto(
                true,
                "Recommendation " + recommendationId + " approved. Product " + product.skuId() + " moved from " + oldLocId + " to " + targetLocId + ".",
                recommendationId,
                product.skuId(),
                oldLocId,
                targetLocId,
                "APPROVED"
        );
    }

    @Transactional
    public ApprovalResponseDto rejectRecommendation(String recommendationId) {
        SlotRecommendation rec = recommendationRepository.findById(recommendationId)
                .orElseThrow(() -> new IllegalArgumentException("Recommendation not found with ID: " + recommendationId));

        if ("APPROVED".equalsIgnoreCase(rec.recommendationStatus())) {
            throw new IllegalStateException("Cannot reject an already APPROVED recommendation.");
        }

        // Rejecting preserves the original product assignment and updates status to REJECTED
        recommendationRepository.updateStatus(recommendationId, "REJECTED");

        return new ApprovalResponseDto(
                true,
                "Recommendation " + recommendationId + " rejected. Product " + rec.skuId() + " remains at " + rec.currentLocation() + ".",
                recommendationId,
                rec.skuId(),
                rec.currentLocation(),
                rec.currentLocation(),
                "REJECTED"
        );
    }
}

