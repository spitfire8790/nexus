import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());

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

app.options("/api/proxy", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, EPINAME, ZONECODE"
  );
  res.sendStatus(200);
});

const PORT = 5174;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 