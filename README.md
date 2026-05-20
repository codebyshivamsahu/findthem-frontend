# Find Them India 🇮🇳
### National Missing Persons Platform — Web-Only

A comprehensive web platform for reporting, tracking, and finding missing persons across India.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Demo Login:**
- Email: `demo@findthemindia.gov.in`
- Password: `demo1234`

---

## 🏗️ Tech Stack

| Layer         | Technology                                 |
|---------------|--------------------------------------------|
| Frontend      | Next.js 14 (Pages Router) + React 18       |
| Styling       | Tailwind CSS + Custom CSS Variables        |
| State         | Zustand                                    |
| Charts        | Recharts                                   |
| Maps          | Leaflet + React-Leaflet                    |
| Forms         | React Hook Form + Zod                      |
| Notifications | React Hot Toast                            |
| Fonts         | Playfair Display + DM Sans (Google Fonts)  |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── features/         # Page-level feature components
│   │   ├── Dashboard.tsx
│   │   ├── SearchCases.tsx
│   │   ├── ReportMissing.tsx
│   │   ├── LiveMap.tsx
│   │   ├── Statistics.tsx
│   │   ├── Sightings.tsx
│   │   ├── Alerts.tsx
│   │   └── Login.tsx
│   ├── layout/           # Layout components
│   │   ├── MainLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── ui/               # Reusable UI components
│       ├── PersonCard.tsx
│       └── CaseDetail.tsx
├── lib/
│   ├── mockData.ts        # Sample data
│   └── utils.ts           # Utility functions
├── pages/
│   ├── _app.tsx
│   ├── _document.tsx
│   └── index.tsx
├── store/
│   └── index.ts           # Zustand global store
├── styles/
│   └── globals.css
└── types/
    └── index.ts
```

---

## ✨ Core Features

1. **🔐 Authentication** — Role-based access (family, volunteer, police, NGO, admin)
2. **📊 Dashboard** — Live statistics, AMBER alerts, case overview
3. **🔍 Search** — Filter by status, gender, age, state, district
4. **📝 Report Missing** — Multi-step form with FIR linkage
5. **🗺️ Live Map** — Interactive map with sighting pins (Leaflet)
6. **👁️ Sightings** — AI-verified sighting reports
7. **🔔 Alerts** — AMBER alerts, sighting notifications, face match alerts
8. **📈 Statistics** — Public dashboard with charts and state-wise data
9. **📋 All Cases** — Status-filtered case listing

---

## 🔧 Production Readiness (Next Steps)

To make this production-ready, connect:

- **Backend**: Node.js / Python FastAPI microservices
- **Database**: PostgreSQL + Redis (see `src/types/index.ts` for schemas)
- **AI/ML**: DeepFace or AWS Rekognition for face matching
- **Vector DB**: Pinecone for similarity search
- **Auth**: Firebase Auth + Aadhaar eKYC
- **SMS**: MSG91 + WhatsApp Business API
- **Maps**: Google Maps Platform (replace Leaflet)
- **Storage**: AWS S3 / Cloudflare R2
- **CCTNS**: Two-way API sync with police systems

---

## 📱 Design

- **Aesthetic**: Clean government-grade UI with Indian design sensibilities
- **Colors**: Saffron (#FF6B00) primary, Navy (#0A1628) dark, clean white backgrounds
- **Typography**: Playfair Display (headings) + DM Sans (body)
- **Responsive**: Desktop-first, sidebar collapses for smaller screens

---

*Built with ❤️ for India — Every second counts in finding missing persons.*
