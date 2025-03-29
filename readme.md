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
const Traxx = require("traxx");

const app = express();

const traxx = new Traxx({
  mongoUri: process.env.MONGO_URI,
  redisUri: process.env.REDIS_URI,
});

// Enable tracking middleware
app.use(traxx.middleware());

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
- Tracks everything you need, nothing you don’t
- Async, performant, and ready for production

---

## 👨‍💻 Author

Made with 💻 by [boopathi-srb](https://github.com/boopathi-srb)

---

## 📄 License

CC-BY-NC-4.0


