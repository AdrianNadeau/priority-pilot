const { BetaAnalyticsDataClient } = require("@google-analytics/data");
const fs = require("fs");
const path = require("path");

/**
 * Google Analytics 4 Data Export Class
 * Exports user/visitor details from GA4 using the Data API
 */
class GoogleAnalyticsExporter {
  constructor(options = {}) {
    this.propertyId = options.propertyId || process.env.GA4_PROPERTY_ID;
    this.keyFilePath = options.keyFilePath || process.env.GA4_KEY_FILE_PATH;

    if (!this.propertyId) {
      throw new Error("GA4 Property ID is required");
    }

    // Initialize the Analytics Data client
    const clientOptions = {};
    if (this.keyFilePath) {
      clientOptions.keyFilename = this.keyFilePath;
    }

    this.analyticsDataClient = new BetaAnalyticsDataClient(clientOptions);
  }

  /**
   * Run a report with the given dimensions and metrics
   * @param {Object} options - Report options
   * @returns {Promise<Array>} - Report data rows
   */
  async runReport(options = {}) {
    const {
      startDate = "30daysAgo",
      endDate = "today",
      dimensions = [],
      metrics = [],
      limit = 10000,
    } = options;

    try {
      const [response] = await this.analyticsDataClient.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: dimensions.map((d) => ({ name: d })),
        metrics: metrics.map((m) => ({ name: m })),
        limit,
      });

      return this._formatResponse(response);
    } catch (error) {
      console.error("Error running GA4 report:", error.message);
      throw error;
    }
  }

  /**
   * Get visitor overview data
   * @param {string} startDate - Start date (e.g., "30daysAgo", "2024-01-01")
   * @param {string} endDate - End date (e.g., "today", "2024-01-31")
   * @returns {Promise<Object>} - Visitor overview metrics
   */
  async getVisitorOverview(startDate = "30daysAgo", endDate = "today") {
    return this.runReport({
      startDate,
      endDate,
      metrics: [
        "totalUsers",
        "newUsers",
        "activeUsers",
        "sessions",
        "bounceRate",
        "averageSessionDuration",
        "screenPageViews",
        "engagementRate",
      ],
    });
  }

  /**
   * Get visitor demographics (country, city, language)
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} - Demographics data
   */
  async getVisitorDemographics(startDate = "30daysAgo", endDate = "today") {
    return this.runReport({
      startDate,
      endDate,
      dimensions: ["country", "city", "language"],
      metrics: ["totalUsers", "sessions", "screenPageViews"],
    });
  }

  /**
   * Get visitor device information
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} - Device data
   */
  async getVisitorDevices(startDate = "30daysAgo", endDate = "today") {
    return this.runReport({
      startDate,
      endDate,
      dimensions: ["deviceCategory", "operatingSystem", "browser"],
      metrics: ["totalUsers", "sessions", "screenPageViews"],
    });
  }

  /**
   * Get page views and behavior data
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} - Page behavior data
   */
  async getPageBehavior(startDate = "30daysAgo", endDate = "today") {
    return this.runReport({
      startDate,
      endDate,
      dimensions: ["pagePath", "pageTitle"],
      metrics: [
        "screenPageViews",
        "averageSessionDuration",
        "bounceRate",
        "engagementRate",
      ],
    });
  }

  /**
   * Get traffic sources
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} - Traffic source data
   */
  async getTrafficSources(startDate = "30daysAgo", endDate = "today") {
    return this.runReport({
      startDate,
      endDate,
      dimensions: [
        "sessionSource",
        "sessionMedium",
        "sessionCampaignName",
        "sessionDefaultChannelGroup",
      ],
      metrics: ["totalUsers", "sessions", "screenPageViews", "engagementRate"],
    });
  }

  /**
   * Get user acquisition data
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} - Acquisition data
   */
  async getUserAcquisition(startDate = "30daysAgo", endDate = "today") {
    return this.runReport({
      startDate,
      endDate,
      dimensions: [
        "firstUserSource",
        "firstUserMedium",
        "firstUserCampaignName",
      ],
      metrics: ["totalUsers", "newUsers", "sessions"],
    });
  }

  /**
   * Get events data
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} - Events data
   */
  async getEvents(startDate = "30daysAgo", endDate = "today") {
    return this.runReport({
      startDate,
      endDate,
      dimensions: ["eventName"],
      metrics: ["eventCount", "totalUsers"],
    });
  }

  /**
   * Get all available visitor data
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Object>} - All visitor data
   */
  async getAllVisitorData(startDate = "30daysAgo", endDate = "today") {
    try {
      const [
        overview,
        demographics,
        devices,
        pageBehavior,
        trafficSources,
        acquisition,
        events,
      ] = await Promise.all([
        this.getVisitorOverview(startDate, endDate),
        this.getVisitorDemographics(startDate, endDate),
        this.getVisitorDevices(startDate, endDate),
        this.getPageBehavior(startDate, endDate),
        this.getTrafficSources(startDate, endDate),
        this.getUserAcquisition(startDate, endDate),
        this.getEvents(startDate, endDate),
      ]);

      return {
        dateRange: { startDate, endDate },
        exportedAt: new Date().toISOString(),
        overview,
        demographics,
        devices,
        pageBehavior,
        trafficSources,
        acquisition,
        events,
      };
    } catch (error) {
      console.error("Error fetching all visitor data:", error.message);
      throw error;
    }
  }

  /**
   * Export data to JSON format
   * @param {Object} data - Data to export
   * @returns {string} - JSON string
   */
  exportToJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export data to CSV format
   * @param {Array} data - Array of data rows
   * @param {Array} headers - Column headers
   * @returns {string} - CSV string
   */
  exportToCSV(data, headers = null) {
    if (!Array.isArray(data) || data.length === 0) {
      return "";
    }

    const csvHeaders = headers || Object.keys(data[0]);
    const csvRows = data.map((row) =>
      csvHeaders.map((header) => {
        const value = row[header] || "";
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(",") ? `"${escaped}"` : escaped;
      }).join(",")
    );

    return [csvHeaders.join(","), ...csvRows].join("\n");
  }

  /**
   * Format the GA4 API response into a more usable structure
   * @param {Object} response - GA4 API response
   * @returns {Array} - Formatted data
   */
  _formatResponse(response) {
    if (!response.rows || response.rows.length === 0) {
      return [];
    }

    const dimensionHeaders = response.dimensionHeaders?.map((h) => h.name) || [];
    const metricHeaders = response.metricHeaders?.map((h) => h.name) || [];

    return response.rows.map((row) => {
      const formattedRow = {};

      // Add dimensions
      row.dimensionValues?.forEach((value, index) => {
        formattedRow[dimensionHeaders[index]] = value.value;
      });

      // Add metrics
      row.metricValues?.forEach((value, index) => {
        const metricName = metricHeaders[index];
        // Convert numeric strings to numbers where appropriate
        formattedRow[metricName] = isNaN(value.value)
          ? value.value
          : parseFloat(value.value);
      });

      return formattedRow;
    });
  }

  /**
   * Save data to a JSON file
   * @param {Object} data - Data to save
   * @param {string} filename - Filename (without extension)
   * @param {string} outputDir - Output directory (defaults to ./exports)
   * @returns {string} - Full path to saved file
   */
  saveToJSON(data, filename = "ga-export", outputDir = "./exports") {
    const fullDir = path.resolve(outputDir);
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fullPath = path.join(fullDir, `${filename}-${timestamp}.json`);

    fs.writeFileSync(fullPath, this.exportToJSON(data), "utf8");
    console.log(`Data saved to: ${fullPath}`);
    return fullPath;
  }

  /**
   * Save data to a CSV file
   * @param {Array} data - Array of data rows
   * @param {string} filename - Filename (without extension)
   * @param {string} outputDir - Output directory (defaults to ./exports)
   * @returns {string} - Full path to saved file
   */
  saveToCSV(data, filename = "ga-export", outputDir = "./exports") {
    const fullDir = path.resolve(outputDir);
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fullPath = path.join(fullDir, `${filename}-${timestamp}.csv`);

    fs.writeFileSync(fullPath, this.exportToCSV(data), "utf8");
    console.log(`Data saved to: ${fullPath}`);
    return fullPath;
  }

  /**
   * Export all visitor data and save to files
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {string} outputDir - Output directory (defaults to ./exports)
   * @returns {Promise<Object>} - Paths to saved files
   */
  async exportAllToFiles(startDate = "30daysAgo", endDate = "today", outputDir = "./exports") {
    const data = await this.getAllVisitorData(startDate, endDate);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const savedFiles = {
      allData: this.saveToJSON(data, "ga-all-data", outputDir),
    };

    // Save individual reports as CSV
    if (data.demographics?.length) {
      savedFiles.demographics = this.saveToCSV(data.demographics, "ga-demographics", outputDir);
    }
    if (data.devices?.length) {
      savedFiles.devices = this.saveToCSV(data.devices, "ga-devices", outputDir);
    }
    if (data.pageBehavior?.length) {
      savedFiles.pageBehavior = this.saveToCSV(data.pageBehavior, "ga-page-behavior", outputDir);
    }
    if (data.trafficSources?.length) {
      savedFiles.trafficSources = this.saveToCSV(data.trafficSources, "ga-traffic-sources", outputDir);
    }
    if (data.acquisition?.length) {
      savedFiles.acquisition = this.saveToCSV(data.acquisition, "ga-acquisition", outputDir);
    }
    if (data.events?.length) {
      savedFiles.events = this.saveToCSV(data.events, "ga-events", outputDir);
    }

    console.log("All files saved:", savedFiles);
    return savedFiles;
  }
}

module.exports = GoogleAnalyticsExporter;
