package com.cap12.warehouse.repository;

import com.cap12.warehouse.dto.DemandItemDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class DemandRepository {

    private final JdbcTemplate jdbcTemplate;

    public DemandRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<DemandItemDto> rowMapper = (rs, rowNum) -> new DemandItemDto(
            rs.getString("SKU_ID"),
            rs.getString("PRODUCT_NAME"),
            rs.getString("CATEGORY"),
            rs.getString("CURRENT_LOCATION"),
            rs.getInt("ORDER_FREQUENCY"),
            rs.getInt("TOTAL_QUANTITY"),
            rs.getString("DEMAND_CLASS")
    );

    public List<DemandItemDto> findDemandAnalysis() {
        String sql = """
            SELECT
                p.SKU_ID,
                p.PRODUCT_NAME,
                p.CATEGORY,
                p.CURRENT_LOCATION,
                COUNT(o.ORDER_LINE_ID) AS ORDER_FREQUENCY,
                COALESCE(SUM(o.QUANTITY), 0) AS TOTAL_QUANTITY,
                CASE
                    WHEN COUNT(o.ORDER_LINE_ID) >= 10 THEN 'Fast'
                    WHEN COUNT(o.ORDER_LINE_ID) >= 4 THEN 'Medium'
                    ELSE 'Slow'
                END AS DEMAND_CLASS
            FROM PRODUCTS p
            LEFT JOIN ORDER_LINES o ON p.SKU_ID = o.SKU_ID
            GROUP BY p.SKU_ID, p.PRODUCT_NAME, p.CATEGORY, p.CURRENT_LOCATION
            ORDER BY ORDER_FREQUENCY DESC, TOTAL_QUANTITY DESC
        """;
        return jdbcTemplate.query(sql, rowMapper);
    }
}

