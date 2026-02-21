# Topic-Centric Gerrit Dashboard

A topic-based analytics dashboard built on top of the Gerrit REST API.

This project provides a structured visualization layer over Gerrit topics, enabling better understanding of change activity, review velocity, and CI performance.


## Project Architecture

This project follows a full-stack architecture:

### Frontend
- React + Vite
- Modular component structure
- Dashboard layout with:
  - Topic Overview
  - Velocity Metrics
  - CI Metrics (Build / Success / Failure)
  - Average Job Time
  - Changes Table
  - Recent Activity
  - Contributors

### Backend
- Node.js + Express
- Proxy layer to Gerrit REST API
- CORS-enabled API endpoints
- Topic-based change fetching


## Features

- Search Gerrit topics
- Fetch changes using Gerrit REST API
- Compute:
  - Total changes
  - Open / Merged / Abandoned
  - Merge rate
  - Repository & branch count
- Velocity metrics (placeholders for future computation)
- CI build metrics (extendable)
- Scrollable activity panel
- Clean UI layout

## 🔌 Gerrit API Integration

The backend communicates with Gerrit using:
