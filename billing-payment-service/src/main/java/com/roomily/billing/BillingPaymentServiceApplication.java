package com.roomily.billing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@ComponentScan(basePackages = {"com.roomily.billing", "com.roomily.common"})
public class BillingPaymentServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(BillingPaymentServiceApplication.class, args);
    }
}
