# SplitReceipt — Receipt OCR + Smart Bill Splitter

<p align="center">
	<strong>Upload a restaurant bill, extract items with OCR + AI, assign people, and split totals with taxes and service charges.</strong>
</p>

<p align="center">
	<img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
	<img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
	<img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
</p>

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution](#solution)
3. [System Architecture](#system-architecture)
4. [OCR + AI Pipeline](#ocr--ai-pipeline)
5. [Tech Stack](#tech-stack)
6. [Project Structure](#project-structure)
7. [Features](#features)
8. [API Reference](#api-reference)
9. [Getting Started](#getting-started)
10. [Environment Variables](#environment-variables)

---

## Problem Statement

Splitting restaurant bills is painful when:

- Item lists are long or messy
- Taxes and service charges are unclear
- Everyone ordered different things

Manual calculators cause mistakes and take too long.

---

## Solution

SplitReceipt automates the flow:

1. Upload a receipt photo
2. OCR + AI extracts items, taxes, and totals
3. Add members and assign items
4. Split items and divide taxes equally
5. View who owes what

---

## System Architecture

```
Frontend (React + Vite)
	└── Upload + Assign + Results UI
				│
				▼
Backend (Express)
	├── OCR.Space (OCR)
	├── Groq (AI parsing)
	├── Split engine
	└── MongoDB (users + receipts)
```

---

## OCR + AI Pipeline

```
Image
	↓
Sharp preprocessing (grayscale + normalize + sharpen + threshold)
	↓
OCR.Space
	↓
Regex hints + cleanup
	↓
Groq AI JSON parse
	↓
Structured receipt
```

---

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- OCR.Space API
- Groq (OpenAI compatible)
- Sharp (image preprocessing)
- JWT + HTTP-only cookies

### Frontend
- React + Vite
- PropTypes

---

## Project Structure

```
Backend/
	config/
	controllers/
	middleware/
	models/
	routes/
	services/
Frontend/
	src/
		components/
```

---

## Features

- Gmail + password login/register
- Receipt OCR and AI parsing
- Manual item editing and add-item support
- Assign items to people
- Split taxes and service charges equally
- Save receipts per user

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Current session |

### Receipts (Auth required)
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/receipt/analyze | OCR + AI parse and save |
| POST | /api/receipt/split | Split totals |

---

## Getting Started

### 1) Backend
```bash
cd Backend
npm install
npm run dev
```

### 2) Frontend
```bash
cd Frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## Environment Variables

### Backend (.env)
| Variable | Description |
|---|---|
| MONGOURL | MongoDB connection string |
| PORT | Backend port (default 5050) |
| GROQ_API_KEY | Groq API key |
| GROQ_MODEL | Groq model (default llama-3.1-8b-instant) |
| GROQ_BASE_URL | Groq base URL |
| OCR_SPACE_API_KEY | OCR.Space API key |
| OCR_LANGUAGE | OCR language (default eng) |
| OCR_SPACE_ENDPOINT | OCR.Space endpoint |
| JWT_SECRET | JWT secret for sessions |
| FRONTEND_ORIGIN | Frontend origin for CORS |

### Frontend (.env)
| Variable | Description |
|---|---|
| VITE_API_URL | Backend base URL |

