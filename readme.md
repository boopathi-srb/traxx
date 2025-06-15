# 🚀 traxx

![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)

A minimal, production-ready route analytics toolkit for Express.js.

Tracks every request — latency, status codes, request metadata, and errors — and stores it asynchronously in MongoDB using BullMQ + Redis.

Built for **SaaS platforms**, **internal tools**, and **teams who care about visibility without bloat**.

---

## 📦 Features

- ✅ **Tracks route** method, status code, latency, timestamp
- 📊 **Captures request details**: body, params, query
- 🧵 **Captures error stack + message** (if request fails)
- ⚙️ **Asynchronous writes** via BullMQ (Redis)
- 🧱 **MongoDB model access** for custom queries
- 🔔 **Notifications** via Teams, Slack, and Google Chat for specific status codes with detailed error information

---

## 🧪 Installation

```bash
npm install traxx
```

---

## ⚙️ Quick Start

```js
const express = require("express");
const Traxx = require("traxx");

const app = express();

const traxx = new Traxx({
  mongoUri: process.env.MONGO_URI,
  redisUri: process.env.REDIS_URI,
  logIPAddress: true, //false by default
  notifications: {
    statusCodes: [404, 500], // or { min: 400, max: 599 } for all error codes
    channels: [
      {
        type: 'teams',
        options: {
          webhookUrl: process.env.TEAMS_WEBHOOK_URL
        }
      },
      {
        type: 'slack',
        options: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL
        }
      }
    ]
  }
});

// Enable tracking middleware without any custom fields
app.use(traxx.middleware());

// if needed to add any custom fields for tracking purpose, like the tenantId
app.use((req, res, next) => traxx.middleware({tenantId: req.body.tenantId})(req, res, next))

// Example route
app.get("/shop/:id", (req, res) => {
  res.json({ status: true, shop: req.params.id });
});

//Start the server and initialize the traxx
const port = process.env.PORT || 8080;
const server = app.listen(port, async () => {
  await traxx.init(); // Connect to Mongo + Redis
  console.log(`Listening on port ${port}...`);
});

```

---

## 🔍 What Gets Tracked

| Field           | Description                            |
|----------------|----------------------------------------|
| `route`         | Full URL path without query string     |
| `method`        | `GET`, `POST`, etc.                    |
| `statusCode`    | Final response status                  |
| `latency`       | ms, calculated via `process.hrtime()`  |
| `timestamp`     | ISO string                             |
| `requestBody`   | Parsed `req.body`                      |
| `requestParams` | From `req.params`                      |
| `requestQuery`  | From `req.query`                       |
| `customFields`  | Anything that you pass in the middleware()                      |
| `ipAddress`     | From `req.ip` or `req.headers["x-forwarded-for"]`  (optional, stored only if logIPAddress is set to true)                    |

Each request is stored as its own document — **no pre-aggregation**, full raw logs for full custom analytics.

---

## 🧱 Access the MongoDB Model

Need to build your own dashboard or metrics?

```js
const Log = traxx.model();//get the model instance
const recent = await Log.find().sort({ timestamp: -1 }).limit(50);
```

## 🔔 Notification Configuration

Traxx can send notifications to Teams, Slack, and Google Chat when specific status codes are encountered.

### Status Code Configuration

You can specify which status codes should trigger notifications in several ways:

```js
// Specific status codes as an array
notifications: {
  statusCodes: [404, 500, 503],
  // ...
}

// Range of status codes
notifications: {
  statusCodes: { min: 400, max: 599 }, // All 4xx and 5xx errors
  // ...
}
```

### Channel Configuration

Configure one or more notification channels:

```js
notifications: {
  statusCodes: [500],
  channels: [
    {
      type: 'teams',
      options: {
        webhookUrl: 'https://outlook.office.com/webhook/...'
      }
    },
    {
      type: 'slack',
      options: {
        webhookUrl: 'https://hooks.slack.com/services/...'
      }
    },
    {
      type: 'googleChat',
      options: {
        webhookUrl: 'https://chat.googleapis.com/v1/spaces/...'
      }
    }
  ]
}
```

### Error Information in Notifications

Notifications automatically include detailed error information when available:

- **Error Message**: The error message is displayed prominently in the notification
- **Error Stack**: For debugging purposes, the full stack trace is included when available
- **Automatic Error Detection**: Even for status codes without explicit errors, Traxx generates appropriate error messages

This helps you quickly identify and diagnose issues when they occur.

---

## 🧠 Why Traxx?

- Built for **modern Express apps**
- Tracks everything you need, nothing you don't
- Async, performant, and ready for production

---

## 🚀 Nginx Configuration (For Reverse Proxy Setup, if logIPAddress is set to true)

If you're running Traxx behind an Nginx reverse proxy, make sure to update your Nginx configuration to forward the real client IP properly. This ensures that Traxx can log the original client IP instead of the reverse proxy IP (127.0.0.1).

### Nginx Configuration

In your Nginx configuration (typically found in `/etc/nginx/nginx.conf` or `/etc/nginx/sites-available/default`), make sure to include the following:

```nginx
server {
    listen 80;

    # Forward the real client IP to the Express app
    location / {
        proxy_set_header X-Forwarded-For $remote_addr;  # Pass the original client IP
        proxy_set_header X-Real-IP $remote_addr;        # Pass the original client IP
        proxy_set_header Host $host;                    # Preserve the original Host header
        proxy_pass http://your_backend_upstream;         # Replace with your Express app URL
    }
}
```

With this setup:

- Traxx will correctly capture the real client IP via the `X-Forwarded-For` header.
- If you're using multiple proxies, this setup will always capture the first IP in the chain (the client's original IP).

---

## 👨‍💻 Author

Made with 💻 by [boopathi-srb](https://github.com/boopathi-srb)

---

## 📄 License

CC-BY-NC-4.0
