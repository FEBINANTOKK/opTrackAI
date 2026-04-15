import "dotenv/config";
import app from "./app.js";
import connectDatabase from "./config/database.js";
import { startScraperCronJobs } from "./scripts/cronJobs.js";
const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start Express server
    app.listen(PORT, () => {
      console.log(` Server running on http://localhost:${PORT}`);
      console.log(` API Documentation:`);
      console.log(`   - Health Check: http://localhost:${PORT}/health`);
      console.log(`   - API Base URL: http://localhost:${PORT}/api`);
      startScraperCronJobs();
    });
  } catch (error) {
    console.error(" Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
