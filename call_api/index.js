const express = require("express");
const path = require("path");
const globalErrorHandler = require("./controllers/errorController");
const AppError = require("./utils/AppError");
const app = express();
const callRoutes = require("./routes/callRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const convRoutes = require("./routes/convRoutes");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");

// Importing required middlewares
// Trust proxy for secure cookies behind proxies
app.set("trust proxy", 1);

// Set query parser to 'extended' to support nested objects
app.set("query parser", "extended");

// 1) Middlewares:
// Set Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP to allow iframes
  }),
);

// Compress all responses
app.use(compression());

// Rate Limiting
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// Enable CORS
app.use(
  cors({
    origin: ["http://localhost:3000"],

    credentials: true,
  }),
);

// Body parser, reading data from body into req.body
// app.use(express.json({ limit: "10kb" }));
app.use(express.json());

// Development logging
app.use(morgan("dev"));

// Serve static files from the public directory (but not index.html)
app.use(
  express.static(path.join(__dirname, "public"), {
    index: false, // Disable automatic index.html serving
  })
);

// Routes
app.use("/api/v1/call", callRoutes);
app.use("/api/v1/conv", convRoutes);
app.use("/webhook", webhookRoutes);

// Serve index.html at root
app.get("/api/v1/call_log", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Handle unhandled routes

app.use((req, res, next) => {
  next(
    new AppError(
      `Can't find ${req.originalUrl} on this server!, try navigating to /api/v1/call_log to view call logs`,
      404,
    ),
  );
});

app.use(globalErrorHandler);
module.exports = app;
