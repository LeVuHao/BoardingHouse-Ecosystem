FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app

COPY pom.xml ./
COPY common/pom.xml common/
COPY common/src common/src/
COPY notification-service/pom.xml notification-service/
COPY notification-service/src notification-service/src/

RUN mkdir -p eureka-server api-gateway auth-service property-rental-service billing-payment-service
COPY eureka-server/pom.xml eureka-server/
COPY api-gateway/pom.xml api-gateway/
COPY auth-service/pom.xml auth-service/
COPY property-rental-service/pom.xml property-rental-service/
COPY billing-payment-service/pom.xml billing-payment-service/

RUN mvn -pl common,notification-service -am package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/notification-service/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
