FROM golang:1.24-alpine AS builder

# Install git and ca-certificates
RUN apk add --no-cache git ca-certificates tzdata

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:latest

# Install ca-certificates and gettext (for envsubst)
RUN apk --no-cache add ca-certificates tzdata gettext

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/main .

# Copy config template
COPY --from=builder /app/config.yaml /root/config.template.yaml

# Create entrypoint script
RUN echo '#!/bin/sh' > /root/entrypoint.sh && \
    echo 'envsubst < /root/config.template.yaml > /root/config.yaml' >> /root/entrypoint.sh && \
    echo 'exec ./main' >> /root/entrypoint.sh && \
    chmod +x /root/entrypoint.sh

# Expose port
EXPOSE 8000

# Run the application
ENTRYPOINT ["/root/entrypoint.sh"]