package com.roomily.billing.soap;

import com.roomily.billing.entity.PaymentTransaction;
import com.roomily.billing.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

@Endpoint
@RequiredArgsConstructor
public class TransactionSoapEndpoint {

    private static final String NAMESPACE_URI = "http://roomily.com/billing/soap";
    private final PaymentTransactionRepository paymentTransactionRepository;

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "GetTransactionStatusRequest")
    @ResponsePayload
    public SoapTypes.GetTransactionStatusResponse getTransactionStatus(
            @RequestPayload SoapTypes.GetTransactionStatusRequest request) {

        SoapTypes.GetTransactionStatusResponse response = new SoapTypes.GetTransactionStatusResponse();
        PaymentTransaction txn = paymentTransactionRepository.findByVnpTxnRef(request.getVnpTxnRef())
                .orElse(null);

        if (txn != null) {
            response.setVnpTxnRef(txn.getVnpTxnRef());
            response.setUserId(txn.getUserId());
            response.setAmount(txn.getAmount());
            response.setTransactionType(txn.getTransactionType());
            response.setStatus(txn.getStatus());
            response.setPaymentMethod(txn.getPaymentMethod());
        } else {
            response.setVnpTxnRef(request.getVnpTxnRef());
            response.setStatus("NOT_FOUND");
        }

        return response;
    }
}
