import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define types for the API response
interface SpatialAPIError {
  error?: {
    code?: number;
    message?: string;
    details?: string[];
  };
}

interface SpatialAPIResponse extends SpatialAPIError {
  features?: any[];
  // Add other expected response fields here
}

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.nsw.gov.au"
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

app.get("/api/proxy", async (req, res) => {
  try {
    const headers = {
      EPINAME: req.headers.epiname,
      ZONECODE: req.headers.zonecode,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    console.log("🚀 Making API request to:", 
      "https://api-uat.apps1.nsw.gov.au/eplanning/data/v0/FetchEPILandUsePermissibility");
    console.log("📨 With headers:", JSON.stringify(headers, null, 2));

    const response = await axios.get(
      "https://api-uat.apps1.nsw.gov.au/eplanning/data/v0/FetchEPILandUsePermissibility",
      { headers }
    );

    console.log("✅ API Response status:", response.status);
    console.log("📦 API Response data:", JSON.stringify(response.data, null, 2));

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Accept, EPINAME, ZONECODE"
    );

    res.json(response.data);
  } catch (error) {
    console.error("❌ API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      message: error.message
    });
    res.status(error.response?.status || 500).json({
      error: error.response?.data || "Internal Server Error",
      message: error.message,
    });
  }
});

app.post("/api/proxy/spatial", async (req, res) => {
  try {
    const { service, params } = req.body;
    
    if (!service) {
      throw new Error('Service path is required');
    }

    // Ensure the service URL ends with /query
    const serviceUrl = service.endsWith('/query') ? service : `${service}/query`;
    const url = `https://portal.spatial.nsw.gov.au/server/rest/services/${serviceUrl}`;
    
    console.log("🚀 Making Spatial API request to:", url);
    console.log("📨 With params:", params);
    
    const response = await axios({
      method: 'POST',
      url,
      data: new URLSearchParams(params),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    if (response.data.error) {
      throw new Error(response.data.error.message || 'API Error');
    }

    res.json(response.data);
  } catch (error) {
    console.error("❌ Spatial API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
      params: req.body.params
    });
    
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch data",
      message: error.message,
      details: error.response?.data
    });
  }
});

app.options("/api/proxy", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, EPINAME, ZONECODE"
  );
  res.sendStatus(200);
});

app.options("/api/proxy/spatial", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept"
  );
  res.sendStatus(200);
});

const PORT = 5174;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 