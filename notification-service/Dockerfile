FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml ./
COPY common/pom.xml common/
COPY common/src common/src/
COPY notification-service/pom.xml notification-service/
COPY notification-service/src notification-service/src/
RUN mvn -pl common,notification-service -am package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/notification-service/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
