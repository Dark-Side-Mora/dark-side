const express = require("express");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// In-memory storage for received data (in production, use a database)
let receivedData = [];

// Endpoint to receive workflow details
app.post("/api/receive-workflow-details", async (req, res) => {
  try {
    const { owner, repo, runId, token, readAutomatically = false } = req.body;

    // Validate required fields
    if (!runId || !token) {
      return res.status(400).json({
        error: "Missing required fields: runId and token are required",
      });
    }

    // For backward compatibility, also accept old format
    const workflowOwner = owner;
    const workflowRepo = repo;
    const workflowRunId = runId;

    // Store the received data
    const workflowData = {
      owner: workflowOwner,
      repo: workflowRepo,
      runId: workflowRunId,
      token: token.substring(0, 4) + "...", // Mask token for logging
      readAutomatically,
      receivedAt: new Date().toISOString(),
      status: "pending",
    };

    receivedData.push(workflowData);

    console.log("Received workflow details:", {
      owner: workflowOwner,
      repo: workflowRepo,
      runId: workflowRunId,
      readAutomatically,
      receivedAt: workflowData.receivedAt,
    });

    // If readAutomatically is true, start polling for logs
    if (readAutomatically) {
      workflowData.status = "polling";
      console.log(
        `Starting automatic log polling for: ${workflowOwner}/${workflowRepo} - Run ${workflowRunId}`,
      );

      // Start polling in the background
      startLogPolling(workflowOwner, workflowRepo, workflowRunId, token).catch(
        (err) => {
          console.error(`Polling failed for run ${workflowRunId}:`, err);
          workflowData.status = "failed";
        },
      );
    }

    res.status(200).json({
      message: "Workflow details received successfully",
      data: workflowData,
      receivedCount: receivedData.length,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to view received data
app.get("/api/received-data", (req, res) => {
  res.json({
    count: receivedData.length,
    data: receivedData,
  });
});

// Function to start log polling
async function startLogPolling(owner, repo, runId, token) {
  console.log(`Starting to poll logs for: ${owner}/${repo} - Run ID: ${runId}`);

  const maxAttempts = 30; // Maximum polling attempts
  const pollInterval = 10000; // 10 seconds between polls
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;

    try {
      console.log(
        `Attempt ${attempt}/${maxAttempts}: Checking workflow run status...`,
      );

      // Get workflow run details
      const runResponse = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Workflow-Log-Poller",
          },
        },
      );

      const runStatus = runResponse.data.status;
      const runConclusion = runResponse.data.conclusion;

      console.log(
        `Workflow status: ${runStatus}, conclusion: ${runConclusion || "N/A"}`,
      );

      // Check if the workflow run is completed
      if (runStatus === "completed") {
        console.log("Workflow completed, fetching logs...");

        // Download logs
        const logsResponse = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/logs`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "Workflow-Log-Poller",
            },
            responseType: "arraybuffer", // Logs are returned as a zip file
          },
        );

        // Save logs to file
        const fileName = `logs_${owner}_${repo}_${runId}_${Date.now()}.zip`;
        const filePath = path.join(__dirname, "logs", fileName);

        // Create logs directory if it doesn't exist
        await fs.mkdir(path.join(__dirname, "logs"), { recursive: true });
        await fs.writeFile(filePath, logsResponse.data);

        console.log(`✓ Logs successfully saved to: ${filePath}`);
        console.log(`  Workflow: ${runResponse.data.name || "N/A"}`);
        console.log(`  Conclusion: ${runConclusion}`);
        console.log(`  Run URL: ${runResponse.data.html_url}`);

        return {
          success: true,
          filePath,
          runStatus,
          runConclusion,
          runUrl: runResponse.data.html_url,
        };
      }

      // If not completed, wait before next poll
      if (attempt < maxAttempts) {
        console.log(
          `Workflow still running (${runStatus}), waiting ${pollInterval / 1000}s before next check...`,
        );
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    } catch (error) {
      if (error.response) {
        console.error(
          `API Error (${error.response.status}):`,
          error.response.data?.message || error.message,
        );

        // Handle rate limiting
        if (error.response.status === 403) {
          console.error("Rate limit exceeded or authentication failed");
          throw error;
        }

        // Handle not found
        if (error.response.status === 404) {
          console.error("Workflow run not found. Check owner/repo/runId");
          throw error;
        }
      } else {
        console.error("Error during polling:", error.message);
      }

      // Continue polling on transient errors
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } else {
        throw error;
      }
    }
  }

  throw new Error(
    `Polling timeout: Workflow did not complete after ${maxAttempts} attempts`,
  );
}

// Endpoint to manually trigger log reading
app.post("/api/read-logs", async (req, res) => {
  try {
    const { owner, repo, runId, token } = req.body;

    if (!owner || !repo || !runId || !token) {
      return res.status(400).json({
        error: "owner, repo, runId, and token are required",
      });
    }

    await startLogPolling(owner, repo, runId, token);

    res.json({
      message: "Log reading initiated successfully",
      owner,
      repo,
      runId,
    });
  } catch (error) {
    console.error("Error reading logs:", error);
    res.status(500).json({ error: "Failed to read logs" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  POST   /api/receive-workflow-details`);
  console.log(`  GET    /api/received-data`);
  console.log(`  POST   /api/read-logs`);
  console.log(`  GET    /health`);
});
