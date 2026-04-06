# Topic-Centric Gerrit Dashboard

A full-stack dashboard for analyzing Gerrit topics, visualizing development activity, and generating AI-powered summaries to help users quickly understand code changes.

---

## Features

- Topic analytics, including total changes, merge rate, repositories, and branches
- Contributor insights with top contributor activity
- Review bottleneck detection for stale changes and unresolved comments
- Build status overview using Gerrit CI signals
- Interactive dashboard with a clean, modern UI
- AI-generated topic summaries using a local LLM through Ollama

---

## Screenshots

### Dashboard Overview

![Dashboard Overview](screenshots/dashboard1.png)

![Dashboard Overview](screenshots/dashboard2.png)

---

## Demo

[Watch the demo video](demo/Demo.mp4)

---

## Architecture

Frontend (React)  
↓  
Backend (Node.js / Express)  
↓  
Gerrit REST API  
↓  
Ollama (local LLM for summaries)

---

## Tech Stack

- Frontend: React with Vite
- Backend: Node.js with Express
- API: Gerrit REST API
- AI: Ollama
- Styling: Custom CSS with light and dark mode support

---

## How to Run Locally

Make sure you have Node.js and Ollama installed.

### 1. Clone the repository

```bash
git clone https://github.com/neginjanfada/topic-centric-gerrit-dashboard.git
cd topic-centric-gerrit-dashboard
```
