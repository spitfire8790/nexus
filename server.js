const express = require("express");
const cors = require("cors");
const axios = require("axios");

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
    console.log("Received request at /api/proxy");
    console.log("Headers:", req.headers);

    const response = await axios.get(
      "https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/landuse",
      {
        headers: {
          EPINAME: req.headers.epiname,
          ZONECODE: req.headers.zonecode,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Accept, EPINAME, ZONECODE"
    );

    console.log("Successfully retrieved data");
    res.json(response.data);
  } catch (error) {
    console.error("Proxy error:", error);
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

const PORT = process.env.PORT || 5173;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 