FROM alpine:3.18

RUN apk add --no-cache \
    ffmpeg \
    curl \
    jq \
    ca-certificates \
    bash && \
    curl -L https://github.com/peak/s5cmd/releases/download/v2.2.2/s5cmd_2.2.2_Linux-arm64.tar.gz | \
    tar xz -C /usr/local/bin s5cmd

# Copy the transcoding script
COPY task.sh /usr/local/bin/task.sh
RUN chmod +x /usr/local/bin/task.sh

# Set the working directory
WORKDIR /app

# Run the transcoding script
CMD ["/usr/local/bin/task.sh"]