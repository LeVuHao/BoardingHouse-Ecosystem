# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app

# Copy parent pom
COPY pom.xml ./

# Copy common module
COPY common/pom.xml common/
COPY common/src common/src/

# Copy this service
COPY eureka-server/pom.xml eureka-server/
COPY eureka-server/src eureka-server/src/

# Build (skip tests for speed)
RUN mvn -pl common,eureka-server -am package -DskipTests

# Stage 2: Run
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/eureka-server/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
