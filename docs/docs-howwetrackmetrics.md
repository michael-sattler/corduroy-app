# How Corduroy Tracks Business Metrics

*Executive overview, not the plumbing.*

Corduroy helps small business owners see their business clearly and act on it. A big part of that is turning the messy financial and operational reality of a business into a small set of trustworthy numbers we can put on a dashboard, track across a 90-day plan, and coach against. This note explains, in plain terms, how that number-tracking system works. The exact list of metrics and their precise definitions lives in the companion metrics catalog (linked separately).

## One shared language for every client

Rather than invent metrics from scratch for each client, we maintain a **core catalog** — a standard set of business measures (revenue, expenses, cash, headcount, customer counts, and so on) that nearly every small business needs. Most of what appears on any client's dashboard is drawn from this shared catalog. A minority are **bespoke**: genuinely client-specific measures that don't generalize.

The shared catalog is what makes the whole thing scale. "Revenue" means the same thing for the gym and the concrete supplier, so we can compare clients, benchmark them, and reuse the same logic everywhere instead of rebuilding it per account. The catalog is open-ended — we can add a new metric any time — but every metric, core or bespoke, ships with a plain-English definition of exactly what it counts. That definition is what keeps a person and our AI counting the same thing the same way.

## Record the facts; calculate the rest

We only ever *store* the raw, observed numbers — the ones we can read directly off a bank statement, a profit-and-loss report, or a point-of-sale export. Everything else — margins, growth, cost-per-customer, and other ratios — is **calculated on demand** from those raw numbers.

The reason is trust. If we stored a profit margin *and* the revenue and costs it came from, the three could quietly drift out of sync and we'd never know which to believe. By storing only the facts and recomputing the rest fresh every time, a calculated number can never contradict its inputs. Raw facts in; everything else follows.

## Two kinds of numbers: levels and flows

This is the one technical idea worth internalizing, because it sort of governs everything. Business numbers come in two flavors:

- **Levels** — a value at a single moment, like the balance in a bank account or the number of active members today.
- **Flows** — a value that accumulates over a stretch of time, like revenue earned in March or new members signed this quarter.

The distinction matters because of how you combine them over time. You *add up* flows — three months of revenue make a quarter. You *don't add up* levels — your bank balance on three different days doesn't sum to anything meaningful; you take the latest. Tagging every metric as a level or a flow is what lets the system roll numbers up to a month, quarter, or year correctly and automatically, without a human having to remember which rule applies.

## Every number knows what it covers and where it came from

Each time we capture a value — whether a person types it in or the AI extracts it from a document — we store it as an **observation**, and each observation carries more than just the number:

- **What time it covers** — either an exact date (for a level) or a start-and-end period (for a flow). A revenue figure isn't meaningful until you know revenue *for what stretch of time*.
- **Where it came from** — which document or source, and whether a person or the AI recorded it.
- **When we wrote it down** — kept deliberately separate from the time the number is *about*. Reading a client's March results in July is completely normal; the system knows the figure is "about March" even though we recorded it in July.

And crucially, observations are **append-only**: we never overwrite or erase. If a number is corrected, we add the new observation alongside the old one. It's a ledger kept in pen, not pencil — giving us a complete, auditable history of what we knew and when. For a system clients trust with their financials, that permanence isn't a nicety; it's the point.

## Built for the messy real world

Real businesses don't hand over clean monthly data. Sometimes the best we can get is a quarterly or annual figure pulled from an old report. The system is built for exactly that. We set a *target* cadence for each metric — ideally monthly, say — but we take whatever the source actually provides, and every observation records the true period it represents. One metric can hold a mix of monthly, quarterly, and annual figures across its history, and the system still adds them up correctly. Humans and the AI contribute to the same record side by side, each entry labeled with its source, so an advisor's manual figure and an AI-extracted one coexist without confusion.

## How it fits the product

This machinery sits underneath the parts of Corduroy a client actually sees. The audit establishes the starting numbers; the 90-day plan sets targets against them; the dashboard shows the live picture; and the coaching holds the client accountable to the trend. The metrics catalog is the shared vocabulary tying all of it together — and because every number is defined precisely and stored cleanly, our AI can reason over a client's real figures instead of guessing.

## In short

We keep a standard catalog of clearly-defined business metrics; store only the raw observed facts, never the calculations; tag each number as a level or a flow so it rolls up correctly; and record every value with its time period, its source, and a permanent history. The result is a set of numbers we — and our clients — can actually trust, and that stay consistent enough to compare across the entire book of business.