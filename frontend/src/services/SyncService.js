const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

class SyncService {
  constructor(config = {}) {
    this.apiBaseUrl = config.apiBaseUrl || 'http://localhost:8000';
    this.sharedSecret = config.sharedSecret || 'super-secret-key-12345';
    this.userDataPath = config.userDataPath || path.join(process.env.APPDATA || '.', 'userData');
    this.experiencesPath = path.join(this.userDataPath, 'experiences');

    // Ensure download directory exists
    if (!fs.existsSync(this.experiencesPath)) {
      fs.mkdirSync(this.experiencesPath, { recursive: true });
    }
  }

  /**
   * Helper to calculate HMAC-SHA256 signature for requests
   * @param {Object|string} payload 
   * @returns {string} hmac hex digest
   */
  calculateSignature(payload) {
    const stringified = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.sharedSecret)
      .update(stringified)
      .digest('hex');
  }

  /**
   * Reads pending attempts from local queue/SQLite, computes HMAC signature, 
   * and posts them to CMS. Clears successfully synced items locally.
   * @param {Object} dbConnection - reference to local SQLite/database client
   */
  async pushPendingAttempts(dbConnection) {
    try {
      // Simulate reading pending logs from SQLite database
      // In production: SELECT * FROM telemetry_reports WHERE synced = 0;
      let pendingReports = [];
      if (dbConnection && typeof dbConnection.all === 'function') {
        pendingReports = await new Promise((resolve, reject) => {
          dbConnection.all("SELECT * FROM telemetry_reports WHERE synced = 0 LIMIT 100", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
      } else {
        // Fallback: Read mock queue if no active database connection passed
        pendingReports = [];
      }

      if (pendingReports.length === 0) {
        return { success: true, message: "No pending reports to sync." };
      }

      // Group reports by student for ingestion
      const payload = {
        deviceId: pendingReports[0].device_id || "lms-local-device-001",
        studentRollNumber: pendingReports[0].student_roll_no,
        syncedAt: new Date().toISOString(),
        reports: pendingReports.map(r => ({
          idempotencyKey: r.idempotency_key,
          scenarioId: r.scenario_id,
          activityId: r.activity_id,
          screenId: r.screen_id,
          score: r.score,
          maxScore: r.max_score,
          timeSpentSeconds: r.time_spent_seconds,
          completed: !!r.completed,
          answers: JSON.parse(r.answers || '{}'),
          timestamp: r.timestamp
        }))
      };

      const signature = this.calculateSignature(payload);

      const response = await axios.post(
        `${this.apiBaseUrl}/api/v1/lms/sync/ingest-reports/`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-LMS-Signature': signature
          }
        }
      );

      if (response.status === 200 && response.data.processedKeys) {
        const processedKeys = response.data.processedKeys;
        
        // Clear locally synced logs from SQLite database
        if (dbConnection && typeof dbConnection.run === 'function') {
          const placeholders = processedKeys.map(() => '?').join(',');
          await new Promise((resolve, reject) => {
            dbConnection.run(
              `UPDATE telemetry_reports SET synced = 1 WHERE idempotency_key IN (${placeholders})`,
              processedKeys,
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        }
        return { success: true, syncedCount: processedKeys.length };
      }

      return { success: false, message: "Unexpected server response code." };
    } catch (error) {
      console.error("LMS Sync telemetry push failed:", error.message);
      throw error;
    }
  }

  /**
   * Queries CMS for newly assigned experiences packages, downloads the .elab files,
   * and saves them to the experiences userData directory.
   * @param {string|number} studentId 
   */
  async pullUpdates(studentId) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/api/v1/lms/sync/pull-updates/?student_id=${studentId}`
      );

      if (response.status !== 200 || !response.data.updates) {
        throw new Error("Failed to retrieve updates manifest from server.");
      }

      const updates = response.data.updates;
      const downloads = [];

      for (const pkg of updates) {
        const packageFileName = `${pkg.experience_id}_v${pkg.version}.elab`;
        const localFilePath = path.join(this.experiencesPath, packageFileName);

        // Check if package already exists locally
        if (fs.existsSync(localFilePath)) {
          continue;
        }

        const downloadUrl = pkg.download_url.startsWith('http') 
          ? pkg.download_url 
          : `${this.apiBaseUrl}${pkg.download_url}`;

        // Download package archive
        const pkgResponse = await axios({
          method: 'get',
          url: downloadUrl,
          responseType: 'stream'
        });

        const writer = fs.createWriteStream(localFilePath);
        pkgResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        downloads.push({
          experienceId: pkg.experience_id,
          title: pkg.title,
          localPath: localFilePath,
          version: pkg.version
        });
      }

      return { success: true, downloadedCount: downloads.length, downloads };
    } catch (error) {
      console.error("LMS pull updates failed:", error.message);
      throw error;
    }
  }
}

module.exports = SyncService;
