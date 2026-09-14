FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app

COPY pom.xml ./
COPY common/pom.xml common/
COPY common/src common/src/
COPY auth-service/pom.xml auth-service/
COPY auth-service/src auth-service/src/

RUN mkdir -p eureka-server api-gateway property-rental-service billing-payment-service notification-service
COPY eureka-server/pom.xml eureka-server/
COPY api-gateway/pom.xml api-gateway/
COPY property-rental-service/pom.xml property-rental-service/
COPY billing-payment-service/pom.xml billing-payment-service/
COPY notification-service/pom.xml notification-service/

RUN mvn -pl common,auth-service -am package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/auth-service/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
