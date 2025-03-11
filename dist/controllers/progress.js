"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcodingProgress = void 0;
const redis_1 = require("../utils/redis");
const transcodingProgress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Set SSE headers
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });
    // Send initial heartbeat
    res.write(":heartbeat\n\n");
    const { filename } = req.params;
    const redisKey = `transcode:${filename.split(".")[0]}`; // Remove extension
    // const redisKey = "sdf";
    console.log("Subscribing to", redisKey);
    // @ts-ignore
    let lastData = null;
    const MOCK_EVENTS = [
        // { stage: "downloading", progress: 0, status: "downloading" },
        // { stage: "downloading", progress: 20, status: "downloading" },
        // { stage: "downloading", progress: 30, status: "downloading" },
        // { stage: "downloading", progress: 60, status: "downloading" },
        // { stage: "downloading", progress: 80, status: "downloading" },
        // { stage: "downloading", progress: 100, status: "downloading" },
        // { stage: "downloading", progress: 100, status: "downloading" },
        { stage: "transcoding", progress: 0, status: "processing" },
        { stage: "transcoding", progress: 20, status: "processing" },
        // { stage: "transcoding", progress: 40, status: "processing" },
        { stage: "transcoding", progress: 100, status: "processing" },
        // { stage: "transcoding", progress: 50, status: "processing" },
        // { stage: "transcoding", progress: 67, status: "processing" },
        // { stage: "transcoding", progress: 90, status: "processing" },
        // { stage: "transcoding", progress: 100, status: "processing" },
        // { stage: "transcoding", progress: 100, status: "processing" },
        // { stage: "transcoding", progress: 100, status: "processing" },
        { stage: "uploading", progress: 0, status: "uploading" },
        { stage: "uploading", progress: 30, status: "uploading" },
        { stage: "uploading", progress: 70, status: "uploading" },
        // { stage: "uploading", progress: 100, status: "uploading" },
        { stage: "uploading", progress: 100, status: "success" },
    ];
    let mockIndex = 0;
    // Create interval to check Redis and send mock data
    const interval = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const data = yield redis_1.redis.get(redisKey);
            // Only send if data changed
            // @ts-ignore
            if (data && data !== lastData) {
                console.log("Sending data:", data);
                // @ts-ignore
                const parsedData = data;
                res.write(`data: ${JSON.stringify(parsedData)}\n\n`);
                lastData = data;
                // Close connection if completed
                if (parsedData.status === "success" || parsedData.status === "failed") {
                    clearInterval(interval);
                    res.end();
                }
            }
            // Send mock data
            // if (mockIndex < MOCK_EVENTS.length) {
            //   const mockData = MOCK_EVENTS[mockIndex];
            //   res.write(`data: ${JSON.stringify(mockData)}\n\n`);
            //   mockIndex++;
            // }
        }
        catch (error) {
            console.error("SSE Error:", error);
            res.write("event: error\ndata: Failed to get progress\n\n");
        }
    }), 800); // Check every 1 second
    // Handle client disconnect
    req.on("close", () => {
        clearInterval(interval);
        res.end();
    });
});
exports.transcodingProgress = transcodingProgress;
