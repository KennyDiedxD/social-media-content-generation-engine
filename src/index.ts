import { createServer } from "./api/server";

const app = createServer();

const PORT = 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Eddy Social Manager running on http://localhost:${PORT}`);
});

server.on("error", (error) => {
  console.error("❌ Server error:", error);
});

server.on("close", () => {
  console.log("⚠️ Server closed");
});
