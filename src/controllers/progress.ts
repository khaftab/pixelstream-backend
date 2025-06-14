import { redis } from "../utils/redis";
import { Request, Response } from "express";

export const transcodingProgress = async (req: Request, res: Response) => {
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

  // @ts-ignore
  let lastData = null;

  // Create interval to check Redis and send mock data
  const interval = setInterval(async () => {
    try {
      const data = await redis.get(redisKey);

      // Only send if data changed
      // @ts-ignore
      if (data && data !== lastData) {
        console.log("Sending data:", data);
        // @ts-ignore

        const parsedData = data as { status: string; progress: number };
        res.write(`data: ${JSON.stringify(parsedData)}\n\n`);
        lastData = data;

        // Close connection if completed
        if (parsedData.status === "success" || parsedData.status === "failed") {
          clearInterval(interval);
          // res.end(); // Frontend will handle closing the connection
          res.write(`event: done\ndata: ${JSON.stringify(data)}\n\n`);
        }
      }
    } catch (error) {
      console.error("SSE Error:", error);
      res.write("event: error\ndata: Failed to get progress\n\n");
    }
  }, 800); // Check every 1 second

  // Handle client disconnect
  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
};

// const MOCK_EVENTS = [
//     // { stage: "downloading", progress: 0, status: "downloading" },
//     // { stage: "downloading", progress: 20, status: "downloading" },
//     // { stage: "downloading", progress: 30, status: "downloading" },
//     // { stage: "downloading", progress: 60, status: "downloading" },
//     // { stage: "downloading", progress: 80, status: "downloading" },
//     // { stage: "downloading", progress: 100, status: "downloading" },
//     // { stage: "downloading", progress: 100, status: "downloading" },
//     { stage: "transcoding", progress: 0, status: "processing" },
//     { stage: "transcoding", progress: 20, status: "processing" },
//     // { stage: "transcoding", progress: 40, status: "processing" },
//     { stage: "transcoding", progress: 100, status: "processing" },
//     // { stage: "transcoding", progress: 50, status: "processing" },
//     // { stage: "transcoding", progress: 67, status: "processing" },
//     // { stage: "transcoding", progress: 90, status: "processing" },
//     // { stage: "transcoding", progress: 100, status: "processing" },
//     // { stage: "transcoding", progress: 100, status: "processing" },
//     // { stage: "transcoding", progress: 100, status: "processing" },
//     { stage: "uploading", progress: 0, status: "uploading" },
//     { stage: "uploading", progress: 30, status: "uploading" },
//     { stage: "uploading", progress: 70, status: "uploading" },
//     // { stage: "uploading", progress: 100, status: "uploading" },
//     { stage: "uploading", progress: 100, status: "success" },
//   ];

//   let mockIndex = 0;
// Send mock data
// if (mockIndex < MOCK_EVENTS.length) {
//   const mockData = MOCK_EVENTS[mockIndex];
//   res.write(`data: ${JSON.stringify(mockData)}\n\n`);
//   mockIndex++;
// }
