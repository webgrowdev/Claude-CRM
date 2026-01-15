# Clinic - Mobile CRM for Aesthetic Clinics

> **Turn inquiries into sales**

A complete project specification for Clinic, a mobile CRM designed specifically for aesthetic clinics that receive inquiries through Instagram and WhatsApp.

## Overview

Clinic helps small to mid-sized aesthetic clinics convert social media leads into paying customers. The app provides:

- Centralized lead management
- Visual Kanban pipeline
- Automated follow-up reminders
- Conversion analytics
- One-tap contact via WhatsApp/Instagram

## Project Structure

```
/
├── branding/               # Brand assets and guidelines
│   ├── brand_guide.md
│   ├── logo_specifications.json
│   └── palette.json
│
├── ui/                     # UI specifications
│   └── screens_specifications.json
│
├── css/                    # Design tokens
│   └── tokens.json
│
├── docs/                   # Business documentation
│   ├── buyer_personas.md
│   ├── business_model.md
│   ├── copywriting.md
│   └── commercial_deck.json
│
├── landing/                # Landing page
│   ├── index.html
│   └── copy.txt
│
├── ads/                    # Marketing assets
│   ├── meta_ads/
│   │   └── ad_copies.json
│   └── scripts/
│       └── automated_responses.json
│
├── clinic_project_complete.json  # Complete project in single JSON
└── README.md
```

## Key Documents

| Document | Description |
|----------|-------------|
| `clinic_project_complete.json` | Complete project data in structured JSON format |
| `branding/palette.json` | Color palette and design tokens |
| `branding/brand_guide.md` | Logo usage rules and brand guidelines |
| `docs/buyer_personas.md` | Target user profiles (Maria & Jessica) |
| `docs/business_model.md` | Product objectives and value proposition |
| `docs/copywriting.md` | Sales scripts, taglines, and marketing copy |
| `docs/commercial_deck.json` | Investor/sales presentation outline |
| `ui/screens_specifications.json` | Detailed UI screen specifications |
| `landing/index.html` | Landing page structure |
| `ads/meta_ads/ad_copies.json` | Instagram/Facebook ad copy |

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#6366F1` | CTAs, buttons, active states |
| Secondary | `#F472B6` | Accents, logo dot |
| Success | `#10B981` | Closed deals, confirmations |
| Warning | `#F59E0B` | Pending, follow-up reminders |
| Error | `#EF4444` | Lost leads, errors |
| Background | `#F8FAFC` | App background |
| Text | `#1E293B` | Primary text |

## Typography

- **Headlines:** Plus Jakarta Sans (600, 700, 800)
- **Body:** Inter (400, 500, 600, 700)

## Target Users

1. **Maria (Owner)** - Clinic owner who needs visibility and ROI
2. **Jessica (Receptionist)** - Daily user who needs efficiency and organization

## MVP Features

- Lead capture (manual + import)
- Kanban board (New → Contacted → Scheduled → Closed → Lost)
- Follow-up scheduling with push notifications
- Basic reports (conversion rate, lead source)
- Lead notes and history
- Multi-user support
- WhatsApp click-to-chat
- Treatment price list

## Pricing (MVP)

| Plan | Price | Users | Leads |
|------|-------|-------|-------|
| Starter | $19/mo | 1 | 100/month |
| Growth | $49/mo | 3 | Unlimited |
| Clinic | $99/mo | 10 | Unlimited |

## Value Proposition

> "Clinic organizes your leads, reminds you of follow-ups, and helps you close more sales from Instagram and WhatsApp."

---

*Project Version 1.0 | January 2026*
