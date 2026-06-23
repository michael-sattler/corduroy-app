# 

| Build Plan: Corduroy v1 WORKING DRAFT              | May 16, 2026 |
| :---- | ----: |

This document defines the minimum viable version of each of Corduroy's four core modules, sequences them across a 90-day build window, and identifies key experiments and risks at each stage. It is intended to guide the founding team's sprint planning and resource prioritization.

| Implementation Stage | Module | MVP Definition | Weeks |
| :---: | :---- | :---- | :---: |
| **1** | **The Vault** | Core SaaS functionality, Secure per-client storage, file ingestion, LLM retrieval layer | 1–2 |
| **2** | **90-Day Planner** | AI-generated plan from Vault data, human review, client view | 3-4 |
| **LAUNCH FOR TESTING WITH CLIENTS** |  |  |  |
| **3** | **KPI Dashboard** | Automated KPI extraction, core chart views, advisor config | 5-6 |
| **LAUNCH FOR TESTING WITH CLIENTS** |  |  |  |
| **4** | **Coaching \+ HITL** | Daily check-ins, escalation queue, advisor intervention flow | 7-8 |
|  | **Revisions and changes** | Critical features discovered or prioritized during development | 9-12 |

## Implementation Notes

| FIRST LAUNCH *Implementation Stage 1 \+ 2* Vault and 90 Day Plan | SECOND LAUNCH *Implementation Stage 3* Data updates and KPI Dashboard | THIRD LAUNCH *Implementation Stage 4* Accountability coach and HITL Oversight |
| :---- | :---- | :---- |

## Corduroy client journey	After Implementation Stage 2

|  | PHASE 1Assessment | PHASE 2Execution |  |  |  |  |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
|  | **Data gathering → analysis → Audit → 90-Day Plan** | **Review Audit and 90 Day Plan** | **Weekly data updates** | **Weekly checkins** | **Monthly status checkin** | **90 Day review, Milestone Summary document** |
|  | An intensive engagement working directly with  | Walk through the 90 Day Plan in the Corduroy dashboard | Download files and reports from 3rd party systems and spreadsheets, upload files | Imagine a meeting with your primary care physician to check on your progress since your last appointment | Imagine a meeting with your primary care physician to check on your progress since your last appointment | Review what was done, what wasn’t, and what to do next. |
| FREQUENCY | One-time, up-front | One-time | Weekly | Weekly | Monthly | 90 Day Milestone |
| WHERE | Video meeting, email follow-ups | Video meeting, Corduroy dashboard | Corduroy dashboard and Vault | Corduroy 90 Day Plan | Video meeting | Video meeting |
| WITH | Corduroy advisor | Corduroy advisor | Self, Corduroy apprenticePHASE 2AI agents | **Corduroy advisor** | Corduroy advisor | Corduroy advisor |

## Corduroy client journey	At Completion

|  | PHASE 1Assessment | PHASE 2Execution |  |  |  |  |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
|  | **Data gathering → analysis → Audit → 90-Day Plan** | **Review Audit and 90 Day Plan** | **Weekly data updates** | **Weekly checkins** | **Monthly status checkin** | **90 Day review, Milestone Summary document** |
|  | An intensive engagement working directly with  | Walk through the 90 Day Plan in the Corduroy dashboard | Download files and reports from 3rd party systems and spreadsheets, upload files | Your AI coach keeps track of where you are in the plan and reminds you of your top priorities and suggests solutions | Imagine a meeting with your primary care physician to check on your progress since your last appointment | Review what was done, what wasn’t, and what to do next. |
| FREQUENCY | One-time, up-front | One-time | Weekly | Weekly | Monthly | 90 Day Milestone |
| WHERE | Video meeting, email follow-ups | Video meeting, Corduroy dashboard | Corduroy dashboard and Vault | Cordurory dashboard | Video meeting | Video meeting |
| WITH | Corduroy advisor | Corduroy advisor | Self, Corduroy apprenticePHASE 2AI agents | Accountability coach | Corduroy advisor | Corduroy advisor |

##  

## 

| PHASE 1 | The Vault and Core Framework | Weeks 1–4 |
| :---: | :---- | ----: |

## What it is

A secure, per-client data repository that ingests all of a client's relevant business data sources \- files, connectors, and web content \- and makes that data retrievable by the AI layer. The Vault is the intelligence foundation every other module depends on.

## MVP: what gets built in 90 days

| In scope (MVP) Per-client S3 bucket provisioning with IAM isolation Client portal: drag-and-drop file upload (PDF, CSV, XLSX, DOCX) Raw / derived prefix structure and audit log Retrieval service layer \- LLMs query through it, never direct bucket access Context file generation: summaries, indices, markdown outputs for AI consumption Manual ingestion-assist workflow for advisor-led onboarding | Out of scope (follow-on) Basic QuickBooks connector (read-only export) Salesforce, HubSpot, Xero, and other connectors Desktop agentic retrieval (credential \+ automated sync flow) Automated data freshness / re-sync scheduling Self-serve connector setup by clients Granular access tiers within a client bucket |  |
| :---- | :---- | :---- |

## Definition of done

* A real client's data is fully ingested and structured in their bucket

* An LLM prompt can retrieve relevant context through the retrieval service in \< 5 seconds

* No cross-client access is possible \- verified by security review

* An advisor can monitor data freshness and flag gaps from a simple admin view

| Key experiments \- Phase 1 Chunking strategy for context file generation: what context window size and chunking approach produces the best AI output from messy SMB files? Test with real client data. Minimum viable data volume: how much data does the Vault need before plan quality becomes acceptable? Set a floor before Phase 2\. |
| :---- |

| Biggest risk Data heterogeneity. Real SMB files are messy \- legacy spreadsheets, inconsistent naming, PDFs with no structure. The ingestion pipeline will hit edge cases constantly. Budget 30% of Phase 1 engineering time for ingestion robustness, not just the happy path. (Phase 2\) Desktop agent credential flow: red-team the credential storage design before any agentic connector touches a live system. |
| :---- |

# 

| PHASE 2 | 90-Day Planner | Weeks 5–7 |
| :---: | :---- | ----: |

## What it is

An AI-generated, week-by-week action plan built from the client's Vault data. Every recommendation is tied to their actual situation \- not a generic template. Human advisors review and approve before the client sees it.

## MVP: what gets built in 90 days

| In scope (MVP) Prompt architecture that produces a structured 90-day plan from Vault context Plan schema: week number, milestone, assignee, due date, priority, dependencies Advisor review queue \- edits before client delivery Simple client-facing web view: read, mark complete, comment Human edit rate tracking as a quality signal Corduroy staff can edit plan from the back end | Out of scope (follow-on) Client self-editing of plan structure (milestones, dates) Automated plan refresh as Vault data updates Team collaboration / task assignment within the plan Integration with external project management tools (Asana, Linear) Plan versioning and change history |  |
| :---- | :---- | :---- |

## Definition of done

* A plan generated from real Vault data is reviewed by an advisor and called actionable \- not generic

* Advisor makes fewer than 20% substantive edits on average (target quality signal)

* A client, shown their plan cold, can describe their top 3 next actions without help

| Key risk-reduction experiments \- Phase 2 Plan specificity threshold: how much Vault data is 'enough'? Run the prompt with sparse vs. rich Vaults and compare advisor edit rates. Prompt structure for milestone generation: test chain-of-thought vs. structured output prompting for reducing vague milestones. Advisor edit patterns: categorize what advisors change most \- this tells you where the prompt architecture needs work. |
| :---- |

| Biggest risk Generic output. Without enough context, the plan reads like a business school template. This is both a data quality problem (Phase 1\) and a prompt engineering problem \- both should be solved simultaneously. If Phase 1/Audit document data quality is weak, Phase 2 plan quality will be weak regardless of prompt sophistication. |
| :---- |

| PHASE 3 | KPI Dashboard | Weeks 8–10 |
| :---: | :---- | ----: |

## What it is

Automated extraction of key performance indicators from Vault data, visualized in a live dashboard that is directly tied to the client's plan milestones. Advisors configure which metrics each client sees. The dashboard updates as new data arrives.

## MVP: what gets built in 90 days

| In scope (MVP) Automated KPI extraction from Vault data (revenue, pipeline, margins, operational metrics) Core chart types: trend line, bar, progress-to-goal, traffic light status Milestone linkage: each KPI tied to a plan milestone Advisor configuration layer \- choose which metrics each client sees Sync error alerting \- surface failed connector refreshes immediately | Out of scope (follow-on) Client self-configuration of dashboard Benchmarking against industry peers Predictive / forecasting visualizations Embedded commentary or AI-written insight summaries Export to PDF / PowerPoint |  |
| :---- | :---- | :---- |

## Definition of done

* A client opens their dashboard and all numbers are current, correct, and visibly linked to their plan

* No advisor manually updated any data \- the dashboard refreshed automatically

* A failed connector sync triggers an alert within 15 minutes

| Key experiments \- Phase 3 Metric relevance: which KPIs correlate most with plan milestone completion? Survey advisors and clients after the first live dashboards to calibrate defaults. Data freshness cadence: how often does the Vault need to refresh for dashboards to feel meaningful? Daily is a reasonable starting hypothesis \- test it. |
| :---- |

| Biggest risk Connector reliability. A dashboard showing stale numbers \- because a QuickBooks file was never uploaded, trust is destroyed faster than having no dashboard at all. Robust error surfacing is not a nice-to-have; it must be built in Phase 3, not retrofitted. |
| :---- |

| PHASE 4 | Daily Coaching \+ Human-in-the-Loop | Weeks 11–13 |
| :---: | :---- | ----: |

## What it is

A daily check-in layer that keeps clients accountable to their plan, and an advisor-facing queue that surfaces lagging clients so human judgment can be applied where it matters most. Together, these form the accountability and quality ceiling that pure AI tools cannot replicate.

## MVP: what gets built in 90 days

| In scope (MVP) Daily check-in delivery via email (tied to that week's milestones) Client progress logging: simple done / stuck / skipped status per milestone Escalation rules: flag clients who are 2+ milestones behind to advisor queue Advisor review queue: at-a-glance view of flagged clients with context Advisor intervention tools: message client, update plan, add note Feedback loop: advisor edits tagged and fed back to improve future coaching tone | Out of scope (follow-on) In-app push notifications Voice / SMS check-in channels AI-to-client chat (coaching conversation vs. daily message) Automated plan adjustment without advisor review Client-to-client community or peer accountability features |  |
| :---- | :---- | :---- |

## Definition of done

* A client describes feeling 'held accountable' \- not nagged \- after two weeks of daily check-ins

* An advisor can identify which clients need attention and act within 5 minutes, from the review queue alone

* Advisor load: each advisor can manage 10+ active clients without the queue becoming the bottleneck

| Key experiments \- Phase 4 Coaching tone and cadence: A/B test directive vs. encouraging message framing. Test daily vs. every-other-day frequency. Measure open rate and milestone completion rate. Escalation threshold calibration: what signal reliably predicts a client is off-track vs. slow to log progress? Start with '2 milestones behind' and refine from data. Advisor queue design: how much context does an advisor need to act confidently in \< 5 minutes? Prototype two queue layouts and observe time-to-intervention. |
| :---- |

| Biggest risk Notification fatigue. If daily check-ins feel irrelevant or repetitive, clients will ignore them \- and the entire accountability loop collapses. Personalization quality is load-bearing here. Use the Vault and plan context aggressively in message generation; generic reminders are worse than silence. |
| :---- |

# Cross-Cutting Priorities

## What spans all four phases

Several concerns cannot be deferred to a later phase \- they must be designed in from the start:

* **AI output quality review.**  Every AI output that reaches a client must pass through human review in Phase 2, and move toward a quality-scored automation gate in Phases 3–4. Budget advisor time for this from day one, not as a retrofit.  
* **Connector depth over breadth.**  Support QuickBooks deeply before adding Salesforce, HubSpot, or Xero. A broken connector on a client's primary system is catastrophic; a missing connector is merely a gap.  
* **White-glove onboarding.**  Vault setup requires client effort. While the self-serve flow is being built, advisors should personally guide every onboarding. Observe where clients get stuck \- that's the product roadmap.  
* **Advisor bandwidth as a constraint.**  The HITL model only works if advisors aren't overwhelmed. Design the escalation queue to be triaged by AI \- humans see only cases that genuinely require judgment.

## Top risks by severity

| Severity | Risk | Mitigation |
| :---- | :---- | :---- |
| **High** | **AI output quality at scale** | Human review gate on all client-facing outputs; track edit rate as a leading quality indicator |
| **High** | **Vault data quality undermining downstream features** | Run a real-client data test in week 1; set a quality floor before Phase 2 begins |
| **Medium** | **Connector sync failures eroding dashboard trust** | Build sync error alerting in Phase 3; treat reliability as a P0 requirement, not polish |
| **Medium** | **Advisor bandwidth becoming a bottleneck** | AI-triage the escalation queue; advisors see only genuine judgment calls |
| **Low** | **Client onboarding friction causing early churn** | White-glove onboarding for all early clients; automate only after observing the friction points |

