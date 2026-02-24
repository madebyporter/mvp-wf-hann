# Data and stats: what’s computed vs stored

How the app uses data for dashboard stats and how the agent can query it.

## Dashboard stats

### CRM (Quote → Job Conversion) — **computed**

- **Quotes Sent** = `state.deals.length`
- **Won** = number of deals with `dealStage === 'Won'`
- **Conversion** = `Math.round((won / quotesSent) * 100)` (0 if no deals)

Updated whenever deals change (create/update deal, update deal stage) via `recomputeQuoteConversion()` in:

- `app/lib/mutations.ts`
- `server/utils/mutations.ts`

### Home Service Plans & Install Capacity — **from seed, not computed**

- **Renewals due (7d)**, **Scheduled visits**, **At-risk accounts**
- **Large installs active**, **Crews assigned**, **Pending permits**

These values come from the initial seed (`app/data/demoStateSeed.json`) and live in `state.dashboardStats`. Only `quoteConversion` is overwritten when mutations run; these are never recalculated from deals/jobs/crews.

## Data the agent can query

The agent has access to full state and must use the **`query_data`** tool for any question about the data. It should never say it “cannot access” or “cannot retrieve” counts or totals.

### `query_data` tool

- **entity**: `deals` | `project_jobs` | `emergency_jobs`
- **dateFilter** (optional): `created` | `updated` — filter by that date field
- **date** (optional): `YYYY-MM-DD`; if `dateFilter` is set and `date` is omitted, **today** is used
- **dealStage** (optional, deals only): `Lead` | `Proposal Sent` | `Won` | `Lost` — include only this stage
- **excludeDealStage** (optional, deals only): exclude this stage (e.g. `Won` for “deals not won yet”)
- **aggregate** (optional): `count` | `sum`
- **field** (optional): for `aggregate: 'sum'`, the field to sum (e.g. `dealAmount` for deals)

Examples:

| User question | Tool call |
|---------------|-----------|
| How many deals were created today? | `query_data({ entity: 'deals', dateFilter: 'created' })` |
| Total value of all deals | `query_data({ entity: 'deals', aggregate: 'sum', field: 'dealAmount' })` |
| Total value of deals **not won yet** | `query_data({ entity: 'deals', excludeDealStage: 'Won', aggregate: 'sum', field: 'dealAmount' })` |
| Total value of deals created today | `query_data({ entity: 'deals', dateFilter: 'created', aggregate: 'sum', field: 'dealAmount' })` |
| Deals updated on a specific date | `query_data({ entity: 'deals', dateFilter: 'updated', date: '2026-02-23' })` |
| Count of project jobs / emergency jobs | `query_data({ entity: 'project_jobs' })` or `entity: 'emergency_jobs'` |

Return shape: `{ count, total?, items? }`. For `aggregate: 'sum'` and `field: 'dealAmount'`, `total` is the sum.

## Date fields (for filtering)

- **Deals**: `createdDate`, `updatedDate` — `YYYY-MM-DD`
- **Project jobs**: `createdAt` — ISO string (compared as `YYYY-MM-DD` via first 10 chars)
- **Emergency jobs**: `createdAt` — same

All date comparisons use the date part only (`YYYY-MM-DD`).
