FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml ./
COPY common/pom.xml common/
COPY common/src common/src/
COPY api-gateway/pom.xml api-gateway/
COPY api-gateway/src api-gateway/src/
RUN mvn -pl common,api-gateway -am package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/api-gateway/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
