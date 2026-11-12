package com.cap12.warehouse.service;

import com.cap12.warehouse.model.WarehouseLocation;
import com.cap12.warehouse.repository.LocationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LocationService {

    private final LocationRepository locationRepository;

    public LocationService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    public List<WarehouseLocation> getAllLocations() {
        return locationRepository.findAll();
    }
}

