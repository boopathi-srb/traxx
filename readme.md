# 🚀 route-analytics

A minimal, production-ready route analytics toolkit for Express.js.

Tracks every request — latency, errors, request metadata, and admin/client ownership — and stores data asynchronously in MongoDB via BullMQ + Redis.

Built for **SaaS platforms**, **internal tools**, and **teams who care about visibility without bloat**.

---

## 📦 Features

- ✅ **Tracks route** method, status, latency, timestamp
- 📊 **Captures request details**: body, params, query
- 🧵 **Captures error details** if request fails
- 🧑‍💼 **Multi-tenant support** with `admin` field
- ⚙️ **Asynchronous writes** using BullMQ (Redis)
- 🧱 **MongoDB model access** for custom queries
- 📈 **Optional dashboard** route to view logs

---

## 🧪 Installation

```bash
npm install route-analytics
