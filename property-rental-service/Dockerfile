FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app

COPY pom.xml ./
COPY common/pom.xml common/
COPY common/src common/src/
COPY property-rental-service/pom.xml property-rental-service/
COPY property-rental-service/src property-rental-service/src/

RUN mkdir -p eureka-server api-gateway auth-service billing-payment-service notification-service
COPY eureka-server/pom.xml eureka-server/
COPY api-gateway/pom.xml api-gateway/
COPY auth-service/pom.xml auth-service/
COPY billing-payment-service/pom.xml billing-payment-service/
COPY notification-service/pom.xml notification-service/

RUN mvn -pl common,property-rental-service -am package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/property-rental-service/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
