import Redis from "ioredis";

let redisClient: Redis | null = null;
let isConnected = false;

export function getRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    return null;
  }

  if (redisClient) {
    return isConnected ? redisClient : null;
  }

  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      retryStrategy(times) {
        if (times > 2) {
          isConnected = false;
          return null; // Stop retrying and fallback
        }
        return Math.min(times * 200, 1000);
      }
    });

    redisClient.on("connect", () => {
      isConnected = true;
    });

    redisClient.on("error", (err) => {
      isConnected = false;
      console.warn("Redis warning/error (falling back to direct DB):", err.message);
    });
  } catch (err) {
    redisClient = null;
    isConnected = false;
    console.warn("Failed to initialize Redis client:", err);
  }

  return redisClient;
}
