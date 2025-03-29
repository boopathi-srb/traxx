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

---

## 🧪 Installation

```bash
npm install traxx
```

---

## ⚙️ Quick Start

```js
const express = require("express");
const RouteAnalytics = require("traxx");

const app = express();

const analytics = new RouteAnalytics({
  mongoUri: process.env.MONGO_URI,
  redisUri: process.env.REDIS_URI,
});

await analytics.init(); // Connect to Mongo + Redis

// Enable tracking middleware
app.use(analytics.middleware());

// Example route
app.get("/shop/:id", (req, res) => {
  res.json({ status: true, shop: req.params.id });
});

// Start async worker to handle bulk writes
analytics.startWorker();

// Optional: enable built-in dashboard
app.use("/traxx", analytics.dashboard());

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
```

---

## 🔍 What Gets Tracked

| Field           | Description                            |
|----------------|----------------------------------------|
| `route`         | Full URL path without query string     |
| `method`        | `GET`, `POST`, etc.                    |
| `statusCode`    | Final response status                  |
| `latency`       | ms, calculated via `process.hrtime()` |
| `timestamp`     | ISO string                             |
| `requestBody`   | Parsed `req.body`                      |
| `requestParams` | From `req.params`                      |
| `requestQuery`  | From `req.query`                       |

Each request is stored as its own document — **no pre-aggregation**, full raw logs for full custom analytics.

---

## 🧱 Access the MongoDB Model

Need to build your own dashboard or metrics?

```js
const Log = analytics.routeAnalyticsModel();
const recent = await Log.find().sort({ timestamp: -1 }).limit(50);
```

---

## 🧠 Why Traxx?

- Built for **modern Express apps**
- Designed for **SaaS and multi-tenant use cases**
- Tracks everything you need, nothing you don’t
- Async, performant, and ready for production

---

## 👨‍💻 Author

Made with 💻 by [boopathi-srb](https://github.com/boopathi-srb)

---

## 📄 License

MIT

