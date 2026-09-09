FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml ./
COPY common/pom.xml common/
COPY common/src common/src/
COPY auth-service/pom.xml auth-service/
COPY auth-service/src auth-service/src/
RUN mvn -pl common,auth-service -am package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/auth-service/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
