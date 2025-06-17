#!/bin/bash
set -eo pipefail

# Configuration from environment variables
REDIS_URL="${REDIS_URL}"
REDIS_TOKEN="${REDIS_TOKEN}"
BACKEND_API="${BACKEND_API}"
API_KEY="${API_KEY}"
R2_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
R2_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
R2_ENDPOINT="${R2_ENDPOINT}"
R2_BUCKET="${R2_BUCKET}"
S3_BUCKET="${S3_BUCKET}"
S3_KEY="${S3_KEY}"
USER_ID="${USER_ID}"
OUTPUT_BASE="${OUTPUT_BASE}"
OUTPUT_DIR="uploads/${USER_ID}/${OUTPUT_BASE}"

# Generate unique processing ID for temporary files and tracking
PROCESS_ID=$(date +%s%N | sha1sum | head -c 8)
LOG_FILE="/tmp/transcode-${PROCESS_ID}.log"
REDIS_KEY="transcode:${OUTPUT_BASE}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %T')] $1" | tee -a "$LOG_FILE"
}

update_redis() {
    local stage=$1
    local progress=$2
    local status=${3:-"processing"}  # Default status is "processing"
    
    local payload
    payload=$(jq -n \
        --arg stage "$stage" \
        --arg progress "$progress" \
        --arg status "$status" \
        '{stage: $stage, progress: $progress, status: $status}')
    
    # URL encode the JSON payload
    payload=$(echo "$payload" | jq -r @uri)
    
    curl -s -X POST "${REDIS_URL}/set/${REDIS_KEY}/${payload}?EX=600" \
        -H "Authorization: Bearer ${REDIS_TOKEN}" \
        -o /dev/null >> "$LOG_FILE" 2>&1
}

# Update backend API status
update_api_status() {
    local status=$1
    local payload
    payload=$(jq -n \
        --arg s3Key "$S3_KEY" \
        --arg status "$status" \
        '{s3Key: $s3Key, status: $status}')
    
    curl -s -X POST "$BACKEND_API" \
        -H "Content-Type: application/json" \
        -H "X-API-Key: $API_KEY" \
        -d "$payload" \
        -o /dev/null >> "$LOG_FILE" 2>&1
}

get_current_stage() {
    local response
    response=$(curl -s -H "Authorization: Bearer ${REDIS_TOKEN}" "${REDIS_URL}/get/${REDIS_KEY}")
    
    # {"result":"{\"stage\":\"uploading\",\"progress\":\"100\",\"status\":\"success\"}"}

    # Parse the stage, with fallback
    echo "$response" | jq -r '.result | fromjson | .stage' 2>/dev/null || echo "unknown"
}

# Cleanup function
cleanup() {
    exit_status=$?
    if [ $exit_status -ne 0 ]; then
        log "Error occurred - updating status to failed"
        update_redis "$(get_current_stage)" "100" "failed"
        update_api_status "failed"
    fi
    
    log "Cleaning up temporary files"
    rm -rf "/tmp/${PROCESS_ID}" || true
    rm -f "${RCLONE_CONF}" || true
}
trap cleanup EXIT


# Check if input video has audio
check_audio() {
    local input_file="$1"
    ffprobe -i "$input_file" -show_streams -select_streams a -loglevel error 2>/dev/null | grep -q "codec_type=audio"
    return $?
}

# Get video duration using ffprobe
get_duration() {
    local input_file="$1"
    ffprobe -v error -show_entries format=duration \
        -of default=noprint_wrappers=1:nokey=1 "$input_file"
}

# Monitor FFmpeg progress
monitor_progress() {
    while read -r line; do
        if [[ $line =~ time=([0-9:.]+) ]]; then
            current_time=$(echo "${BASH_REMATCH[1]}" | awk -F: '{ print $1*3600 + $2*60 + $3 }')
            progress=$(awk "BEGIN { printf \"%.0f\", ($current_time / $DURATION) * 100 }")
            
            if [ "$progress" -gt 99 ]; then
                progress=99
            fi
            
            log "Transcoding progress: ${progress}%"
            update_redis "transcoding" "$progress"
        fi
    done
}


# Main execution
main() {
    log "Starting transcoding process ${PROCESS_ID}"
    
    
    WORK_DIR="/tmp/${PROCESS_ID}"
    VIDEO_FILE="${WORK_DIR}/input.mp4"
    HLS_OUTPUT_DIR="${WORK_DIR}/hls"
    
    mkdir -p "${WORK_DIR}" "${HLS_OUTPUT_DIR}"

    # File handling
    if [ -z "$LOCAL_TEST" ]; then
        log "Downloading from S3: s3://${S3_BUCKET}/${S3_KEY}"
        s5cmd cp "s3://${S3_BUCKET}/${S3_KEY}" "${VIDEO_FILE}"
    else
        log "Using local file: ${LOCAL_VIDEO_FILE}"
        cp "${LOCAL_VIDEO_FILE}" "${VIDEO_FILE}"
    fi

    update_redis "transcoding" "0"

    DURATION=$(get_duration "${VIDEO_FILE}")
    log "Video duration: ${DURATION} seconds"
    
    if check_audio "${VIDEO_FILE}"; then
        log "Video has audio stream - using audio mapping"
        ffmpeg -hide_banner -y -i "${VIDEO_FILE}" \
            -vf "scale=w=-2:h=480" -c:v libx264 -profile:v main -crf 20 -preset faster \
            -c:a aac -ar 48000 -b:a 128k -ac 2 \
            -hls_time 6 -hls_list_size 0 -hls_playlist_type vod \
            -hls_segment_filename "${HLS_OUTPUT_DIR}/480p_%03d.ts" \
            -f hls "${HLS_OUTPUT_DIR}/480p.m3u8" \
            -vf "scale=w=-2:h=720" -c:v libx264 -profile:v main -crf 20 -preset faster \
            -c:a aac -ar 48000 -b:a 128k -ac 2 \
            -hls_time 6 -hls_list_size 0 -hls_playlist_type vod \
            -hls_segment_filename "${HLS_OUTPUT_DIR}/720p_%03d.ts" \
            -f hls "${HLS_OUTPUT_DIR}/720p.m3u8" 2>&1 | tee -a "$LOG_FILE" | monitor_progress
    else
        log "Video has no audio stream - using video-only mapping"
        ffmpeg -hide_banner -y -i "${VIDEO_FILE}" \
            -vf "scale=w=-2:h=480" -c:v libx264 -profile:v main -crf 20 -preset faster \
            -hls_time 6 -hls_list_size 0 -hls_playlist_type vod \
            -hls_segment_filename "${HLS_OUTPUT_DIR}/480p_%03d.ts" \
            -f hls "${HLS_OUTPUT_DIR}/480p.m3u8" \
            -vf "scale=w=-2:h=720" -c:v libx264 -profile:v main -crf 20 -preset faster \
            -hls_time 6 -hls_list_size 0 -hls_playlist_type vod \
            -hls_segment_filename "${HLS_OUTPUT_DIR}/720p_%03d.ts" \
            -f hls "${HLS_OUTPUT_DIR}/720p.m3u8" 2>&1 | tee -a "$LOG_FILE" | monitor_progress
    fi
    
    
    
    printf "#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720\n\
720p.m3u8\n\
#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=854x480\n\
    480p.m3u8\n" > "${HLS_OUTPUT_DIR}/master.m3u8"
    
    log "Transcoding completed. Uploading to R2"
    
    RCLONE_CONF="/tmp/rclone-${PROCESS_ID}.conf"
    printf "[myr2]\n\
type = s3\n\
provider = Cloudflare\n\
access_key_id = ${R2_ACCESS_KEY_ID}\n\
secret_access_key = ${R2_SECRET_ACCESS_KEY}\n\
    endpoint = ${R2_ENDPOINT}\n" > "${RCLONE_CONF}"

    # Upload to R2
    update_redis "uploading" "0"


    AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}" \
    AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}" \
    AWS_REGION=auto \
    s5cmd --endpoint-url "${R2_ENDPOINT}" \
    --numworkers 20 \
    --retry-count 5 \
    cp --concurrency 20 "${HLS_OUTPUT_DIR}/*" "s3://${R2_BUCKET}/${OUTPUT_DIR}/"

      
    update_redis "uploading" "100" "success"
    update_api_status "success"

    log "Process ${PROCESS_ID} completed successfully"
}

main
