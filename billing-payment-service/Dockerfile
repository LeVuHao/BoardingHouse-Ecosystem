FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml ./
COPY common/pom.xml common/
COPY common/src common/src/
COPY billing-payment-service/pom.xml billing-payment-service/
COPY billing-payment-service/src billing-payment-service/src/
RUN mvn -pl common,billing-payment-service -am package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/billing-payment-service/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
