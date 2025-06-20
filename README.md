# 🎬 PixelStream Backend

PixelStream is an online video transcoding service that allows users to upload videos and receive a streaming-ready **HLS (HTTP Live Streaming)** URL. This backend handles the entire media processing pipeline—including secure uploads, FFmpeg-based transcoding, Redis progress tracking, and Cloudflare R2 integration.

---

## 🧠 Architecture Overview

![Pixel stream architecutre](https://res.cloudinary.com/dinoawbez/image/upload/v1750433313/pixel-stream-diagram_ovj8o6.png)

PixelStream backend uses a hybrid architecture:

- **S3 → SQS → Lambda**  
  Event-driven pipeline from video upload to job dispatch.

- **ECS Fargate + FFmpeg**  
  Dockerized video processing using shell scripts.

- **Redis + SSE**  
  Real-time progress updates to frontend via Server-Sent Events.

- **Cloudflare R2**  
  Cost-effective object storage for HLS files.

---

## 📁 Codebase Structure

```bash
pixelstream-backend/
├── api/                      # Express server
│   ├── routes/               # REST + SSE endpoints
│   └── controllers/          # Business logic for auth, upload, etc.
│
├── lambda/                   # Background SQS consumer
│   └── index.js              # Listens to SQS and starts ECS tasks
│
├── video-transcoder/         # ECS Fargate image
│   ├── Dockerfile            # FFmpeg + s5cmd + curl toolchain
│   └── task.sh               # Runs FFmpeg, updates progress & saves segments to R2
```

---

---

## 🧩 Services Overview

Here’s a breakdown of the core directories and their responsibilities:

### 📦 `api/` – Backend Server (Express + MongoDB)

This is the main HTTP server for PixelStream.

- 🧑‍💻 Handles **authentication** (`sign up`, `sign in`) with JWT
- 📦 Provides **pre-signed S3 URLs** to clients for uploading videos
- 🔄 Streams real-time transcoding progress using **Server-Sent Events (SSE)** by polling Redis
- 📡 Exposes a webhook (protected by API key) which is called by the ECS Fargate task after successful transcoding
- 🧾 Stores user data and uploaded video metadata in MongoDB (including transcoding status, duration, and final HLS URL)

---

### 🎥 `video-transcoder/` – FFmpeg Fargate Image

This is a lightweight ECS-compatible container image that handles video processing.

- 🐳 Consists of a `Dockerfile` + `task.sh`
- 📂 Tools installed: `ffmpeg`, `s5cmd`, `jq`, `curl` etc.
- 🧠 Workflow inside the task:
  - Downloads the source video from S3 using key
  - Transcodes video into HLS segments (720p and 480p)
  - Periodically updates progress (in %) to Redis
  - Uploads generated segments to Cloudflare R2
  - Triggers the webhook to notify the backend server of completion
  - Deletes original file from S3

---

### 🧬 `lambda/` – Job Dispatcher

This is a Node.js AWS Lambda function responsible for kicking off video processing jobs.

- 🚀 Triggered by **SQS events** (from S3 upload notifications)
- 🔑 Parses SQS message payload to extract S3 key, user ID, etc.
- 🛠 Launches a new **ECS Fargate task** with the appropriate ENV variables

---

## 🛠 Setup & Deployment Guide

This guide will walk you through running PixelStream locally and deploying it to production.

---

### ✅ Prerequisites

- ✅ AWS account (Fargate usage incurs some cost)
- ✅ Cloudflare account with **R2 bucket configured**
  - Enable **R2 Dev Domain**
  - Allow CORS: `*` for GET requests
- ✅ Docker + Docker Compose
- ✅ Redis (use [Upstash](https://upstash.com) for a managed serverless Redis)
- ✅ Node.js v18+
- ✅ MongoDB (cloud)

---

## 📦 Infrastructure Setup (AWS CloudFormation)

PixelStream uses AWS services for video processing. To provision necessary AWS resources (SQS, ECS Cluster, IAM roles, Lambda permissions, etc.), follow the steps below:

1. **Download the CloudFormation template**  
   [cloud-resources.yaml](https://github.com/khaftab/pixelstream-backend/blob/main/cloud-resources.yaml)

2. **Go to AWS Console → CloudFormation → Create Stack**

3. Upload the `cloud-resources.yaml` file.

4. Wait for the stack to be created. Once done, go to the **Outputs** tab and copy the generated secrets and resource ARNs—these will be used in `.env` files for local and Lambda environments.

---

## 🧪 Local Development Setup

### 🔁 Video Transcoder (FFmpeg via ECS-compatible container)

First, ensure the Docker image works locally **before deploying to ECS**.

1. Clone the repo `git clone https://github.com/khaftab/pixelstream-backend.git`

1. Go to the `pixelstream-backend/video-transcoder/` directory

```bash
cd pixelstream-backend/video-transcoder
```

2. Open `docker-compose.local.yaml` and set all required environment variables (the file is self-documented).

3. Build the image:

```bash
docker build -t video-transcoder .
```

4. Run locally to test processing:

```bash
docker-compose -f docker-compose.local.yaml up
```

✅ If successful:

- Console will show `exit code 0`
- Segments will appear in your Cloudflare R2 bucket
- A `.log` file is generated in your current directory (great for debugging)

⚠️ Common error: `exec format error`  
If you see something like `cannot execute binary`, you might be using a binary for the wrong architecture.

- To test locally (on most x86_64 systems), modify the Dockerfile to download this version of `s5cmd`:

```Dockerfile
https://github.com/peak/s5cmd/releases/download/v2.2.2/s5cmd_2.2.2_Linux-64bit.tar.gz
```

- But remember: **change it back to `arm64` before deploying**, since **ECS Fargate is running on `arm64` architecture**.

---

### 🐳 Build Final Fargate-Compatible Image

```bash
docker buildx create --use
docker buildx build --platform linux/arm64 -t <your_ecr_repo>:latest --load .
```

- Replace `<your_ecr_repo>` with your actual ECR repo name.
- Now, copy the push commands from ECR (View push commands) and run to push image to ECR registry.

---

### ⚡ Deploy Lambda Function

1. Zip your Lambda code:

```bash
cd pixelstream-backend/lambda
npm install
npm run build  # creates zip file
# If `zip` not installed, create it manually (WinRAR etc.)
```

2. Go to AWS Console → Lambda → Upload `lambda-ecs-trigger.zip`

3. Set Lambda ENV variables: Copy from `.env.example` in the repo

4. Done! Your Lambda is now listening for SQS events and launching ECS tasks.

---

## 🌐 API Server Setup (`/api` folder)

```bash
cd pixelstream-backend/api
npm install
cp .env.example .env
# Fill your .env file with credentials
npm run dev
```

This starts the Express server locally. It's responsible for:

- Auth (JWT)
- File upload (presigned S3 URLs)
- Redis polling and SSE streaming
- Handling the transcoding **webhook**

You can now use this backend from the frontend (Next.js) app.

---

## 🎬 Test the Full Flow

1. Sign up and go to dashboard
1. Upload a video
1. File gets uploaded to S3
1. S3 triggers SQS → Lambda → ECS task
1. ECS task transcodes video and sends progress to Redis
1. API server streams progress to frontend via SSE
1. Final output appears in R2
1. API server receives webhook, updates MongoDB
1. HLS URL appears in your frontend dashboard

---

### 🔍 Debugging Tips

- ✅ **S3 Upload working?**  
  If not, check frontend → backend → presigned URL → S3 permissions.

- ✅ **Lambda triggered?**  
  Go to **CloudWatch Logs** → Check for any errors.

- ✅ **ECS Task visible?**  
  Go to ECS → Cluster → Tasks  
  If no task appears, try reproducing the event—it may have completed and disappeared.

- ✅ **Task fails?**  
  Check task logs and fix it.

- ✅ **Redis not updating?**  
  Check connectivity + authentication. Also verify that the Fargate task is calling the Redis endpoint correctly.

- ✅ **Webhook not working?**  
  Verify, your webhook endpoint is reachable wtih correct payload and header provided in task.sh file.

Don't leave the webhook url blank even if your api is not in production, use valid dummy url.

---

## 🚀 Deploying to Production

### Hosting the API Server

Since we use **Server-Sent Events (SSE)**, strictly avoid deploying to Vercel/Netlify (they time out idle connections).

#### Recommended options:

- EC2 or other VM
- NGINX for reverse proxy + SSL (via Certbot)

Verify the cookie settings in `api/src/controllers/auth.ts` file and adjust it according your need.

---

## 🤝 Contribution

Feel free to fork this repo and suggest improvements or open pull requests.

## 🧾 License

This project is open source. No license restrictions apply.
