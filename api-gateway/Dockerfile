FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app

COPY pom.xml ./
COPY common/pom.xml common/
COPY common/src common/src/
COPY api-gateway/pom.xml api-gateway/
COPY api-gateway/src api-gateway/src/

RUN mkdir -p eureka-server auth-service property-rental-service billing-payment-service notification-service
COPY eureka-server/pom.xml eureka-server/
COPY auth-service/pom.xml auth-service/
COPY property-rental-service/pom.xml property-rental-service/
COPY billing-payment-service/pom.xml billing-payment-service/
COPY notification-service/pom.xml notification-service/

RUN mvn -pl common,api-gateway -am package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/api-gateway/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
