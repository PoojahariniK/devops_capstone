package com.cap12.warehouse.repository;

import com.cap12.warehouse.model.SlotRecommendation;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class SlotRecommendationRepository {

    private final JdbcTemplate jdbcTemplate;

    public SlotRecommendationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<SlotRecommendation> rowMapper = (rs, rowNum) -> new SlotRecommendation(
            rs.getString("RECOMMENDATION_ID"),
            rs.getString("SKU_ID"),
            rs.getString("PRODUCT_NAME"),
            rs.getString("DEMAND_CLASS"),
            rs.getString("CURRENT_LOCATION"),
            rs.getString("RECOMMENDED_LOCATION"),
            rs.getDouble("DISTANCE"),
            rs.getString("RECOMMENDATION_STATUS"),
            rs.getString("REASON")
    );

    public List<SlotRecommendation> findAll() {
        String sql = "SELECT RECOMMENDATION_ID, SKU_ID, PRODUCT_NAME, DEMAND_CLASS, CURRENT_LOCATION, " +
                     "RECOMMENDED_LOCATION, DISTANCE, RECOMMENDATION_STATUS, REASON " +
                     "FROM SLOT_RECOMMENDATIONS ORDER BY RECOMMENDATION_ID";
        return jdbcTemplate.query(sql, rowMapper);
    }

    public Optional<SlotRecommendation> findById(String recommendationId) {
        String sql = "SELECT RECOMMENDATION_ID, SKU_ID, PRODUCT_NAME, DEMAND_CLASS, CURRENT_LOCATION, " +
                     "RECOMMENDED_LOCATION, DISTANCE, RECOMMENDATION_STATUS, REASON " +
                     "FROM SLOT_RECOMMENDATIONS WHERE RECOMMENDATION_ID = ?";
        List<SlotRecommendation> results = jdbcTemplate.query(sql, rowMapper, recommendationId);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public int updateStatus(String recommendationId, String newStatus) {
        String sql = "UPDATE SLOT_RECOMMENDATIONS SET RECOMMENDATION_STATUS = ? WHERE RECOMMENDATION_ID = ?";
        return jdbcTemplate.update(sql, newStatus, recommendationId);
    }
}

