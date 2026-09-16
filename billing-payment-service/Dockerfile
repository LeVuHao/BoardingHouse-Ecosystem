FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app

COPY pom.xml ./
COPY common/pom.xml common/
COPY common/src common/src/
COPY billing-payment-service/pom.xml billing-payment-service/
COPY billing-payment-service/src billing-payment-service/src/

RUN mkdir -p eureka-server api-gateway auth-service property-rental-service notification-service
COPY eureka-server/pom.xml eureka-server/
COPY api-gateway/pom.xml api-gateway/
COPY auth-service/pom.xml auth-service/
COPY property-rental-service/pom.xml property-rental-service/
COPY notification-service/pom.xml notification-service/

RUN mvn -pl common,billing-payment-service -am package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/billing-payment-service/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
