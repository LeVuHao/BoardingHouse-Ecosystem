package com.roomily.notification.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String INVOICE_CREATED_QUEUE = "invoice.created";
    public static final String RENTAL_APPROVED_QUEUE = "rental.approved";
    public static final String JOIN_APPROVED_QUEUE = "join.approved";

    public static final String EXCHANGE = "roomily.events";
    public static final String NOTIFICATION_QUEUE = "roomily.notifications.queue";

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public Queue invoiceCreatedQueue() {
        return new Queue(INVOICE_CREATED_QUEUE, true);
    }

    @Bean
    public Queue rentalApprovedQueue() {
        return new Queue(RENTAL_APPROVED_QUEUE, true);
    }

    @Bean
    public Queue joinApprovedQueue() {
        return new Queue(JOIN_APPROVED_QUEUE, true);
    }

    @Bean
    public TopicExchange eventExchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Queue notificationQueue() {
        return new Queue(NOTIFICATION_QUEUE, true);
    }

    @Bean
    public Binding notificationBinding(Queue notificationQueue, TopicExchange eventExchange) {
        return BindingBuilder.bind(notificationQueue).to(eventExchange).with("*.#");
    }
}

