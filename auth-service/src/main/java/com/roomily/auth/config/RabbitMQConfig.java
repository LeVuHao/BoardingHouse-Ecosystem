package com.roomily.auth.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String LANDLORD_PAYMENT_QUEUE = "landlord.payment.success.queue";
    public static final String PAYMENT_EXCHANGE = "payment.exchange";
    public static final String LANDLORD_PAYMENT_ROUTING_KEY = "landlord.payment.success";

    @Bean
    public Queue landlordPaymentQueue() {
        return new Queue(LANDLORD_PAYMENT_QUEUE, true);
    }

    @Bean
    public DirectExchange paymentExchange() {
        return new DirectExchange(PAYMENT_EXCHANGE);
    }

    @Bean
    public Binding landlordPaymentBinding(Queue landlordPaymentQueue, DirectExchange paymentExchange) {
        return BindingBuilder.bind(landlordPaymentQueue)
                .to(paymentExchange)
                .with(LANDLORD_PAYMENT_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
