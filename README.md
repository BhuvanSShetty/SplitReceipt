<p align="center">
  <img src="assets/logo.png" alt="SplitReceipt" width="180" />
</p>

<h1 align="center">SplitReceipt</h1>

<p align="center">
  <b>AI-Powered Receipt Scanner & Smart Bill Splitter</b>
</p>

<p align="center">
  Snap a photo of any restaurant bill — let AI extract every item, tax, and charge.<br/>
  Assign items to friends and get a fair split in seconds.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Groq_AI-F55036?style=flat-square&logo=probot&logoColor=white" alt="Groq" />
</p>

<br/>

## 🎯 The Problem

Splitting a restaurant bill shouldn't be a headache.

> **Long item lists** · **Hidden taxes & service charges** · **Everyone ordered different things** · **Manual math = mistakes**

SplitReceipt fixes all of this — automatically.

<br/>

## ✨ Features

| | Feature | Description |
|---|---|---|
| 📸 | **Receipt OCR** | Upload a photo → AI extracts every line item |
| 🧠 | **Smart Parsing** | Groq AI structures raw text into items, prices, taxes |
| ✏️ | **Manual Editing** | Fix or add items before splitting |
| 👥 | **Assign Items** | Drag items to each person who ordered them |
| 💰 | **Fair Split** | Taxes & service charges divided proportionally |
| 🔐 | **Auth & History** | JWT login — save and revisit past receipts |

<br/>

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                         │
│              React + Vite (Port 5173)               │
│                                                     │
│   Upload UI  →  Item Editor  →  Split Dashboard     │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
                       ▼
┌─────────────────────────────────────────────────────┐
│                    Backend                          │
│            Node.js + Express (Port 5050)            │
│                                                     │
│   ┌──────────┐  ┌──────────┐  ┌────────────────┐   │
│   │ Auth     │  │ OCR +    │  │ Split          │   │
│   │ (JWT)    │  │ AI Parse │  │ Engine         │   │
│   └──────────┘  └────┬─────┘  └────────────────┘   │
│                      │                              │
│          ┌───────────┼───────────┐                  │
│          ▼           ▼           ▼                  │
│     OCR.Space    Groq AI     MongoDB               │
│     (Scan)      (Parse)     (Store)                │
└─────────────────────────────────────────────────────┘
```

<br/>

## 🔬 OCR + AI Pipeline

```
  📷 Receipt Photo
       │
       ▼
  ┌─────────────────────────┐
  │  Sharp Preprocessing    │
  │  grayscale → normalize  │
  │  sharpen → threshold    │
  └───────────┬─────────────┘
              ▼
  ┌─────────────────────────┐
  │  OCR.Space API          │
  │  Image → Raw Text       │
  └───────────┬─────────────┘
              ▼
  ┌─────────────────────────┐
  │  Regex Cleanup          │
  │  Noise removal + hints  │
  └───────────┬─────────────┘
              ▼
  ┌─────────────────────────┐
  │  Groq AI (LLaMA 3.1)   │
  │  Raw Text → JSON        │
  └───────────┬─────────────┘
              ▼
  📋 Structured Receipt
     { items, taxes, total }
```

<br/>

## 🛠️ Tech Stack

<table>
  <tr>
    <th align="left">Layer</th>
    <th align="left">Technology</th>
  </tr>
  <tr>
    <td><b>Frontend</b></td>
    <td>React 18 · Vite · PropTypes</td>
  </tr>
  <tr>
    <td><b>Backend</b></td>
    <td>Node.js · Express · JWT · HTTP-only Cookies</td>
  </tr>
  <tr>
    <td><b>Database</b></td>
    <td>MongoDB Atlas · Mongoose ODM</td>
  </tr>
  <tr>
    <td><b>OCR</b></td>
    <td>OCR.Space API · Sharp (image preprocessing)</td>
  </tr>
  <tr>
    <td><b>AI</b></td>
    <td>Groq API · LLaMA 3.1 8B</td>
  </tr>
</table>

<br/>

## 📁 Project Structure

```
SplitReceipt/
├── Backend/
│   ├── config/           # DB connection, env config
│   ├── controllers/      # Route handlers
│   ├── middleware/        # Auth middleware
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API route definitions
│   ├── services/         # OCR, AI, split logic
│   └── server.js         # Entry point
│
├── Frontend/
│   └── src/
│       ├── components/   # React UI components
│       ├── App.jsx       # Root component
│       └── main.jsx      # Vite entry
│
└── assets/               # Logo & static assets
```

<br/>

## 📡 API Reference

### Auth

| Method | Endpoint | Description |
|:------:|----------|-------------|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Login & get session cookie |
| `POST` | `/api/auth/logout` | Clear session |
| `GET` | `/api/auth/me` | Get current user |

### Receipts *(Auth required)*

| Method | Endpoint | Description |
|:------:|----------|-------------|
| `POST` | `/api/receipt/analyze` | Upload image → OCR + AI parse → save |
| `POST` | `/api/receipt/split` | Compute per-person totals |

<br/>

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** (local or [Atlas](https://www.mongodb.com/atlas))
- API keys for [OCR.Space](https://ocr.space/ocrapi), [Groq](https://console.groq.com/)

### 1. Clone the repo

```bash
git clone https://github.com/BhuvanSShetty/SplitReceipt.git
cd SplitReceipt
```

### 2. Backend setup

```bash
cd Backend
npm install
```

Create `Backend/.env`:

```env
PORT=5050
MONGOURL=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
GROQ_BASE_URL=https://api.groq.com/openai/v1
OCR_SPACE_API_KEY=your_ocr_space_key
OCR_LANGUAGE=eng
OCR_SPACE_ENDPOINT=https://api.ocr.space/parse/image
JWT_SECRET=your_jwt_secret
FRONTEND_ORIGIN=http://localhost:5173
```

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd Frontend
npm install
```

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:5050
```

```bash
npm run dev
```

### 4. Open the app

Visit **[http://localhost:5173](http://localhost:5173)** 🎉

<br/>

## 🔑 Environment Variables

<details>
<summary><b>Backend (.env)</b></summary>

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: `5050`) |
| `MONGOURL` | MongoDB connection string |
| `GROQ_API_KEY` | Groq API key |
| `GROQ_MODEL` | Model name (default: `llama-3.1-8b-instant`) |
| `GROQ_BASE_URL` | Groq base URL |
| `OCR_SPACE_API_KEY` | OCR.Space API key |
| `OCR_LANGUAGE` | OCR language code |
| `OCR_SPACE_ENDPOINT` | OCR.Space endpoint URL |
| `JWT_SECRET` | JWT signing secret |
| `FRONTEND_ORIGIN` | Frontend URL for CORS |

</details>

<details>
<summary><b>Frontend (.env)</b></summary>

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

</details>

<br/>

---

<p align="center">
  Built with ☕ by <a href="https://github.com/BhuvanSShetty">Bhuvan S Shetty</a>
</p>
