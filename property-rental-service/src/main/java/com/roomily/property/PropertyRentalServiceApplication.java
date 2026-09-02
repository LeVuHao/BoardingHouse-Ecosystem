package com.roomily.property;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@ComponentScan(basePackages = {"com.roomily.property", "com.roomily.common"})
public class PropertyRentalServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PropertyRentalServiceApplication.class, args);
    }
}
