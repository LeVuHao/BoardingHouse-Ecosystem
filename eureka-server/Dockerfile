# Stage 1: Build với toàn bộ source
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app

# Copy toàn bộ project (parent pom khai báo tất cả module)
COPY pom.xml ./
COPY common/pom.xml common/
COPY common/src common/src/
COPY eureka-server/pom.xml eureka-server/
COPY eureka-server/src eureka-server/src/

# Tạo folder rỗng cho các module khác (tránh lỗi "module does not exist")
RUN mkdir -p api-gateway auth-service property-rental-service billing-payment-service notification-service
COPY api-gateway/pom.xml api-gateway/
COPY auth-service/pom.xml auth-service/
COPY property-rental-service/pom.xml property-rental-service/
COPY billing-payment-service/pom.xml billing-payment-service/
COPY notification-service/pom.xml notification-service/

# Build chỉ module cần thiết
RUN mvn -pl common,eureka-server -am package -DskipTests

# Stage 2: Runtime image nhỏ gọn
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/eureka-server/target/*.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]
