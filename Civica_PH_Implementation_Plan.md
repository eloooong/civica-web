# Civica PH — Implementation Plan

> **Civica PH** is a Philippine government data explorer inspired by the clean, accessible design language of BetterGov.PH. It brings together public budget data, congressional information, and government datasets into one searchable platform.

---

## 1. Product Direction

### Product statement

> **Explore Philippine Government Data. Understand where public money goes, what Congress is doing, and what government datasets are available.**

Civica PH should feel like a **BetterGov sibling**, not a clone.

### Core sections

```text
Civica PH

Explore
├── Budget
├── Congress
├── Government Data
└── Search

Tools
├── Budget Explorer
├── Bill Explorer
├── Data Explorer
└── Compare

About
└── About Civica
```

---

# 2. UI Direction

The UI should be visually close to BetterGov.PH:

- Clean white/light backgrounds
- Philippine government-inspired blue
- Subtle gray borders
- Moderate corner rounding
- Large, readable typography
- Lucide icons
- Controlled spacing
- Accessible contrast
- Simple navigation
- Responsive mobile layouts
- Strong search experience
- Clear source attribution

### Civica visual direction

The interface should be more data-oriented while retaining BetterGov's clean civic feel.

```text
┌────────────────────────────────────────────────────┐
│ 🇵🇭 Civica PH     Explore  Budget  Congress     │
│                                      Search 🔍     │
├────────────────────────────────────────────────────┤
│                                                    │
│       Philippine Government Data,                  │
│       Made Easier to Understand.                   │
│                                                    │
│   Explore budgets, legislation, and public data.   │
│                                                    │
│   ┌────────────────────────────────────────────┐   │
│   │ 🔍 Search government data...               │   │
│   └────────────────────────────────────────────┘   │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

# 3. Homepage

The homepage should primarily be a **search and discovery interface**, rather than immediately overwhelming users with charts.

## Hero

```text
Explore Philippine Government Data

Search budgets, legislation, agencies,
and government datasets.

[ 🔍 Search government data... ]
```

## Explore cards

```text
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ ₱   Budget      │ │ ◎ Congress      │ │ ◫ Data          │
│                 │ │                 │ │                 │
│ Explore how     │ │ Explore bills   │ │ Discover public │
│ public funds    │ │ and legislative │ │ government      │
│ are allocated.  │ │ records.       │ │ datasets.       │
│                 │ │                 │ │                 │
│ Explore →       │ │ Explore →       │ │ Explore →       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Popular searches

```text
Budget
• Department of Education
• DPWH
• Department of Health

Congress
• Education bills
• Infrastructure bills

Datasets
• Agriculture
• Population
• Government spending
```

---

# 4. Global Search

Global search is one of the most important features.

Example query:

```text
DPWH
```

Results:

```text
Search results for "DPWH"

All     Budget     Congress     Data

──────────────────────────────────

AGENCY
Department of Public Works and Highways

BUDGET
FY 2026
₱XXX billion

PROGRAMS
...

DATASETS
...

RELATED
Infrastructure
Roads
Construction
```

Potential natural-language queries:

```text
"DOH budget 2026"
"education bills"
"government datasets about agriculture"
```

However, the core search should initially be deterministic and API/database driven. AI should not be required for the MVP.

---

# 5. Budget Explorer

Route:

```text
/budget
```

The Budget Explorer is the first major data module.

## Header

```text
Budget Explorer

Explore Philippine national budget data.

[ Search agencies, programs... ]

FY
[ 2026 ▼ ]

Department
[ All departments ▼ ]
```

## Summary

```text
National Budget

₱6.7T

Departments
42

Agencies
XXX

Programs
XXX
```

## Budget table

```text
Budget by Department

Department                  Budget

Department of Education     ₱XXX
DPWH                         ₱XXX
DOH                          ₱XXX
DND                          ₱XXX
...
```

## Visualizations

Use:

- Recharts
- Horizontal bar charts
- Line charts
- Treemaps later

Avoid filling every page with charts.

---

# 6. Budget Detail Page

Example route:

```text
/budget/agency/deped
```

Layout:

```text
Department of Education

FY 2026

₱XXX Billion
```

## Budget trend

```text
2024     ₱...
2025     ₱...
2026     ₱...

Budget trend
[ chart ]
```

## Programs

```text
Programs

Program                         Amount
──────────────────────────────────────
Basic Education                 ₱...
Higher Education                ₱...
...
```

## Budget composition

Add a visual breakdown of the agency's budget.

---

# 7. Congress Explorer

Route:

```text
/congress
```

Use the Open Congress API.

```text
Congress

Search bills, legislators and
legislative records.

[ 🔍 Search... ]

Bills
Representatives
Senators
Congresses
```

## Bill cards

```text
HB 1234

An Act ...
────────────────────────────

Congress: 20th
Status: ...
Authors: 3

[ View bill → ]
```

---

# 8. Bill Detail Page

Route:

```text
/congress/bills/:id
```

Example:

```text
House Bill No. 1234

An Act Providing...

────────────────────────

Congress
20th Congress

Authors
Juan Dela Cruz
Maria Santos

Status
Filed

────────────────────────

Legislative Information

...
```

## Legislative timeline

```text
Filed
  │
  ●
  │
Committee
  │
  ○
  │
Approved
  │
  ○
```

Only display statuses supported by the underlying API data. Do not invent legislative stages.

---

# 9. Legislator Pages

Route:

```text
/congress/people/:id
```

Example:

```text
Juan Dela Cruz

Representative
District ...

────────────────────

Bills authored
37

Bills co-authored
82

Congress
20th

────────────────────

Authored Bills

HB 1234
HB 5678
HB 8910
...
```

This creates an entity relationship:

```text
Person
   ↓
Bills
   ↓
Congress
```

---

# 10. Government Data Explorer

Route:

```text
/data
```

Use the Open Data Portal API.

The experience should resemble a combination of a government data catalog and a clean BetterGov-style directory.

```text
Government Data

Discover datasets published by
Philippine government agencies.

[ 🔍 Search datasets... ]

Categories

Agriculture       124
Health             98
Education          76
Finance            54
Environment        43
```

## Dataset card

```text
Agricultural Production Statistics

Department of Agriculture

Agriculture
Updated: ...

Resources
CSV · XLSX · API

[ View dataset ]
```

---

# 11. Dataset Detail

Route:

```text
/data/:id
```

Layout:

```text
Agricultural Production Statistics

Publisher
Department of Agriculture

Category
Agriculture

Last updated
...

────────────────────────────

Description

...

Resources

┌─────────────────────────────┐
│ CSV                         │
│ Download                    │
└─────────────────────────────┘

┌─────────────────────────────┐
│ XLSX                        │
│ Download                    │
└─────────────────────────────┘
```

Later add:

```text
Preview dataset
```

with the first 50–100 rows where possible.

---

# 12. Universal Search Architecture

Instead of three completely separate search systems:

```text
Search
  │
  ├── Budget API
  ├── Congress API
  └── Data API
```

Create a normalized internal format.

```ts
type SearchResult = {
  id: string
  type: "budget" | "bill" | "person" | "dataset"
  title: string
  description?: string
  agency?: string
  metadata: Record<string, unknown>
  url: string
}
```

Architecture:

```text
User query
     ↓
Search service
     ↓
┌────┼───────────┐
↓    ↓           ↓
Budget Congress Data
│    │           │
└────┼───────────┘
     ↓
Normalize
     ↓
Rank
     ↓
UI
```

This is preferable to directly dumping raw API responses into React components.

---

# 13. Backend Architecture

Use a small backend instead of calling every government API directly from React.

```text
Frontend
Next.js / React
       │
       ↓
Civica API
       │
 ┌─────┼────────────┐
 ↓     ↓            ↓
Budget Congress    Data
API    API          API
```

## Why have a backend?

It allows Civica to:

- Normalize API responses
- Cache API calls
- Handle API failures
- Control rate limits
- Hide implementation details
- Create a unified search endpoint

---

# 14. Recommended Technology Stack

## Frontend

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Radix UI
Lucide
Recharts
TanStack Query
Zustand
```

## Backend

```text
Next.js Route Handlers
```

Initially, avoid creating a separate Express server.

## Database

```text
PostgreSQL
```

Use it for:

- Cached API data
- Search metadata
- Normalized entities
- Saved searches later
- Analytics

## Search

Start with:

```text
PostgreSQL Full-Text Search
```

Later, when the dataset becomes large:

```text
Meilisearch
```

---

# 15. Project Folder Structure

```text
civica-web/
│
├── app/
│   ├── page.tsx
│   │
│   ├── search/
│   │   └── page.tsx
│   │
│   ├── budget/
│   │   ├── page.tsx
│   │   ├── agencies/
│   │   └── [id]/
│   │
│   ├── congress/
│   │   ├── page.tsx
│   │   ├── bills/
│   │   ├── people/
│   │   └── [id]/
│   │
│   ├── data/
│   │   ├── page.tsx
│   │   └── [id]/
│   │
│   └── api/
│       ├── search/
│       ├── budget/
│       ├── congress/
│       └── datasets/
│
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── search/
│   ├── budget/
│   ├── congress/
│   ├── datasets/
│   ├── charts/
│   └── ui/
│
├── lib/
│   ├── api/
│   │   ├── budget.ts
│   │   ├── congress.ts
│   │   └── datasets.ts
│   │
│   ├── search/
│   ├── cache/
│   └── utils.ts
│
├── types/
│   ├── budget.ts
│   ├── congress.ts
│   ├── dataset.ts
│   └── search.ts
│
└── prisma/
    └── schema.prisma
```

---

# 16. Database Model

Do not copy each external API's schema directly.

Create normalized internal entities.

## Agency

```text
Agency
────────────
id
name
acronym
type
source
```

## BudgetRecord

```text
BudgetRecord
────────────
id
fiscalYear
agencyId
program
amount
category
source
```

## Bill

```text
Bill
────────────
id
billNumber
title
description
congress
status
source
```

## Person

```text
Person
────────────
id
name
position
district
congress
```

## Dataset

```text
Dataset
────────────
id
title
description
publisher
category
updatedAt
source
```

---

# 17. Data Fetching Strategy

Do not fetch everything on every page load.

Use:

```text
API
 ↓
Fetch
 ↓
Validate
 ↓
Normalize
 ↓
Cache
 ↓
Database
 ↓
Frontend
```

Example:

```text
GET /api/budget/agencies
```

Internally:

```text
Check cache
   │
   ├── exists → return
   │
   └── expired
          ↓
     BetterGov API
          ↓
        save
          ↓
       return
```

This improves performance and reduces unnecessary requests to public APIs.

---

# 18. MVP Development Phases

Do not build everything immediately.

## Phase 1 — Foundation

### Goal

Get the BetterGov-style shell working.

Build:

- Project setup
- Typography
- Color system
- Navigation
- Footer
- Responsive layout
- Reusable cards
- Buttons
- Badges
- Breadcrumbs
- Loading states
- Error states
- Empty states

Initial routes:

```text
/
 /search
 /budget
 /congress
 /data
```

**Do not connect APIs yet.**

---

# 19. Phase 2 — Budget

Connect the Budget API.

Build:

```text
/budget
/budget/agency/:id
```

Features:

- Agency search
- Year filter
- Budget totals
- Department list
- Charts
- Expandable hierarchy
- Source attribution

---

# 20. Phase 3 — Congress

Connect Open Congress.

Build:

```text
/congress
/congress/bills/:id
/congress/people/:id
```

Features:

- Bill search
- Bill filtering
- Author information
- Congress filtering
- Bill detail pages
- Legislator pages

---

# 21. Phase 4 — Data Explorer

Connect the Open Data Portal.

Build:

```text
/data
/data/:id
```

Features:

- Dataset search
- Category filters
- Publisher filters
- Dataset details
- Resource links
- Dataset preview

---

# 22. Phase 5 — Civica Search

Combine all data sources.

Route:

```text
/search?q=education
```

Example:

```text
All
────────────────────

BUDGET
Department of Education
₱...

BILLS
Education Reform Act
HB 1234

DATASET
Basic Education Statistics
DepEd
```

At this point the application becomes **Civica**, rather than three unrelated API demonstrations.

---

# 23. Phase 6 — Advanced Features

Only add these after the MVP is stable.

## Compare

```text
/budget/compare
```

Example:

```text
Compare

DOH
vs
DepEd

2024
2025
2026
```

## Shareable URLs

Example:

```text
/budget?year=2026&agency=DOH
```

Users can share exactly what they are viewing.

## Export

```text
Export CSV
Download JSON
Print
```

## Bookmarking

Eventually allow users to:

```text
Save this agency
Save this bill
Save this dataset
```

---

# 24. UI Design System

Create the design system before building all pages.

## Suggested palette

```text
Primary
#0038A8

Secondary
#CE1126

Background
#FFFFFF

Surface
#F8FAFC

Border
#E5E7EB

Text
#111827

Muted
#6B7280
```

Do not turn every component blue or red.

Use Philippine colors primarily for branding and important actions while keeping most of the interface neutral.

## Typography

Use:

```text
Inter
```

or another clean sans-serif.

Suggested hierarchy:

```text
Hero
48–64px

Page title
36–44px

Section title
24–30px

Body
16px

Metadata
14px
```

---

# 25. BetterGov-Inspired UX Requirements

Civica should prioritize:

## Accessibility

- Keyboard navigation
- Visible focus states
- Semantic HTML
- ARIA labels
- Skip-to-content link
- Good color contrast
- Screen-reader-friendly tables

## Responsive design

Desktop:

```text
Navbar
────────────────────────────────
Content
```

Mobile:

```text
☰ Civica PH        🔍
────────────────────────────
Content
```

The application should be usable on phones, tablets, and desktop screens.

---

# 26. Source Transparency

Every piece of government data should make its source obvious.

Example:

```text
Department of Education

₱1.2T
FY 2026

Source
BetterGov.PH Budget API

Last retrieved
September 23, 2026

[ View source → ]
```

Users should never have to wonder where a number came from.

For each source, retain:

- Source name
- Source URL
- API/data endpoint where appropriate
- Retrieval timestamp
- Dataset/API version when available

---

# 27. Error Handling

Government APIs can change or temporarily become unavailable.

Every API-dependent component should support:

```text
Loading
↓
Success
↓
Empty
↓
Error
```

Example:

```text
Unable to load budget data.

The source API may be temporarily unavailable.

[ Try again ]
```

Never leave the user with a blank page.

---

# 28. What NOT to Build Initially

Avoid these during MVP:

- AI chatbot
- User accounts
- Social features
- Notifications
- Mobile app
- Complex recommendation engine
- 3D government maps
- Excessive charts
- Every BetterGov dataset
- Real-time scraping

The core data-exploration experience should work before adding these.

---

# 29. Final MVP Architecture

```text
                    CIVICA PH
                         │
       ┌─────────────────┼─────────────────┐
       ↓                 ↓                 ↓
     BUDGET           CONGRESS           DATA
       │                 │                 │
       ↓                 ↓                 ↓
  Agencies            Bills            Datasets
  Programs            People           Publishers
  Spending            Congress         Categories
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ↓
                    GLOBAL SEARCH
                         ↓
                 Unified Results
```

## Final homepage concept

```text
┌──────────────────────────────────────────────────┐
│ 🇵🇭 Civica PH     Explore  Budget  Congress  │
│                                  Data     Search │
├──────────────────────────────────────────────────┤
│                                                  │
│       Philippine Government Data                 │
│       Made Easier to Understand.                 │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ 🔍 Search budgets, bills, datasets...     │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  Explore                                         │
│                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ ₱ Budget    │ │ ◎ Congress  │ │ ◫ Data     │ │
│  │             │ │             │ │            │ │
│  │ Explore     │ │ Explore     │ │ Discover   │ │
│  │ spending    │ │ legislation │ │ datasets   │ │
│  └─────────────┘ └─────────────┘ └────────────┘ │
│                                                  │
│  Latest / Popular                                │
│  ──────────────────────────────────────────────  │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

# 30. Recommended Build Schedule

| Week | Focus | Deliverables |
|---|---|---|
| 1 | Foundation | UI system, navbar, homepage, search UI |
| 2 | Budget | Budget API, explorer, agency pages |
| 3 | Congress | Bills, people, congress pages |
| 4 | Data | Dataset explorer and detail pages |
| 5 | Search | Unified search, caching, source attribution |
| 6 | Polish | Accessibility, responsive UI, SEO, deployment |

---

# 31. Target End State

Civica PH should ultimately become:

```text
                 CIVICA PH
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
     BUDGET        CONGRESS      DATASETS
        │             │             │
        ↓             ↓             ↓
     Agencies       Bills        Government
     Programs       Authors      datasets
     Projects       Congress     resources
        │             │             │
        └─────────────┼─────────────┘
                      ↓
                  Search
                      ↓
                Visualization
                      ↓
               Source / Context
```

The key product distinction is:

> **Do not clone BetterGov.PH. Use its visual language and UX philosophy, while making Civica specifically about discovering, connecting, and understanding Philippine government data.**

This makes the project a stronger portfolio piece because it demonstrates **Next.js/React, TypeScript, API integration, data normalization, search, caching, PostgreSQL, visualization, responsive design, accessibility, and public-sector open-data engineering** without needing to turn the entire project into an AI application.
