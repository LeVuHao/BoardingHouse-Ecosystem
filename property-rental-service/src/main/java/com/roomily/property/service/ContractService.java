package com.roomily.property.service;

import com.roomily.common.exception.ResourceNotFoundException;
import com.roomily.property.dto.response.ContractResponse;
import com.roomily.property.repository.ContractRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;

    /**
     * [HUY] User xem hợp đồng của mình
     */
    public List<ContractResponse> getMyContracts(Long userId) {
        return contractRepository.findByUserId(userId).stream()
                .map(ContractResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * [HUY] Landlord xem hợp đồng thuộc khu trọ của mình
     */
    public List<ContractResponse> getLandlordContracts(Long landlordId) {
        return contractRepository.findByLandlordId(landlordId).stream()
                .map(ContractResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Xem chi tiết một hợp đồng
     */
    public ContractResponse getContractDetail(Long contractId) {
        return contractRepository.findById(contractId)
                .map(ContractResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng"));
    }
}
