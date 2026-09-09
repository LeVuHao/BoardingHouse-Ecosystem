FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml ./
COPY common/pom.xml common/
COPY common/src common/src/
COPY property-rental-service/pom.xml property-rental-service/
COPY property-rental-service/src property-rental-service/src/
RUN mvn -pl common,property-rental-service -am package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/property-rental-service/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
