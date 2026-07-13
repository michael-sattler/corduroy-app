-- Seed: All-American Fitness Q3 2026 plan from docs/corduroy_90day_plan_q3_2026.json
-- Idempotent: safe to re-run (ON CONFLICT / upsert patterns).
-- Prerequisite: a client row must exist (npm run db:seed creates All-American Fitness).

-- ---------------------------------------------------------------------------
-- Resolve client
-- ---------------------------------------------------------------------------

do $$
declare
  v_client_id uuid;
  v_plan_row_id uuid := 'b179851f-d049-4e05-8803-e460aa0218ed'::uuid;
  v_source_json jsonb;
begin
  v_source_json := $plan_json${"schema_version":"1.0","generated_at":"2026-05-01T00:00:00Z","plan_id":"aaf-90day-2026-q3","client":{"plan_client_id":"aaf-001","external_client_id":null,"name":"All-American Fitness","owner":"Antonio Ferrara","advisor":"Joseph Rizzo","location":"Morristown, NJ","industry":"Boutique Fitness / Personal Training","plan_period":{"label":"Q3 2026","start_date":"2026-06-01","end_date":"2026-08-31"}},"plan_meta":{"audit_document":"AAF_Marketing_Audit_Final_Deliverables_JR_12-23-25.pdf","audit_date":"2026-05-01","plan_generated_date":"2026-05-01","status":"active","current_week":null,"notes":"Generated from May 2026 audit. JSON is write-once generation format. All live status updates flow through Postgres. JSON updated only at milestone boundaries (month-end reviews)."},"goals":[{"goal_id":"g-001","label":"Membership Growth","description":"Add 24 new members in 2026","target":"2 new members per month minimum","metric_ref":"kpi-004","priority":1},{"goal_id":"g-002","label":"Revenue Stabilization","description":"Close the $24K year-over-year gap and return to $250K annual revenue","target":"$21K+ gross revenue per month","metric_ref":"kpi-005","priority":2},{"goal_id":"g-003","label":"Marketing Accountability","description":"Define a repeatable $1K/month marketing budget with measurable ROI","target":"CPL documented for every channel; top source identified by Week 6","metric_ref":"kpi-013","priority":3}],"kpis":[{"kpi_id":"kpi-001","label":"New Leads — All Sources","source":"Lead Log — Google Sheet","baseline":{"initial_value":null,"note":"Unknown — not previously tracked"},"current_value":null,"target":"10+ per month","frequency":"weekly","goal_refs":["g-003"],"history":[]},{"kpi_id":"kpi-002","label":"Lead → Visit Rate","source":"Lead Log — Google Sheet","baseline":{"initial_value":null,"note":"Unknown"},"current_value":null,"target":"50%+","frequency":"weekly","goal_refs":["g-001"],"history":[]},{"kpi_id":"kpi-003","label":"Visit → Member Rate","source":"Lead Log — Google Sheet","baseline":{"initial_value":null,"note":"Unknown"},"current_value":null,"target":"40%+","frequency":"weekly","goal_refs":["g-001"],"history":[]},{"kpi_id":"kpi-004","label":"New Members Signed","source":"GloFox / Lead Log","baseline":{"initial_value":1.5,"note":"~1–2 per month estimated (2025)"},"current_value":null,"target":"2+ per month","frequency":"monthly","goal_refs":["g-001"],"history":[]},{"kpi_id":"kpi-005","label":"Monthly Gross Revenue","source":"QuickBooks / bank statement","baseline":{"initial_value":18000,"note":"$18K avg monthly (2025); $216K annual"},"current_value":null,"target":"$21,000+","frequency":"monthly","goal_refs":["g-002"],"history":[]},{"kpi_id":"kpi-006","label":"MHS Leads Generated","source":"Lead Log — Source: MHS","baseline":{"initial_value":0,"note":"Not previously tracked"},"current_value":null,"target":"10+ per month","frequency":"weekly","goal_refs":["g-001","g-003"],"history":[]},{"kpi_id":"kpi-007","label":"MHS → Paid Conversion","source":"Lead Log — Outcome column","baseline":{"initial_value":0,"note":"Zero conversions tracked"},"current_value":null,"target":"2+ per month","frequency":"monthly","goal_refs":["g-001"],"history":[]},{"kpi_id":"kpi-008","label":"PIF Members Tracked","source":"PIF Tracker tab","baseline":{"initial_value":null,"note":"Not tracked — count unknown"},"current_value":null,"target":"100% of active PIF members in system","frequency":"weekly","goal_refs":["g-002"],"history":[]},{"kpi_id":"kpi-009","label":"PIF Renewal Rate","source":"PIF Tracker tab","baseline":{"initial_value":null,"note":"Unknown — no system in place"},"current_value":null,"target":"80%+","frequency":"monthly","goal_refs":["g-002"],"history":[]},{"kpi_id":"kpi-010","label":"Active B2B Contracts","source":"B2B Pipeline tab","baseline":{"initial_value":1,"note":"Colonials Ice Hockey only"},"current_value":null,"target":"3+ active contracts","frequency":"quarterly","goal_refs":["g-002"],"history":[]},{"kpi_id":"kpi-011","label":"B2B Revenue (Annualized)","source":"QuickBooks","baseline":{"initial_value":28000,"note":"$28K/yr from Colonials = 13% of revenue"},"current_value":null,"target":"$48,000–$56,000/yr","frequency":"quarterly","goal_refs":["g-002"],"history":[]},{"kpi_id":"kpi-012","label":"Net Income","source":"QuickBooks","baseline":{"initial_value":96000,"note":"$96K net income 2025 (down 25% YoY from $128K)"},"current_value":null,"target":"Stabilize; trend positive QoQ","frequency":"quarterly","goal_refs":["g-002"],"history":[]},{"kpi_id":"kpi-013","label":"Marketing Cost Per Lead (CPL)","source":"Lead Log + budget records","baseline":{"initial_value":null,"note":"Unknown — no tracking in place"},"current_value":null,"target":"< $50 per lead","frequency":"monthly","goal_refs":["g-003"],"history":[]}],"initiatives":[{"initiative_id":"init-001","label":"MHS Lead Funnel","description":"Transform daily MHS coaching access into a structured lead generation engine","owner":"antonio","kpi_refs":["kpi-006","kpi-007"],"goal_refs":["g-001"],"success_criteria":"10+ MHS leads/month; 2+ converted to paid training/month","budget_usd":100,"status":"not_started","task_refs":[]},{"initiative_id":"init-002","label":"B2B Expansion — Clone the Colonials","description":"Replicate the Colonials Ice Hockey contract model with 2–3 additional travel team clients","owner":"both","kpi_refs":["kpi-010","kpi-011"],"goal_refs":["g-002"],"success_criteria":"2 new team contracts signed by end of August ($15K–$20K new revenue)","budget_usd":50,"status":"not_started","task_refs":[]},{"initiative_id":"init-003","label":"PIF Renewal System","description":"Build a proactive PIF tracking and renewal workflow to eliminate cash cliffs","owner":"antonio","kpi_refs":["kpi-008","kpi-009"],"goal_refs":["g-002"],"success_criteria":"80%+ renewal rate; zero surprise expirations","budget_usd":0,"status":"not_started","task_refs":[]},{"initiative_id":"init-004","label":"Lead Tracking & Marketing Accountability","description":"Instrument every marketing channel with tracking and establish a weekly review cadence","owner":"both","kpi_refs":["kpi-001","kpi-002","kpi-003","kpi-013"],"goal_refs":["g-003"],"success_criteria":"CPL documented for every channel; top source identified by Week 6","budget_usd":1000,"status":"not_started","task_refs":[]}],"months":[{"month_id":"month-001","label":"Month 1","name":"June 2026","start_date":"2026-06-01","end_date":"2026-06-30","theme":"Foundation — Get systems live. Start generating and tracking leads.","goal_refs":["g-001","g-002","g-003"],"weeks":[{"week_id":"week-001","week_number":1,"month_ref":"month-001","label":"Week 1","start_date":"2026-06-01","end_date":"2026-06-06"},{"week_id":"week-002","week_number":2,"month_ref":"month-001","label":"Week 2","start_date":"2026-06-07","end_date":"2026-06-13"},{"week_id":"week-003","week_number":3,"month_ref":"month-001","label":"Week 3","start_date":"2026-06-14","end_date":"2026-06-20"},{"week_id":"week-004","week_number":4,"month_ref":"month-001","label":"Week 4","start_date":"2026-06-21","end_date":"2026-06-27"},{"week_id":"week-005","week_number":5,"month_ref":"month-001","label":"Week 5","start_date":"2026-06-28","end_date":"2026-06-30"}],"check_in":{"check_in_id":"ci-001","type":"month_end_review","label":"Month 1 Check-In","scheduled_week_ref":"week-005","participants":["antonio","corduroy"],"agenda":["Leads by source — which channels are producing?","Lead → Visit → Member conversion funnel — where is it leaking?","Revenue vs. $21K/month target","PIF renewal status — any surprises?","B2B pipeline update — responses, assessment days booked","GloFox decision: keep or cancel?"],"status":"not_started","completed_at":null,"notes":null}},{"month_id":"month-002","label":"Month 2","name":"July 2026","start_date":"2026-07-01","end_date":"2026-07-31","theme":"Conversion — Close B2B deals. Convert MHS leads. Formalize referrals.","goal_refs":["g-001","g-002"],"weeks":[{"week_id":"week-006","week_number":6,"month_ref":"month-002","label":"Week 6","start_date":"2026-06-28","end_date":"2026-07-04"},{"week_id":"week-007","week_number":7,"month_ref":"month-002","label":"Week 7","start_date":"2026-07-05","end_date":"2026-07-11"},{"week_id":"week-008","week_number":8,"month_ref":"month-002","label":"Week 8","start_date":"2026-07-12","end_date":"2026-07-18"},{"week_id":"week-009","week_number":9,"month_ref":"month-002","label":"Week 9","start_date":"2026-07-19","end_date":"2026-07-25"},{"week_id":"week-010","week_number":10,"month_ref":"month-002","label":"Week 10","start_date":"2026-07-26","end_date":"2026-08-01"}],"check_in":{"check_in_id":"ci-002","type":"month_end_review","label":"Month 2 Check-In","scheduled_week_ref":"week-010","participants":["antonio","corduroy"],"agenda":["Month 2 leads by source — what changed from Month 1?","Conversion funnel update — Visit → Member rate improving?","Revenue vs. $21K/month target","Referral program results — leads generated, cost per referral","B2B pipeline: proposals sent, verbal commitments, signed contracts","Valpak CPL decision: keep or reallocate budget?","MHS funnel analysis: submission rate, conversion rate, adjustments needed"],"status":"not_started","completed_at":null,"notes":null}},{"month_id":"month-003","label":"Month 3","name":"August 2026","start_date":"2026-08-01","end_date":"2026-08-31","theme":"Scale and Optimize — Close Q1. Launch Fall Pack. Set Q4.","goal_refs":["g-001","g-002","g-003"],"weeks":[{"week_id":"week-011","week_number":11,"month_ref":"month-003","label":"Week 11","start_date":"2026-07-26","end_date":"2026-08-01"},{"week_id":"week-012","week_number":12,"month_ref":"month-003","label":"Week 12","start_date":"2026-08-02","end_date":"2026-08-08"},{"week_id":"week-013","week_number":13,"month_ref":"month-003","label":"Week 13","start_date":"2026-08-09","end_date":"2026-08-15"},{"week_id":"week-014","week_number":14,"month_ref":"month-003","label":"Week 14","start_date":"2026-08-16","end_date":"2026-08-22"},{"week_id":"week-015","week_number":15,"month_ref":"month-003","label":"Week 15","start_date":"2026-08-23","end_date":"2026-08-31"}],"check_in":{"check_in_id":"ci-003","type":"milestone_review","label":"90-Day Final Review","scheduled_week_ref":"week-015","participants":["antonio","corduroy"],"agenda":["Full Q1 audit: total leads, sources, conversions, new members","Revenue vs. $21K/month target — 3-month trend","B2B contracts: 2 signed target — met or not? Why?","PIF renewal rate: 80%+ target — met or not?","MHS funnel: 30 leads / 6 conversions over 90 days — met or not?","Marketing CPL by channel — final channel scorecard","What worked, what didn't, what to scale in Q4","Set Q4 2026 goals and draft Month 4 plan"],"status":"not_started","completed_at":null,"notes":null}}],"tasks":[{"task_id":"t-001","label":"Set up Google Sheet: Lead Log, PIF Tracker, B2B Pipeline, Dashboard tabs","category":"Systems & Setup","initiative_ref":"init-004","owner":"corduroy","week_refs":["week-001"],"month_ref":"month-001","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"Google Sheet live and shared with Antonio","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-002","label":"Log all existing member/client contacts into Lead Log with source","category":"Systems & Setup","initiative_ref":"init-004","owner":"antonio","week_refs":["week-001"],"month_ref":"month-001","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"All known contacts entered with Source field populated","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-003","label":"Enter 100% of current PIF members into PIF Tracker (credits, expiration dates)","category":"Systems & Setup","initiative_ref":"init-003","owner":"antonio","week_refs":["week-001"],"month_ref":"month-001","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"PIF Tracker 100% populated — credits and expiration dates for every PIF member","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-004","label":"Add Valpak tracking code / unique phone number for next mailing","category":"Systems & Setup","initiative_ref":"init-004","owner":"corduroy","week_refs":["week-001"],"month_ref":"month-001","status":"not_started","priority":"medium","is_recurring":false,"is_meeting":false,"deliverable":"Tracking code or phone number assigned and documented in Lead Log source options","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-005","label":"Order MHS business cards with QR code (Varsity Fast-Track Assessment)","category":"Systems & Setup","initiative_ref":"init-001","owner":"corduroy","week_refs":["week-001"],"month_ref":"month-001","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"Cards ordered; QR code destination URL confirmed","notes":"Budget: ~$50–100","completed_at":null,"change_history":[]},{"task_id":"t-006","label":"Build Varsity Fast-Track Assessment QR code landing page","category":"Systems & Setup","initiative_ref":"init-001","owner":"corduroy","week_refs":["week-002"],"month_ref":"month-001","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"Live landing page capturing: name, sport, phone, email","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-007","label":"GloFox evaluation: schedule support call to assess CRM lead-tracking features","category":"Systems & Setup","initiative_ref":"init-004","owner":"both","week_refs":["week-002"],"month_ref":"month-001","status":"not_started","priority":"medium","is_recurring":false,"is_meeting":true,"deliverable":"Support call completed; recommendation documented (keep / cancel)","notes":"$309/month at stake","completed_at":null,"change_history":[]},{"task_id":"t-008","label":"Begin distributing MHS cards to athletes at every coaching session","category":"MHS Lead Funnel","initiative_ref":"init-001","owner":"antonio","week_refs":["week-002","week-003","week-004","week-005"],"month_ref":"month-001","status":"not_started","priority":"high","is_recurring":true,"is_meeting":false,"deliverable":"50+ cards distributed by end of June","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-009","label":"Ask every new contact 'How did you hear about us?' and log source in Lead Log","category":"Lead Tracking","initiative_ref":"init-004","owner":"antonio","week_refs":["week-001","week-002","week-003","week-004","week-005"],"month_ref":"month-001","status":"not_started","priority":"high","is_recurring":true,"is_meeting":false,"deliverable":"100% of new contacts logged with source field populated","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-010","label":"Follow up with MHS leads who submitted assessment form (within 48 hours)","category":"MHS Lead Funnel","initiative_ref":"init-001","owner":"antonio","week_refs":["week-003","week-004","week-005"],"month_ref":"month-001","status":"not_started","priority":"high","is_recurring":true,"is_meeting":false,"deliverable":"Zero MHS leads left uncontacted for more than 48 hours","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-011","label":"Identify top 10 local travel team prospects for B2B outreach","category":"B2B Expansion","initiative_ref":"init-002","owner":"both","week_refs":["week-002"],"month_ref":"month-001","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"10 prospects entered in B2B Pipeline tab with contact info and sport","notes":"Target sports: Lacrosse, Hockey, Baseball, Soccer, Basketball","completed_at":null,"change_history":[]},{"task_id":"t-012","label":"Draft B2B one-pager: 'Off-Season Strength & Conditioning' proposal","category":"B2B Expansion","initiative_ref":"init-002","owner":"corduroy","week_refs":["week-003"],"month_ref":"month-001","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"One-pager drafted using Colonials deal as template; ready for Antonio review","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-013","label":"Antonio reviews and approves B2B one-pager","category":"B2B Expansion","initiative_ref":"init-002","owner":"antonio","week_refs":["week-003"],"month_ref":"month-001","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"One-pager approved and ready to send","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-014","label":"Send B2B outreach emails to all 10 prospects","category":"B2B Expansion","initiative_ref":"init-002","owner":"corduroy","week_refs":["week-003"],"month_ref":"month-001","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"10 outreach emails sent; logged in B2B Pipeline tab","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-015","label":"Follow up on B2B emails (call or LinkedIn if no response within 5 days)","category":"B2B Expansion","initiative_ref":"init-002","owner":"antonio","week_refs":["week-004"],"month_ref":"month-001","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"All 10 prospects followed up; B2B Pipeline updated with responses","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-016","label":"Book free team assessment days for interested B2B prospects","category":"B2B Expansion","initiative_ref":"init-002","owner":"antonio","week_refs":["week-004","week-005"],"month_ref":"month-001","status":"not_started","priority":"medium","is_recurring":false,"is_meeting":false,"deliverable":"At least 1 team assessment day booked","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-017","label":"Contact PIF members expiring in June or July — personal call or text","category":"PIF Renewal System","initiative_ref":"init-003","owner":"antonio","week_refs":["week-002"],"month_ref":"month-001","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"100% of June/July-expiring PIF members personally contacted","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-018","label":"Offer PIF renewal incentive: 5% discount for early renewal OR bonus session for referral","category":"PIF Renewal System","initiative_ref":"init-003","owner":"antonio","week_refs":["week-002","week-003"],"month_ref":"month-001","status":"not_started","priority":"medium","is_recurring":false,"is_meeting":false,"deliverable":"Renewal offer communicated to all expiring PIF members","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-019","label":"Set up 60/30/7-day renewal reminder workflow in PIF Tracker","category":"PIF Renewal System","initiative_ref":"init-003","owner":"corduroy","week_refs":["week-002"],"month_ref":"month-001","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"PIF Tracker has alert columns for 60/30/7 days; auto-highlighting active","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-020","label":"Weekly Monday review: leads by source, stuck leads, conversion rate","category":"Lead Tracking","initiative_ref":"init-004","owner":"both","week_refs":["week-002","week-003","week-004","week-005"],"month_ref":"month-001","status":"not_started","priority":"high","is_recurring":true,"is_meeting":true,"deliverable":"Weekly review completed; any stuck leads actioned","notes":"30 minutes every Monday","completed_at":null,"change_history":[]},{"task_id":"t-021","label":"Review pricing: implement June 2026 rate increase ($5–10/hr)","category":"Lead Tracking","initiative_ref":"init-004","owner":"antonio","week_refs":["week-002"],"month_ref":"month-001","status":"not_started","priority":"medium","is_recurring":false,"is_meeting":false,"deliverable":"New pricing in effect and communicated to new prospects","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-022","label":"GloFox decision: keep or cancel","category":"Lead Tracking","initiative_ref":"init-004","owner":"both","week_refs":["week-003"],"month_ref":"month-001","status":"not_started","priority":"medium","is_recurring":false,"is_meeting":true,"deliverable":"Decision made and documented; action taken if cancelling","notes":"$309/month ($3,700/year) at stake","completed_at":null,"change_history":[]},{"task_id":"t-023","label":"Review Weeks 1–2 lead data: which sources producing? Cut or double down","category":"Lead Tracking","initiative_ref":"init-004","owner":"both","week_refs":["week-003"],"month_ref":"month-001","status":"not_started","priority":"medium","is_recurring":false,"is_meeting":false,"deliverable":"Channel ranking documented; budget or time reallocation decision made","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-024","label":"MONTH-END REVIEW: Leads, funnel, revenue, PIF, B2B, GloFox decision","category":"Month-End Check-In","initiative_ref":null,"owner":"both","week_refs":["week-005"],"month_ref":"month-001","status":"not_started","priority":"high","is_recurring":false,"is_meeting":true,"check_in_ref":"ci-001","deliverable":"Month 1 review completed; Month 2 priorities confirmed","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-025","label":"Conduct booked B2B team assessment days","category":"B2B Expansion","initiative_ref":"init-002","owner":"antonio","week_refs":["week-006","week-007"],"month_ref":"month-002","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"Assessment days completed; B2B Pipeline updated with outcomes","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-026","label":"Prepare formal B2B proposals for interested prospects (price, scope, schedule)","category":"B2B Expansion","initiative_ref":"init-002","owner":"corduroy","week_refs":["week-007"],"month_ref":"month-002","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"Formal proposals drafted and ready for Antonio review","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-027","label":"Antonio reviews and sends B2B proposals","category":"B2B Expansion","initiative_ref":"init-002","owner":"antonio","week_refs":["week-007"],"month_ref":"month-002","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"All proposals sent; logged in B2B Pipeline with sent date","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-028","label":"Follow up on all B2B proposals — push for decision or next meeting","category":"B2B Expansion","initiative_ref":"init-002","owner":"antonio","week_refs":["week-008","week-009"],"month_ref":"month-002","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"All proposals have a decision or a next meeting scheduled","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-029","label":"Identify 5 additional B2B prospects for fall sports season","category":"B2B Expansion","initiative_ref":"init-002","owner":"both","week_refs":["week-009"],"month_ref":"month-002","status":"not_started","priority":"medium","is_recurring":false,"is_meeting":false,"deliverable":"5 fall-season prospects added to B2B Pipeline tab","notes":"Target: fall conditioning needs starting September","completed_at":null,"change_history":[]},{"task_id":"t-030","label":"Launch formal referral program: $50 account credit per new paying member","category":"Referral Program","initiative_ref":"init-004","owner":"corduroy","week_refs":["week-006"],"month_ref":"month-002","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"Referral program live; one-pager and social post ready","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-031","label":"Antonio personally contacts all active members to announce referral program","category":"Referral Program","initiative_ref":"init-004","owner":"antonio","week_refs":["week-006"],"month_ref":"month-002","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"100% of active members personally notified (call or text)","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-032","label":"Log all referral leads with Source = 'Referral' and note who referred them","category":"Referral Program","initiative_ref":"init-004","owner":"antonio","week_refs":["week-007","week-008","week-009","week-010"],"month_ref":"month-002","status":"not_started","priority":"high","is_recurring":true,"is_meeting":false,"deliverable":"All referral leads logged; referrer identified in Notes field","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-033","label":"60-day PIF alert: contact all members with credits expiring in September","category":"PIF Renewal System","initiative_ref":"init-003","owner":"antonio","week_refs":["week-006"],"month_ref":"month-002","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"All September-expiring PIF members personally contacted","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-034","label":"30-day PIF alert: follow up on August expirations","category":"PIF Renewal System","initiative_ref":"init-003","owner":"antonio","week_refs":["week-008"],"month_ref":"month-002","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"All August-expiring PIF members followed up","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-035","label":"Analyze MHS funnel: scans → submissions → assessments → conversions","category":"MHS Lead Funnel","initiative_ref":"init-001","owner":"corduroy","week_refs":["week-008"],"month_ref":"month-002","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"Funnel conversion rates documented at each stage","notes":"If form submission rate < 15%, test different headline or offer in Week 9","completed_at":null,"change_history":[]},{"task_id":"t-036","label":"Adjust MHS offer if form submission rate < 15%","category":"MHS Lead Funnel","initiative_ref":"init-001","owner":"both","week_refs":["week-009"],"month_ref":"month-002","status":"not_started","priority":"medium","is_recurring":false,"is_meeting":false,"deliverable":"Updated offer or headline live on landing page","notes":"Conditional on Week 8 funnel analysis","completed_at":null,"change_history":[]},{"task_id":"t-037","label":"Valpak accountability check: leads from last mailing, CPL calculation","category":"Lead Tracking","initiative_ref":"init-004","owner":"both","week_refs":["week-009"],"month_ref":"month-002","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"CPL calculated; decision documented: keep or reallocate budget","notes":"Decision rule: if CPL > $50 with no conversions, reallocate to referral or digital","completed_at":null,"change_history":[]},{"task_id":"t-038","label":"MONTH-END REVIEW: Month 2 leads, conversions, revenue, B2B, referrals, Valpak CPL decision","category":"Month-End Check-In","initiative_ref":null,"owner":"both","week_refs":["week-010"],"month_ref":"month-002","status":"not_started","priority":"high","is_recurring":false,"is_meeting":true,"check_in_ref":"ci-002","deliverable":"Month 2 review completed; Month 3 priorities confirmed","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-039","label":"Close open B2B negotiations — target: 2 total signed contracts by end of August","category":"B2B Expansion","initiative_ref":"init-002","owner":"antonio","week_refs":["week-011","week-012"],"month_ref":"month-003","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"2 new B2B contracts signed","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-040","label":"Onboard newly signed B2B clients; document what works for future sales","category":"B2B Expansion","initiative_ref":"init-002","owner":"both","week_refs":["week-012","week-013"],"month_ref":"month-003","status":"not_started","priority":"medium","is_recurring":false,"is_meeting":false,"deliverable":"Onboarding notes documented in B2B Pipeline; playbook started","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-041","label":"Identify 10 B2B prospects for fall sports season outreach","category":"B2B Expansion","initiative_ref":"init-002","owner":"corduroy","week_refs":["week-014"],"month_ref":"month-003","status":"not_started","priority":"medium","is_recurring":false,"is_meeting":false,"deliverable":"10 Q4 prospects listed in B2B Pipeline tab","notes":"For September outreach","completed_at":null,"change_history":[]},{"task_id":"t-042","label":"Draft Fall Performance Pack offer targeting returning students and athletes","category":"Seasonal Offer","initiative_ref":"init-001","owner":"corduroy","week_refs":["week-012"],"month_ref":"month-003","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"Offer defined: price, duration, eligibility, urgency mechanism","notes":"Model on Winter Pack concept","completed_at":null,"change_history":[]},{"task_id":"t-043","label":"Antonio tests Fall Pack offer with 3–5 existing member contacts before launch","category":"Seasonal Offer","initiative_ref":"init-001","owner":"antonio","week_refs":["week-013"],"month_ref":"month-003","status":"not_started","priority":"medium","is_recurring":false,"is_meeting":false,"deliverable":"Feedback from 3–5 contacts; offer refined if needed","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-044","label":"Launch Fall Pack promotion: Instagram/Facebook ($200 budget), MHS network, referrals","category":"Seasonal Offer","initiative_ref":"init-001","owner":"both","week_refs":["week-014"],"month_ref":"month-003","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"Promotion live across all channels","notes":"Budget: $200 social ads","completed_at":null,"change_history":[]},{"task_id":"t-045","label":"Final Fall Pack urgency push: 'Last 5 spots' messaging if not sold out","category":"Seasonal Offer","initiative_ref":"init-001","owner":"antonio","week_refs":["week-015"],"month_ref":"month-003","status":"not_started","priority":"medium","is_recurring":false,"is_meeting":false,"deliverable":"Final push sent; sales logged","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-046","label":"Review MHS data at 90-day mark: 15%+ form submission rate?","category":"MHS Lead Funnel","initiative_ref":"init-001","owner":"both","week_refs":["week-013"],"month_ref":"month-003","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"Funnel performance documented against 15% submission rate target","notes":"If not met, test new offer for Q4","completed_at":null,"change_history":[]},{"task_id":"t-047","label":"Personal check-in calls to June/July MHS converts — getting results? Referrals?","category":"MHS Lead Funnel","initiative_ref":"init-001","owner":"antonio","week_refs":["week-014"],"month_ref":"month-003","status":"not_started","priority":"medium","is_recurring":false,"is_meeting":false,"deliverable":"All early converts checked in; referral asks made","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-048","label":"60-day PIF alert: contact members with credits expiring in October","category":"PIF Renewal System","initiative_ref":"init-003","owner":"antonio","week_refs":["week-011"],"month_ref":"month-003","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"All October-expiring PIF members personally contacted","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-049","label":"30-day PIF alert: follow up on September expirations","category":"PIF Renewal System","initiative_ref":"init-003","owner":"antonio","week_refs":["week-013"],"month_ref":"month-003","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"All September-expiring PIF members followed up","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-050","label":"7-day PIF alert: final renewal push for imminent expirations","category":"PIF Renewal System","initiative_ref":"init-003","owner":"antonio","week_refs":["week-014","week-015"],"month_ref":"month-003","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"All imminent expirations personally contacted; renewals logged","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-051","label":"Formally cut any channel with zero trackable leads over 10 weeks","category":"Lead Tracking","initiative_ref":"init-004","owner":"both","week_refs":["week-012"],"month_ref":"month-003","status":"not_started","priority":"medium","is_recurring":false,"is_meeting":false,"deliverable":"Channel decisions documented; budget reallocated","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-052","label":"Double down on top lead source identified from 8+ weeks of data","category":"Lead Tracking","initiative_ref":"init-004","owner":"antonio","week_refs":["week-012"],"month_ref":"month-003","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"Increased time or budget allocated to top source","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-053","label":"Personal check-in calls to all June joiners — zero churn goal; ask for referrals","category":"Lead Tracking","initiative_ref":"init-004","owner":"antonio","week_refs":["week-013"],"month_ref":"month-003","status":"not_started","priority":"medium","is_recurring":false,"is_meeting":false,"deliverable":"100% of June joiners checked in; referral asks logged","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-054","label":"Calculate actual marketing CPL and CPA for each channel","category":"Lead Tracking","initiative_ref":"init-004","owner":"corduroy","week_refs":["week-015"],"month_ref":"month-003","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"CPL and CPA documented per channel; final channel scorecard complete","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-055","label":"Corduroy prepares 90-Day Milestone Summary document","category":"90-Day Review","initiative_ref":null,"owner":"corduroy","week_refs":["week-015"],"month_ref":"month-003","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"Milestone Summary document delivered to Antonio before final review call","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-056","label":"Set Q4 2026 goals and draft Month 4 plan","category":"90-Day Review","initiative_ref":null,"owner":"both","week_refs":["week-015"],"month_ref":"month-003","status":"not_started","priority":"high","is_recurring":false,"is_meeting":false,"deliverable":"Q4 goals defined; Month 4 plan drafted","notes":null,"completed_at":null,"change_history":[]},{"task_id":"t-057","label":"90-DAY FINAL REVIEW: Full audit — leads, members, revenue, B2B, PIF, CPL. Set Q4 plan.","category":"90-Day Review","initiative_ref":null,"owner":"both","week_refs":["week-015"],"month_ref":"month-003","status":"not_started","priority":"high","is_recurring":false,"is_meeting":true,"check_in_ref":"ci-003","deliverable":"90-day review completed; Q4 plan confirmed","notes":null,"completed_at":null,"change_history":[]}],"budget":{"monthly_total_usd":1000,"allocations":[{"category":"Paid Advertising (Valpak / Digital)","monthly_usd":400,"note":"Valpak tracked with unique code. If CPL > $50 with no conversions, reallocate to digital."},{"category":"Referral Incentives","monthly_usd":200,"note":"$50 account credit per successful referral. Paid from revenue."},{"category":"Promotional Materials","monthly_usd":150,"note":"MHS cards, QR codes, B2B proposal printing. One-time ~$100."},{"category":"Local Sponsorships / Events","monthly_usd":150,"note":"Defer until B2B and MHS funnels are live."},{"category":"Contingency / New Tests","monthly_usd":100,"note":"Fall Pack social ads, new channel experiments."}]},"success_criteria":[{"metric":"New members added (90-day total)","target":"6+ (2/month)","kpi_ref":"kpi-004"},{"metric":"Monthly gross revenue","target":"$21,000+/month","kpi_ref":"kpi-005"},{"metric":"New B2B contracts signed","target":"2 (3 total active)","kpi_ref":"kpi-010"},{"metric":"PIF renewal rate","target":"80%+, zero surprise expirations","kpi_ref":"kpi-009"},{"metric":"MHS leads generated (90-day total)","target":"30+","kpi_ref":"kpi-006"},{"metric":"MHS paid conversions (90-day total)","target":"6+","kpi_ref":"kpi-007"},{"metric":"Lead tracker completeness","target":"100% — every lead logged with source","kpi_ref":"kpi-001"},{"metric":"Marketing CPL documented","target":"All channels measured","kpi_ref":"kpi-013"},{"metric":"Valpak decision","target":"Keep or cut — decided from real data","kpi_ref":"kpi-013"},{"metric":"GloFox decision","target":"Keep or cancel — decided by end of June","kpi_ref":null}]}$plan_json$::jsonb;

  select id into v_client_id
  from public.clients
  where id = '9811e315-7f2d-4484-9929-709900bb1bbd'::uuid
     or plan_client_id = 'aaf-001'
     or name = 'All-American Fitness'
     or name = 'Acme Corp'
     or name = 'Acme'
  order by
    case
      when id = '9811e315-7f2d-4484-9929-709900bb1bbd'::uuid then 0
      when plan_client_id = 'aaf-001' then 1
      when name = 'All-American Fitness' then 2
      else 3
    end
  limit 1;

  if v_client_id is null then
    raise exception 'Client not found. Run: npm run db:seed (creates All-American Fitness / Acme Corp)';
  end if;

  update public.clients set
    plan_client_id = 'aaf-001',
    owner_name = 'Antonio Ferrara',
    advisor_name = 'Joseph Rizzo',
    industry = 'Boutique Fitness / Personal Training',
    ccp = 3
  where id = v_client_id;

  insert into public.plans (
    id, client_id, plan_id, schema_version, period_start, period_end, status, source_json, generated_at
  ) values (
    v_plan_row_id,
    v_client_id,
    'aaf-90day-2026-q3',
    '1.0',
    '2026-06-01'::date,
    '2026-08-31'::date,
    'active',
    v_source_json,
    '2026-05-01T00:00:00Z'::timestamptz
  )
  on conflict (client_id, plan_id) do update set
    schema_version = excluded.schema_version,
    period_start = excluded.period_start,
    period_end = excluded.period_end,
    status = excluded.status,
    source_json = excluded.source_json,
    generated_at = excluded.generated_at;

  insert into public.plan_goals (id, plan_id, goal_id, label, description, target, priority)
  values (
    '0921176d-bf57-41d3-8eca-bc337ce5f2e2'::uuid,
    v_plan_row_id,
    'g-001',
    'Membership Growth',
    'Add 24 new members in 2026',
    '2 new members per month minimum',
    1
  ) on conflict (plan_id, goal_id) do update set
    label = excluded.label, description = excluded.description,
    target = excluded.target, priority = excluded.priority;

  insert into public.plan_goals (id, plan_id, goal_id, label, description, target, priority)
  values (
    '48725091-ec9a-41d1-88a8-2354654b2ea5'::uuid,
    v_plan_row_id,
    'g-002',
    'Revenue Stabilization',
    'Close the $24K year-over-year gap and return to $250K annual revenue',
    '$21K+ gross revenue per month',
    2
  ) on conflict (plan_id, goal_id) do update set
    label = excluded.label, description = excluded.description,
    target = excluded.target, priority = excluded.priority;

  insert into public.plan_goals (id, plan_id, goal_id, label, description, target, priority)
  values (
    'd1d99675-6653-42a0-83ec-75e4cb494832'::uuid,
    v_plan_row_id,
    'g-003',
    'Marketing Accountability',
    'Define a repeatable $1K/month marketing budget with measurable ROI',
    'CPL documented for every channel; top source identified by Week 6',
    3
  ) on conflict (plan_id, goal_id) do update set
    label = excluded.label, description = excluded.description,
    target = excluded.target, priority = excluded.priority;

  insert into public.metric_definitions (
    id, client_id, metric_key, label, family, tier, kind, unit,
    update_interval, benchmarkable, needs_review
  ) values (
    '8678af76-ccb3-42c1-866e-4e10c2c140ed'::uuid,
    v_client_id,
    'kpi_001',
    'New Leads — All Sources',
    'acquisition',
    'bespoke', 'observed', 'count',
    'weekly', false, true
  ) on conflict (client_id, metric_key) where (client_id is not null) do update set
    label = excluded.label, update_interval = excluded.update_interval;

  insert into public.client_metrics (id, client_id, definition_id, source_binding)
  values (
    'ab443e56-1c4c-4752-860b-eef9154ac0f6'::uuid,
    v_client_id,
    '8678af76-ccb3-42c1-866e-4e10c2c140ed'::uuid,
    'Lead Log — Google Sheet'
  ) on conflict (client_id, definition_id) do update set
    source_binding = excluded.source_binding;

  insert into public.plan_kpis (
    id, plan_id, client_metric_id, kpi_id, baseline_snapshot,
    baseline_established, target, review_cadence
  ) values (
    'cdec0ae2-1476-4f2d-8db1-6b9ebb1469f2'::uuid,
    v_plan_row_id,
    'ab443e56-1c4c-4752-860b-eef9154ac0f6'::uuid,
    'kpi-001',
    null,
    false,
    '10+ per month',
    'weekly'
  ) on conflict (plan_id, kpi_id) do update set
    baseline_snapshot = excluded.baseline_snapshot,
    baseline_established = excluded.baseline_established,
    target = excluded.target, review_cadence = excluded.review_cadence;

  insert into public.metric_definitions (
    id, client_id, metric_key, label, family, tier, kind, unit,
    update_interval, benchmarkable, needs_review
  ) values (
    'dbf06c4c-7266-4e74-8f1d-686d05d5fe2d'::uuid,
    v_client_id,
    'kpi_002',
    'Lead → Visit Rate',
    'acquisition',
    'bespoke', 'observed', 'percent',
    'weekly', false, true
  ) on conflict (client_id, metric_key) where (client_id is not null) do update set
    label = excluded.label, update_interval = excluded.update_interval;

  insert into public.client_metrics (id, client_id, definition_id, source_binding)
  values (
    '360ef70a-f5b2-4ed7-89af-47096594a3db'::uuid,
    v_client_id,
    'dbf06c4c-7266-4e74-8f1d-686d05d5fe2d'::uuid,
    'Lead Log — Google Sheet'
  ) on conflict (client_id, definition_id) do update set
    source_binding = excluded.source_binding;

  insert into public.plan_kpis (
    id, plan_id, client_metric_id, kpi_id, baseline_snapshot,
    baseline_established, target, review_cadence
  ) values (
    '2f43bdda-ca1f-4fb9-8fc7-7a47d4368156'::uuid,
    v_plan_row_id,
    '360ef70a-f5b2-4ed7-89af-47096594a3db'::uuid,
    'kpi-002',
    null,
    false,
    '50%+',
    'weekly'
  ) on conflict (plan_id, kpi_id) do update set
    baseline_snapshot = excluded.baseline_snapshot,
    baseline_established = excluded.baseline_established,
    target = excluded.target, review_cadence = excluded.review_cadence;

  insert into public.metric_definitions (
    id, client_id, metric_key, label, family, tier, kind, unit,
    update_interval, benchmarkable, needs_review
  ) values (
    '2c97400f-6f0f-41e9-81d1-bfb4c791f698'::uuid,
    v_client_id,
    'kpi_003',
    'Visit → Member Rate',
    'acquisition',
    'bespoke', 'observed', 'percent',
    'weekly', false, true
  ) on conflict (client_id, metric_key) where (client_id is not null) do update set
    label = excluded.label, update_interval = excluded.update_interval;

  insert into public.client_metrics (id, client_id, definition_id, source_binding)
  values (
    '04b29d89-7f7f-42ca-8d62-a0f448fad50e'::uuid,
    v_client_id,
    '2c97400f-6f0f-41e9-81d1-bfb4c791f698'::uuid,
    'Lead Log — Google Sheet'
  ) on conflict (client_id, definition_id) do update set
    source_binding = excluded.source_binding;

  insert into public.plan_kpis (
    id, plan_id, client_metric_id, kpi_id, baseline_snapshot,
    baseline_established, target, review_cadence
  ) values (
    'ad5146c7-d27f-403a-8478-1e0aa36ee128'::uuid,
    v_plan_row_id,
    '04b29d89-7f7f-42ca-8d62-a0f448fad50e'::uuid,
    'kpi-003',
    null,
    false,
    '40%+',
    'weekly'
  ) on conflict (plan_id, kpi_id) do update set
    baseline_snapshot = excluded.baseline_snapshot,
    baseline_established = excluded.baseline_established,
    target = excluded.target, review_cadence = excluded.review_cadence;

  insert into public.metric_definitions (
    id, client_id, metric_key, label, family, tier, kind, unit,
    update_interval, benchmarkable, needs_review
  ) values (
    'a51ad414-c5a6-485f-8fea-4767a65a6995'::uuid,
    v_client_id,
    'kpi_004',
    'New Members Signed',
    'acquisition',
    'bespoke', 'observed', 'count',
    'monthly', false, true
  ) on conflict (client_id, metric_key) where (client_id is not null) do update set
    label = excluded.label, update_interval = excluded.update_interval;

  insert into public.client_metrics (id, client_id, definition_id, source_binding)
  values (
    'f51594bd-7f62-46d4-88e5-277356309ac1'::uuid,
    v_client_id,
    'a51ad414-c5a6-485f-8fea-4767a65a6995'::uuid,
    'GloFox / Lead Log'
  ) on conflict (client_id, definition_id) do update set
    source_binding = excluded.source_binding;

  insert into public.plan_kpis (
    id, plan_id, client_metric_id, kpi_id, baseline_snapshot,
    baseline_established, target, review_cadence
  ) values (
    '39989856-64d1-45b5-82bb-0f5e50bd7b4c'::uuid,
    v_plan_row_id,
    'f51594bd-7f62-46d4-88e5-277356309ac1'::uuid,
    'kpi-004',
    1.5,
    true,
    '2+ per month',
    'monthly'
  ) on conflict (plan_id, kpi_id) do update set
    baseline_snapshot = excluded.baseline_snapshot,
    baseline_established = excluded.baseline_established,
    target = excluded.target, review_cadence = excluded.review_cadence;

  insert into public.metric_definitions (
    id, client_id, metric_key, label, family, tier, kind, unit,
    update_interval, benchmarkable, needs_review
  ) values (
    '001d0abd-35d8-4369-885e-914b2c3d37ea'::uuid,
    v_client_id,
    'kpi_005',
    'Monthly Gross Revenue',
    'profitability',
    'bespoke', 'observed', 'currency',
    'monthly', false, true
  ) on conflict (client_id, metric_key) where (client_id is not null) do update set
    label = excluded.label, update_interval = excluded.update_interval;

  insert into public.client_metrics (id, client_id, definition_id, source_binding)
  values (
    '04cae5ee-9cb8-4f94-8832-7f27ba570019'::uuid,
    v_client_id,
    '001d0abd-35d8-4369-885e-914b2c3d37ea'::uuid,
    'QuickBooks / bank statement'
  ) on conflict (client_id, definition_id) do update set
    source_binding = excluded.source_binding;

  insert into public.plan_kpis (
    id, plan_id, client_metric_id, kpi_id, baseline_snapshot,
    baseline_established, target, review_cadence
  ) values (
    '99e7e9c4-13a5-41db-8972-6c8614cb6810'::uuid,
    v_plan_row_id,
    '04cae5ee-9cb8-4f94-8832-7f27ba570019'::uuid,
    'kpi-005',
    18000,
    true,
    '$21,000+',
    'monthly'
  ) on conflict (plan_id, kpi_id) do update set
    baseline_snapshot = excluded.baseline_snapshot,
    baseline_established = excluded.baseline_established,
    target = excluded.target, review_cadence = excluded.review_cadence;

  insert into public.metric_definitions (
    id, client_id, metric_key, label, family, tier, kind, unit,
    update_interval, benchmarkable, needs_review
  ) values (
    '03813cb2-5443-4788-80fb-d14c60d281dd'::uuid,
    v_client_id,
    'kpi_006',
    'MHS Leads Generated',
    'acquisition',
    'bespoke', 'observed', 'percent',
    'weekly', false, true
  ) on conflict (client_id, metric_key) where (client_id is not null) do update set
    label = excluded.label, update_interval = excluded.update_interval;

  insert into public.client_metrics (id, client_id, definition_id, source_binding)
  values (
    'f9232c84-f983-455e-8a6f-d7803f82b423'::uuid,
    v_client_id,
    '03813cb2-5443-4788-80fb-d14c60d281dd'::uuid,
    'Lead Log — Source: MHS'
  ) on conflict (client_id, definition_id) do update set
    source_binding = excluded.source_binding;

  insert into public.plan_kpis (
    id, plan_id, client_metric_id, kpi_id, baseline_snapshot,
    baseline_established, target, review_cadence
  ) values (
    '6e4dbac0-239d-464a-8a60-f66938a2c659'::uuid,
    v_plan_row_id,
    'f9232c84-f983-455e-8a6f-d7803f82b423'::uuid,
    'kpi-006',
    0,
    true,
    '10+ per month',
    'weekly'
  ) on conflict (plan_id, kpi_id) do update set
    baseline_snapshot = excluded.baseline_snapshot,
    baseline_established = excluded.baseline_established,
    target = excluded.target, review_cadence = excluded.review_cadence;

  insert into public.metric_definitions (
    id, client_id, metric_key, label, family, tier, kind, unit,
    update_interval, benchmarkable, needs_review
  ) values (
    '5f000b09-aff3-493a-8fc3-58a77484e746'::uuid,
    v_client_id,
    'kpi_007',
    'MHS → Paid Conversion',
    'acquisition',
    'bespoke', 'observed', 'ratio',
    'monthly', false, true
  ) on conflict (client_id, metric_key) where (client_id is not null) do update set
    label = excluded.label, update_interval = excluded.update_interval;

  insert into public.client_metrics (id, client_id, definition_id, source_binding)
  values (
    '42d9919b-1bdd-4261-8b7b-25d98aeeafa9'::uuid,
    v_client_id,
    '5f000b09-aff3-493a-8fc3-58a77484e746'::uuid,
    'Lead Log — Outcome column'
  ) on conflict (client_id, definition_id) do update set
    source_binding = excluded.source_binding;

  insert into public.plan_kpis (
    id, plan_id, client_metric_id, kpi_id, baseline_snapshot,
    baseline_established, target, review_cadence
  ) values (
    'e5ced65a-e86f-442b-870e-2f4630da73cd'::uuid,
    v_plan_row_id,
    '42d9919b-1bdd-4261-8b7b-25d98aeeafa9'::uuid,
    'kpi-007',
    0,
    true,
    '2+ per month',
    'monthly'
  ) on conflict (plan_id, kpi_id) do update set
    baseline_snapshot = excluded.baseline_snapshot,
    baseline_established = excluded.baseline_established,
    target = excluded.target, review_cadence = excluded.review_cadence;

  insert into public.metric_definitions (
    id, client_id, metric_key, label, family, tier, kind, unit,
    update_interval, benchmarkable, needs_review
  ) values (
    'c39e028d-016d-4c08-820d-84238f1aa1fe'::uuid,
    v_client_id,
    'kpi_008',
    'PIF Members Tracked',
    'acquisition',
    'bespoke', 'observed', 'count',
    'weekly', false, true
  ) on conflict (client_id, metric_key) where (client_id is not null) do update set
    label = excluded.label, update_interval = excluded.update_interval;

  insert into public.client_metrics (id, client_id, definition_id, source_binding)
  values (
    '5d133db3-f02f-41fb-8034-c0e3a226246f'::uuid,
    v_client_id,
    'c39e028d-016d-4c08-820d-84238f1aa1fe'::uuid,
    'PIF Tracker tab'
  ) on conflict (client_id, definition_id) do update set
    source_binding = excluded.source_binding;

  insert into public.plan_kpis (
    id, plan_id, client_metric_id, kpi_id, baseline_snapshot,
    baseline_established, target, review_cadence
  ) values (
    '36196a37-c2c2-475d-804e-16bf7b272f04'::uuid,
    v_plan_row_id,
    '5d133db3-f02f-41fb-8034-c0e3a226246f'::uuid,
    'kpi-008',
    null,
    false,
    '100% of active PIF members in system',
    'weekly'
  ) on conflict (plan_id, kpi_id) do update set
    baseline_snapshot = excluded.baseline_snapshot,
    baseline_established = excluded.baseline_established,
    target = excluded.target, review_cadence = excluded.review_cadence;

  insert into public.metric_definitions (
    id, client_id, metric_key, label, family, tier, kind, unit,
    update_interval, benchmarkable, needs_review
  ) values (
    'adc8732e-b2a9-4b97-8c58-74119f7ea542'::uuid,
    v_client_id,
    'kpi_009',
    'PIF Renewal Rate',
    'retention',
    'bespoke', 'observed', 'percent',
    'monthly', false, true
  ) on conflict (client_id, metric_key) where (client_id is not null) do update set
    label = excluded.label, update_interval = excluded.update_interval;

  insert into public.client_metrics (id, client_id, definition_id, source_binding)
  values (
    'a7c23001-0e35-44b2-8c47-5bed6fea92db'::uuid,
    v_client_id,
    'adc8732e-b2a9-4b97-8c58-74119f7ea542'::uuid,
    'PIF Tracker tab'
  ) on conflict (client_id, definition_id) do update set
    source_binding = excluded.source_binding;

  insert into public.plan_kpis (
    id, plan_id, client_metric_id, kpi_id, baseline_snapshot,
    baseline_established, target, review_cadence
  ) values (
    'd3607f98-54e2-4f7c-88cb-56bcffd601a4'::uuid,
    v_plan_row_id,
    'a7c23001-0e35-44b2-8c47-5bed6fea92db'::uuid,
    'kpi-009',
    null,
    false,
    '80%+',
    'monthly'
  ) on conflict (plan_id, kpi_id) do update set
    baseline_snapshot = excluded.baseline_snapshot,
    baseline_established = excluded.baseline_established,
    target = excluded.target, review_cadence = excluded.review_cadence;

  insert into public.metric_definitions (
    id, client_id, metric_key, label, family, tier, kind, unit,
    update_interval, benchmarkable, needs_review
  ) values (
    'b3bbb82c-fdac-439f-81dc-4f502b1b4ba6'::uuid,
    v_client_id,
    'kpi_010',
    'Active B2B Contracts',
    'productivity',
    'bespoke', 'observed', 'count',
    'quarterly', false, true
  ) on conflict (client_id, metric_key) where (client_id is not null) do update set
    label = excluded.label, update_interval = excluded.update_interval;

  insert into public.client_metrics (id, client_id, definition_id, source_binding)
  values (
    '49a9274e-f707-4f01-88df-c44960188644'::uuid,
    v_client_id,
    'b3bbb82c-fdac-439f-81dc-4f502b1b4ba6'::uuid,
    'B2B Pipeline tab'
  ) on conflict (client_id, definition_id) do update set
    source_binding = excluded.source_binding;

  insert into public.plan_kpis (
    id, plan_id, client_metric_id, kpi_id, baseline_snapshot,
    baseline_established, target, review_cadence
  ) values (
    '2fe278c3-754a-4eb1-8136-0d25879c7506'::uuid,
    v_plan_row_id,
    '49a9274e-f707-4f01-88df-c44960188644'::uuid,
    'kpi-010',
    1,
    true,
    '3+ active contracts',
    'quarterly'
  ) on conflict (plan_id, kpi_id) do update set
    baseline_snapshot = excluded.baseline_snapshot,
    baseline_established = excluded.baseline_established,
    target = excluded.target, review_cadence = excluded.review_cadence;

  insert into public.metric_definitions (
    id, client_id, metric_key, label, family, tier, kind, unit,
    update_interval, benchmarkable, needs_review
  ) values (
    'ee4ee5de-7fdd-4a9e-86d2-4a60f8eb51d3'::uuid,
    v_client_id,
    'kpi_011',
    'B2B Revenue (Annualized)',
    'profitability',
    'bespoke', 'observed', 'currency',
    'quarterly', false, true
  ) on conflict (client_id, metric_key) where (client_id is not null) do update set
    label = excluded.label, update_interval = excluded.update_interval;

  insert into public.client_metrics (id, client_id, definition_id, source_binding)
  values (
    'bde39191-89f7-499a-8951-6f032f6368cd'::uuid,
    v_client_id,
    'ee4ee5de-7fdd-4a9e-86d2-4a60f8eb51d3'::uuid,
    'QuickBooks'
  ) on conflict (client_id, definition_id) do update set
    source_binding = excluded.source_binding;

  insert into public.plan_kpis (
    id, plan_id, client_metric_id, kpi_id, baseline_snapshot,
    baseline_established, target, review_cadence
  ) values (
    'f3e72719-6c0b-406f-8242-a1abcada258c'::uuid,
    v_plan_row_id,
    'bde39191-89f7-499a-8951-6f032f6368cd'::uuid,
    'kpi-011',
    28000,
    true,
    '$48,000–$56,000/yr',
    'quarterly'
  ) on conflict (plan_id, kpi_id) do update set
    baseline_snapshot = excluded.baseline_snapshot,
    baseline_established = excluded.baseline_established,
    target = excluded.target, review_cadence = excluded.review_cadence;

  insert into public.metric_definitions (
    id, client_id, metric_key, label, family, tier, kind, unit,
    update_interval, benchmarkable, needs_review
  ) values (
    '995fc9bf-0f50-469f-8f45-1a6cad3b4a21'::uuid,
    v_client_id,
    'kpi_012',
    'Net Income',
    'profitability',
    'bespoke', 'observed', 'currency',
    'quarterly', false, true
  ) on conflict (client_id, metric_key) where (client_id is not null) do update set
    label = excluded.label, update_interval = excluded.update_interval;

  insert into public.client_metrics (id, client_id, definition_id, source_binding)
  values (
    '8b297324-c42c-4a39-83c3-616c02ee14a3'::uuid,
    v_client_id,
    '995fc9bf-0f50-469f-8f45-1a6cad3b4a21'::uuid,
    'QuickBooks'
  ) on conflict (client_id, definition_id) do update set
    source_binding = excluded.source_binding;

  insert into public.plan_kpis (
    id, plan_id, client_metric_id, kpi_id, baseline_snapshot,
    baseline_established, target, review_cadence
  ) values (
    '6d726618-f4ca-4535-8040-316000669e63'::uuid,
    v_plan_row_id,
    '8b297324-c42c-4a39-83c3-616c02ee14a3'::uuid,
    'kpi-012',
    96000,
    true,
    'Stabilize; trend positive QoQ',
    'quarterly'
  ) on conflict (plan_id, kpi_id) do update set
    baseline_snapshot = excluded.baseline_snapshot,
    baseline_established = excluded.baseline_established,
    target = excluded.target, review_cadence = excluded.review_cadence;

  insert into public.metric_definitions (
    id, client_id, metric_key, label, family, tier, kind, unit,
    update_interval, benchmarkable, needs_review
  ) values (
    '5411b163-b579-4434-80f8-c5e1318832c6'::uuid,
    v_client_id,
    'kpi_013',
    'Marketing Cost Per Lead (CPL)',
    'acquisition',
    'bespoke', 'observed', 'currency',
    'monthly', false, true
  ) on conflict (client_id, metric_key) where (client_id is not null) do update set
    label = excluded.label, update_interval = excluded.update_interval;

  insert into public.client_metrics (id, client_id, definition_id, source_binding)
  values (
    '6ebf92cb-1a64-4c44-825c-b9419abce636'::uuid,
    v_client_id,
    '5411b163-b579-4434-80f8-c5e1318832c6'::uuid,
    'Lead Log + budget records'
  ) on conflict (client_id, definition_id) do update set
    source_binding = excluded.source_binding;

  insert into public.plan_kpis (
    id, plan_id, client_metric_id, kpi_id, baseline_snapshot,
    baseline_established, target, review_cadence
  ) values (
    '6c987e79-13e7-4c2b-86d7-f4c73f2a6a47'::uuid,
    v_plan_row_id,
    '6ebf92cb-1a64-4c44-825c-b9419abce636'::uuid,
    'kpi-013',
    null,
    false,
    '< $50 per lead',
    'monthly'
  ) on conflict (plan_id, kpi_id) do update set
    baseline_snapshot = excluded.baseline_snapshot,
    baseline_established = excluded.baseline_established,
    target = excluded.target, review_cadence = excluded.review_cadence;

  insert into public.kpi_goal_refs (plan_kpi_id, plan_goal_id)
  values (
    'cdec0ae2-1476-4f2d-8db1-6b9ebb1469f2'::uuid,
    'd1d99675-6653-42a0-83ec-75e4cb494832'::uuid
  ) on conflict do nothing;
  insert into public.kpi_goal_refs (plan_kpi_id, plan_goal_id)
  values (
    '2f43bdda-ca1f-4fb9-8fc7-7a47d4368156'::uuid,
    '0921176d-bf57-41d3-8eca-bc337ce5f2e2'::uuid
  ) on conflict do nothing;
  insert into public.kpi_goal_refs (plan_kpi_id, plan_goal_id)
  values (
    'ad5146c7-d27f-403a-8478-1e0aa36ee128'::uuid,
    '0921176d-bf57-41d3-8eca-bc337ce5f2e2'::uuid
  ) on conflict do nothing;
  insert into public.kpi_goal_refs (plan_kpi_id, plan_goal_id)
  values (
    '39989856-64d1-45b5-82bb-0f5e50bd7b4c'::uuid,
    '0921176d-bf57-41d3-8eca-bc337ce5f2e2'::uuid
  ) on conflict do nothing;
  insert into public.kpi_goal_refs (plan_kpi_id, plan_goal_id)
  values (
    '99e7e9c4-13a5-41db-8972-6c8614cb6810'::uuid,
    '48725091-ec9a-41d1-88a8-2354654b2ea5'::uuid
  ) on conflict do nothing;
  insert into public.kpi_goal_refs (plan_kpi_id, plan_goal_id)
  values (
    '6e4dbac0-239d-464a-8a60-f66938a2c659'::uuid,
    '0921176d-bf57-41d3-8eca-bc337ce5f2e2'::uuid
  ) on conflict do nothing;
  insert into public.kpi_goal_refs (plan_kpi_id, plan_goal_id)
  values (
    '6e4dbac0-239d-464a-8a60-f66938a2c659'::uuid,
    'd1d99675-6653-42a0-83ec-75e4cb494832'::uuid
  ) on conflict do nothing;
  insert into public.kpi_goal_refs (plan_kpi_id, plan_goal_id)
  values (
    'e5ced65a-e86f-442b-870e-2f4630da73cd'::uuid,
    '0921176d-bf57-41d3-8eca-bc337ce5f2e2'::uuid
  ) on conflict do nothing;
  insert into public.kpi_goal_refs (plan_kpi_id, plan_goal_id)
  values (
    '36196a37-c2c2-475d-804e-16bf7b272f04'::uuid,
    '48725091-ec9a-41d1-88a8-2354654b2ea5'::uuid
  ) on conflict do nothing;
  insert into public.kpi_goal_refs (plan_kpi_id, plan_goal_id)
  values (
    'd3607f98-54e2-4f7c-88cb-56bcffd601a4'::uuid,
    '48725091-ec9a-41d1-88a8-2354654b2ea5'::uuid
  ) on conflict do nothing;
  insert into public.kpi_goal_refs (plan_kpi_id, plan_goal_id)
  values (
    '2fe278c3-754a-4eb1-8136-0d25879c7506'::uuid,
    '48725091-ec9a-41d1-88a8-2354654b2ea5'::uuid
  ) on conflict do nothing;
  insert into public.kpi_goal_refs (plan_kpi_id, plan_goal_id)
  values (
    'f3e72719-6c0b-406f-8242-a1abcada258c'::uuid,
    '48725091-ec9a-41d1-88a8-2354654b2ea5'::uuid
  ) on conflict do nothing;
  insert into public.kpi_goal_refs (plan_kpi_id, plan_goal_id)
  values (
    '6d726618-f4ca-4535-8040-316000669e63'::uuid,
    '48725091-ec9a-41d1-88a8-2354654b2ea5'::uuid
  ) on conflict do nothing;
  insert into public.kpi_goal_refs (plan_kpi_id, plan_goal_id)
  values (
    '6c987e79-13e7-4c2b-86d7-f4c73f2a6a47'::uuid,
    'd1d99675-6653-42a0-83ec-75e4cb494832'::uuid
  ) on conflict do nothing;

  insert into public.plan_initiatives (
    id, plan_id, initiative_id, label, owner, success_criteria, budget_usd, status
  ) values (
    'b245e3a2-f29b-4a50-87d9-5edce1d39c67'::uuid,
    v_plan_row_id,
    'init-001',
    'MHS Lead Funnel',
    'client',
    '10+ MHS leads/month; 2+ converted to paid training/month',
    100,
    'not_started'
  ) on conflict (plan_id, initiative_id) do update set
    label = excluded.label, owner = excluded.owner,
    success_criteria = excluded.success_criteria,
    budget_usd = excluded.budget_usd, status = excluded.status;

  insert into public.plan_initiatives (
    id, plan_id, initiative_id, label, owner, success_criteria, budget_usd, status
  ) values (
    '2e6f2fdc-6149-4403-8ecc-3c3b09caf205'::uuid,
    v_plan_row_id,
    'init-002',
    'B2B Expansion — Clone the Colonials',
    'both',
    '2 new team contracts signed by end of August ($15K–$20K new revenue)',
    50,
    'not_started'
  ) on conflict (plan_id, initiative_id) do update set
    label = excluded.label, owner = excluded.owner,
    success_criteria = excluded.success_criteria,
    budget_usd = excluded.budget_usd, status = excluded.status;

  insert into public.plan_initiatives (
    id, plan_id, initiative_id, label, owner, success_criteria, budget_usd, status
  ) values (
    'e1057289-b70c-4ec9-822f-611ae264821a'::uuid,
    v_plan_row_id,
    'init-003',
    'PIF Renewal System',
    'client',
    '80%+ renewal rate; zero surprise expirations',
    0,
    'not_started'
  ) on conflict (plan_id, initiative_id) do update set
    label = excluded.label, owner = excluded.owner,
    success_criteria = excluded.success_criteria,
    budget_usd = excluded.budget_usd, status = excluded.status;

  insert into public.plan_initiatives (
    id, plan_id, initiative_id, label, owner, success_criteria, budget_usd, status
  ) values (
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    v_plan_row_id,
    'init-004',
    'Lead Tracking & Marketing Accountability',
    'both',
    'CPL documented for every channel; top source identified by Week 6',
    1000,
    'not_started'
  ) on conflict (plan_id, initiative_id) do update set
    label = excluded.label, owner = excluded.owner,
    success_criteria = excluded.success_criteria,
    budget_usd = excluded.budget_usd, status = excluded.status;

  insert into public.initiative_kpi_refs (initiative_id, plan_kpi_id)
  values (
    'b245e3a2-f29b-4a50-87d9-5edce1d39c67'::uuid,
    '6e4dbac0-239d-464a-8a60-f66938a2c659'::uuid
  ) on conflict do nothing;
  insert into public.initiative_kpi_refs (initiative_id, plan_kpi_id)
  values (
    'b245e3a2-f29b-4a50-87d9-5edce1d39c67'::uuid,
    'e5ced65a-e86f-442b-870e-2f4630da73cd'::uuid
  ) on conflict do nothing;
  insert into public.initiative_kpi_refs (initiative_id, plan_kpi_id)
  values (
    '2e6f2fdc-6149-4403-8ecc-3c3b09caf205'::uuid,
    '2fe278c3-754a-4eb1-8136-0d25879c7506'::uuid
  ) on conflict do nothing;
  insert into public.initiative_kpi_refs (initiative_id, plan_kpi_id)
  values (
    '2e6f2fdc-6149-4403-8ecc-3c3b09caf205'::uuid,
    'f3e72719-6c0b-406f-8242-a1abcada258c'::uuid
  ) on conflict do nothing;
  insert into public.initiative_kpi_refs (initiative_id, plan_kpi_id)
  values (
    'e1057289-b70c-4ec9-822f-611ae264821a'::uuid,
    '36196a37-c2c2-475d-804e-16bf7b272f04'::uuid
  ) on conflict do nothing;
  insert into public.initiative_kpi_refs (initiative_id, plan_kpi_id)
  values (
    'e1057289-b70c-4ec9-822f-611ae264821a'::uuid,
    'd3607f98-54e2-4f7c-88cb-56bcffd601a4'::uuid
  ) on conflict do nothing;
  insert into public.initiative_kpi_refs (initiative_id, plan_kpi_id)
  values (
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    'cdec0ae2-1476-4f2d-8db1-6b9ebb1469f2'::uuid
  ) on conflict do nothing;
  insert into public.initiative_kpi_refs (initiative_id, plan_kpi_id)
  values (
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    '2f43bdda-ca1f-4fb9-8fc7-7a47d4368156'::uuid
  ) on conflict do nothing;
  insert into public.initiative_kpi_refs (initiative_id, plan_kpi_id)
  values (
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    'ad5146c7-d27f-403a-8478-1e0aa36ee128'::uuid
  ) on conflict do nothing;
  insert into public.initiative_kpi_refs (initiative_id, plan_kpi_id)
  values (
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    '6c987e79-13e7-4c2b-86d7-f4c73f2a6a47'::uuid
  ) on conflict do nothing;

  insert into public.plan_months (
    id, plan_id, month_id, name, start_date, end_date, theme
  ) values (
    'fa54888e-1aa6-4fbc-89b9-31cfe944d668'::uuid,
    v_plan_row_id,
    'month-001',
    'June 2026',
    '2026-06-01'::date,
    '2026-06-30'::date,
    'Foundation — Get systems live. Start generating and tracking leads.'
  ) on conflict (plan_id, month_id) do update set
    name = excluded.name, start_date = excluded.start_date,
    end_date = excluded.end_date, theme = excluded.theme;

  insert into public.plan_weeks (
    id, month_id, week_id, week_number, start_date, end_date, is_boundary_week
  ) values (
    '5e22a29d-7a94-45c2-8a0f-ad2a04a0aa5a'::uuid,
    'fa54888e-1aa6-4fbc-89b9-31cfe944d668'::uuid,
    'week-001',
    1,
    '2026-06-01'::date,
    '2026-06-06'::date,
    false
  ) on conflict (month_id, week_id) do update set
    week_number = excluded.week_number, start_date = excluded.start_date,
    end_date = excluded.end_date, is_boundary_week = excluded.is_boundary_week;

  insert into public.plan_weeks (
    id, month_id, week_id, week_number, start_date, end_date, is_boundary_week
  ) values (
    '9f63d862-e95f-4531-8024-6daa16fc7537'::uuid,
    'fa54888e-1aa6-4fbc-89b9-31cfe944d668'::uuid,
    'week-002',
    2,
    '2026-06-07'::date,
    '2026-06-13'::date,
    false
  ) on conflict (month_id, week_id) do update set
    week_number = excluded.week_number, start_date = excluded.start_date,
    end_date = excluded.end_date, is_boundary_week = excluded.is_boundary_week;

  insert into public.plan_weeks (
    id, month_id, week_id, week_number, start_date, end_date, is_boundary_week
  ) values (
    '185680c1-5a3c-4c2c-8cb4-becaa956a2c0'::uuid,
    'fa54888e-1aa6-4fbc-89b9-31cfe944d668'::uuid,
    'week-003',
    3,
    '2026-06-14'::date,
    '2026-06-20'::date,
    false
  ) on conflict (month_id, week_id) do update set
    week_number = excluded.week_number, start_date = excluded.start_date,
    end_date = excluded.end_date, is_boundary_week = excluded.is_boundary_week;

  insert into public.plan_weeks (
    id, month_id, week_id, week_number, start_date, end_date, is_boundary_week
  ) values (
    'db5e3645-01ca-4062-8e90-7c5b8b4803a1'::uuid,
    'fa54888e-1aa6-4fbc-89b9-31cfe944d668'::uuid,
    'week-004',
    4,
    '2026-06-21'::date,
    '2026-06-27'::date,
    false
  ) on conflict (month_id, week_id) do update set
    week_number = excluded.week_number, start_date = excluded.start_date,
    end_date = excluded.end_date, is_boundary_week = excluded.is_boundary_week;

  insert into public.plan_weeks (
    id, month_id, week_id, week_number, start_date, end_date, is_boundary_week
  ) values (
    '6b968d79-0f81-426c-816d-8f06bce41c48'::uuid,
    'fa54888e-1aa6-4fbc-89b9-31cfe944d668'::uuid,
    'week-005',
    5,
    '2026-06-28'::date,
    '2026-06-30'::date,
    true
  ) on conflict (month_id, week_id) do update set
    week_number = excluded.week_number, start_date = excluded.start_date,
    end_date = excluded.end_date, is_boundary_week = excluded.is_boundary_week;

  insert into public.plan_check_ins (
    id, month_id, check_in_id, type, scheduled_week_id, agenda, status, notes, completed_at
  ) values (
    'bfbecdc7-1cd8-4060-81c0-2de69f853452'::uuid,
    'fa54888e-1aa6-4fbc-89b9-31cfe944d668'::uuid,
    'ci-001',
    'month_end_review',
    '6b968d79-0f81-426c-816d-8f06bce41c48'::uuid,
    '["Leads by source — which channels are producing?","Lead → Visit → Member conversion funnel — where is it leaking?","Revenue vs. $21K/month target","PIF renewal status — any surprises?","B2B pipeline update — responses, assessment days booked","GloFox decision: keep or cancel?"]'::jsonb,
    'scheduled',
    '',
    null
  ) on conflict (month_id, check_in_id) do update set
    type = excluded.type, scheduled_week_id = excluded.scheduled_week_id,
    agenda = excluded.agenda, status = excluded.status,
    notes = excluded.notes, completed_at = excluded.completed_at;

  insert into public.plan_months (
    id, plan_id, month_id, name, start_date, end_date, theme
  ) values (
    '28b43544-3af7-49d4-839e-ba61ff6282b2'::uuid,
    v_plan_row_id,
    'month-002',
    'July 2026',
    '2026-07-01'::date,
    '2026-07-31'::date,
    'Conversion — Close B2B deals. Convert MHS leads. Formalize referrals.'
  ) on conflict (plan_id, month_id) do update set
    name = excluded.name, start_date = excluded.start_date,
    end_date = excluded.end_date, theme = excluded.theme;

  insert into public.plan_weeks (
    id, month_id, week_id, week_number, start_date, end_date, is_boundary_week
  ) values (
    '073be837-a3c4-40c7-80f4-40bf9054460f'::uuid,
    '28b43544-3af7-49d4-839e-ba61ff6282b2'::uuid,
    'week-006',
    6,
    '2026-06-28'::date,
    '2026-07-04'::date,
    true
  ) on conflict (month_id, week_id) do update set
    week_number = excluded.week_number, start_date = excluded.start_date,
    end_date = excluded.end_date, is_boundary_week = excluded.is_boundary_week;

  insert into public.plan_weeks (
    id, month_id, week_id, week_number, start_date, end_date, is_boundary_week
  ) values (
    '883c92dc-d11a-4293-8e9f-db9967457a23'::uuid,
    '28b43544-3af7-49d4-839e-ba61ff6282b2'::uuid,
    'week-007',
    7,
    '2026-07-05'::date,
    '2026-07-11'::date,
    false
  ) on conflict (month_id, week_id) do update set
    week_number = excluded.week_number, start_date = excluded.start_date,
    end_date = excluded.end_date, is_boundary_week = excluded.is_boundary_week;

  insert into public.plan_weeks (
    id, month_id, week_id, week_number, start_date, end_date, is_boundary_week
  ) values (
    'bb65ea53-c7b9-45be-8ca0-60e0a48b3351'::uuid,
    '28b43544-3af7-49d4-839e-ba61ff6282b2'::uuid,
    'week-008',
    8,
    '2026-07-12'::date,
    '2026-07-18'::date,
    false
  ) on conflict (month_id, week_id) do update set
    week_number = excluded.week_number, start_date = excluded.start_date,
    end_date = excluded.end_date, is_boundary_week = excluded.is_boundary_week;

  insert into public.plan_weeks (
    id, month_id, week_id, week_number, start_date, end_date, is_boundary_week
  ) values (
    '632a5e56-04ca-46c0-89d7-97eec9743664'::uuid,
    '28b43544-3af7-49d4-839e-ba61ff6282b2'::uuid,
    'week-009',
    9,
    '2026-07-19'::date,
    '2026-07-25'::date,
    false
  ) on conflict (month_id, week_id) do update set
    week_number = excluded.week_number, start_date = excluded.start_date,
    end_date = excluded.end_date, is_boundary_week = excluded.is_boundary_week;

  insert into public.plan_weeks (
    id, month_id, week_id, week_number, start_date, end_date, is_boundary_week
  ) values (
    '022f24be-99d7-4733-83e1-d0b30980f3c7'::uuid,
    '28b43544-3af7-49d4-839e-ba61ff6282b2'::uuid,
    'week-010',
    10,
    '2026-07-26'::date,
    '2026-08-01'::date,
    true
  ) on conflict (month_id, week_id) do update set
    week_number = excluded.week_number, start_date = excluded.start_date,
    end_date = excluded.end_date, is_boundary_week = excluded.is_boundary_week;

  insert into public.plan_check_ins (
    id, month_id, check_in_id, type, scheduled_week_id, agenda, status, notes, completed_at
  ) values (
    '4c775cd2-d62d-4c04-86b4-ffea233adf94'::uuid,
    '28b43544-3af7-49d4-839e-ba61ff6282b2'::uuid,
    'ci-002',
    'month_end_review',
    '022f24be-99d7-4733-83e1-d0b30980f3c7'::uuid,
    '["Month 2 leads by source — what changed from Month 1?","Conversion funnel update — Visit → Member rate improving?","Revenue vs. $21K/month target","Referral program results — leads generated, cost per referral","B2B pipeline: proposals sent, verbal commitments, signed contracts","Valpak CPL decision: keep or reallocate budget?","MHS funnel analysis: submission rate, conversion rate, adjustments needed"]'::jsonb,
    'scheduled',
    '',
    null
  ) on conflict (month_id, check_in_id) do update set
    type = excluded.type, scheduled_week_id = excluded.scheduled_week_id,
    agenda = excluded.agenda, status = excluded.status,
    notes = excluded.notes, completed_at = excluded.completed_at;

  insert into public.plan_months (
    id, plan_id, month_id, name, start_date, end_date, theme
  ) values (
    '6c78f2cc-f19e-4cbf-8c8d-94c23f961d10'::uuid,
    v_plan_row_id,
    'month-003',
    'August 2026',
    '2026-08-01'::date,
    '2026-08-31'::date,
    'Scale and Optimize — Close Q1. Launch Fall Pack. Set Q4.'
  ) on conflict (plan_id, month_id) do update set
    name = excluded.name, start_date = excluded.start_date,
    end_date = excluded.end_date, theme = excluded.theme;

  insert into public.plan_weeks (
    id, month_id, week_id, week_number, start_date, end_date, is_boundary_week
  ) values (
    '52ed50ce-0e40-4d64-8936-4af577bf61c9'::uuid,
    '6c78f2cc-f19e-4cbf-8c8d-94c23f961d10'::uuid,
    'week-011',
    11,
    '2026-07-26'::date,
    '2026-08-01'::date,
    true
  ) on conflict (month_id, week_id) do update set
    week_number = excluded.week_number, start_date = excluded.start_date,
    end_date = excluded.end_date, is_boundary_week = excluded.is_boundary_week;

  insert into public.plan_weeks (
    id, month_id, week_id, week_number, start_date, end_date, is_boundary_week
  ) values (
    '12e51f7c-1f1d-46c8-85fe-56f611af8cea'::uuid,
    '6c78f2cc-f19e-4cbf-8c8d-94c23f961d10'::uuid,
    'week-012',
    12,
    '2026-08-02'::date,
    '2026-08-08'::date,
    false
  ) on conflict (month_id, week_id) do update set
    week_number = excluded.week_number, start_date = excluded.start_date,
    end_date = excluded.end_date, is_boundary_week = excluded.is_boundary_week;

  insert into public.plan_weeks (
    id, month_id, week_id, week_number, start_date, end_date, is_boundary_week
  ) values (
    'd012b6bf-6bcd-419b-8f77-26b15ee1752e'::uuid,
    '6c78f2cc-f19e-4cbf-8c8d-94c23f961d10'::uuid,
    'week-013',
    13,
    '2026-08-09'::date,
    '2026-08-15'::date,
    false
  ) on conflict (month_id, week_id) do update set
    week_number = excluded.week_number, start_date = excluded.start_date,
    end_date = excluded.end_date, is_boundary_week = excluded.is_boundary_week;

  insert into public.plan_weeks (
    id, month_id, week_id, week_number, start_date, end_date, is_boundary_week
  ) values (
    '8a52a80b-d55b-443e-80e4-32a76bd6e32c'::uuid,
    '6c78f2cc-f19e-4cbf-8c8d-94c23f961d10'::uuid,
    'week-014',
    14,
    '2026-08-16'::date,
    '2026-08-22'::date,
    false
  ) on conflict (month_id, week_id) do update set
    week_number = excluded.week_number, start_date = excluded.start_date,
    end_date = excluded.end_date, is_boundary_week = excluded.is_boundary_week;

  insert into public.plan_weeks (
    id, month_id, week_id, week_number, start_date, end_date, is_boundary_week
  ) values (
    '00e85865-72a8-4540-87da-b5b7155528ee'::uuid,
    '6c78f2cc-f19e-4cbf-8c8d-94c23f961d10'::uuid,
    'week-015',
    15,
    '2026-08-23'::date,
    '2026-08-31'::date,
    false
  ) on conflict (month_id, week_id) do update set
    week_number = excluded.week_number, start_date = excluded.start_date,
    end_date = excluded.end_date, is_boundary_week = excluded.is_boundary_week;

  insert into public.plan_check_ins (
    id, month_id, check_in_id, type, scheduled_week_id, agenda, status, notes, completed_at
  ) values (
    '8ce4f71c-6695-4194-81ac-696a338e8d4d'::uuid,
    '6c78f2cc-f19e-4cbf-8c8d-94c23f961d10'::uuid,
    'ci-003',
    'milestone_review',
    '00e85865-72a8-4540-87da-b5b7155528ee'::uuid,
    '["Full Q1 audit: total leads, sources, conversions, new members","Revenue vs. $21K/month target — 3-month trend","B2B contracts: 2 signed target — met or not? Why?","PIF renewal rate: 80%+ target — met or not?","MHS funnel: 30 leads / 6 conversions over 90 days — met or not?","Marketing CPL by channel — final channel scorecard","What worked, what didn''t, what to scale in Q4","Set Q4 2026 goals and draft Month 4 plan"]'::jsonb,
    'scheduled',
    '',
    null
  ) on conflict (month_id, check_in_id) do update set
    type = excluded.type, scheduled_week_id = excluded.scheduled_week_id,
    agenda = excluded.agenda, status = excluded.status,
    notes = excluded.notes, completed_at = excluded.completed_at;

  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '4c530120-58ad-492e-8e3a-51552b3689e7'::uuid,
    v_plan_row_id,
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    null,
    't-001',
    'Set up Google Sheet: Lead Log, PIF Tracker, B2B Pipeline, Dashboard tabs',
    'Systems & Setup',
    'corduroy',
    'not_started',
    'high',
    false,
    false,
    'Google Sheet live and shared with Antonio',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '4c530120-58ad-492e-8e3a-51552b3689e7'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-001'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'c5400b5b-f4fe-4497-8db0-bdc44a10d9f3'::uuid,
    v_plan_row_id,
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    null,
    't-002',
    'Log all existing member/client contacts into Lead Log with source',
    'Systems & Setup',
    'client',
    'not_started',
    'high',
    false,
    false,
    'All known contacts entered with Source field populated',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'c5400b5b-f4fe-4497-8db0-bdc44a10d9f3'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-001'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '6c030e36-3105-49dc-8317-1e9ae3394975'::uuid,
    v_plan_row_id,
    'e1057289-b70c-4ec9-822f-611ae264821a'::uuid,
    null,
    't-003',
    'Enter 100% of current PIF members into PIF Tracker (credits, expiration dates)',
    'Systems & Setup',
    'client',
    'not_started',
    'high',
    false,
    false,
    'PIF Tracker 100% populated — credits and expiration dates for every PIF member',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '6c030e36-3105-49dc-8317-1e9ae3394975'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-001'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '28fbf6b0-b37a-4c3d-89f9-ff91e84938e2'::uuid,
    v_plan_row_id,
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    null,
    't-004',
    'Add Valpak tracking code / unique phone number for next mailing',
    'Systems & Setup',
    'corduroy',
    'not_started',
    'medium',
    false,
    false,
    'Tracking code or phone number assigned and documented in Lead Log source options',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '28fbf6b0-b37a-4c3d-89f9-ff91e84938e2'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-001'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '144f3907-712b-4b10-8970-0a916be806ad'::uuid,
    v_plan_row_id,
    'b245e3a2-f29b-4a50-87d9-5edce1d39c67'::uuid,
    null,
    't-005',
    'Order MHS business cards with QR code (Varsity Fast-Track Assessment)',
    'Systems & Setup',
    'corduroy',
    'not_started',
    'high',
    false,
    false,
    'Cards ordered; QR code destination URL confirmed',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '144f3907-712b-4b10-8970-0a916be806ad'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-001'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '46bfc642-0add-4844-800c-13653f09c509'::uuid,
    v_plan_row_id,
    'b245e3a2-f29b-4a50-87d9-5edce1d39c67'::uuid,
    null,
    't-006',
    'Build Varsity Fast-Track Assessment QR code landing page',
    'Systems & Setup',
    'corduroy',
    'not_started',
    'high',
    false,
    false,
    'Live landing page capturing: name, sport, phone, email',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '46bfc642-0add-4844-800c-13653f09c509'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-002'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'ccc9d7a8-a25a-4819-840e-9af8a79e06ff'::uuid,
    v_plan_row_id,
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    null,
    't-007',
    'GloFox evaluation: schedule support call to assess CRM lead-tracking features',
    'Systems & Setup',
    'both',
    'not_started',
    'medium',
    false,
    true,
    'Support call completed; recommendation documented (keep / cancel)',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'ccc9d7a8-a25a-4819-840e-9af8a79e06ff'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-002'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'fe1626d1-0d67-44e5-8863-f9d28e222c6c'::uuid,
    v_plan_row_id,
    'b245e3a2-f29b-4a50-87d9-5edce1d39c67'::uuid,
    null,
    't-008',
    'Begin distributing MHS cards to athletes at every coaching session',
    'MHS Lead Funnel',
    'client',
    'not_started',
    'high',
    true,
    false,
    '50+ cards distributed by end of June',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'fe1626d1-0d67-44e5-8863-f9d28e222c6c'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-002'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'fe1626d1-0d67-44e5-8863-f9d28e222c6c'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-003'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'fe1626d1-0d67-44e5-8863-f9d28e222c6c'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-004'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'fe1626d1-0d67-44e5-8863-f9d28e222c6c'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-005'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'a51ba688-e027-45fd-8472-8e741c97f7f1'::uuid,
    v_plan_row_id,
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    null,
    't-009',
    'Ask every new contact ''How did you hear about us?'' and log source in Lead Log',
    'Lead Tracking',
    'client',
    'not_started',
    'high',
    true,
    false,
    '100% of new contacts logged with source field populated',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'a51ba688-e027-45fd-8472-8e741c97f7f1'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-001'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'a51ba688-e027-45fd-8472-8e741c97f7f1'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-002'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'a51ba688-e027-45fd-8472-8e741c97f7f1'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-003'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'a51ba688-e027-45fd-8472-8e741c97f7f1'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-004'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'a51ba688-e027-45fd-8472-8e741c97f7f1'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-005'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '25d54b08-b25d-4115-83ef-f0c5df3f5407'::uuid,
    v_plan_row_id,
    'b245e3a2-f29b-4a50-87d9-5edce1d39c67'::uuid,
    null,
    't-010',
    'Follow up with MHS leads who submitted assessment form (within 48 hours)',
    'MHS Lead Funnel',
    'client',
    'not_started',
    'high',
    true,
    false,
    'Zero MHS leads left uncontacted for more than 48 hours',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '25d54b08-b25d-4115-83ef-f0c5df3f5407'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-003'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '25d54b08-b25d-4115-83ef-f0c5df3f5407'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-004'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '25d54b08-b25d-4115-83ef-f0c5df3f5407'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-005'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'b963e335-2cfd-4d64-8091-8c1f777173d1'::uuid,
    v_plan_row_id,
    '2e6f2fdc-6149-4403-8ecc-3c3b09caf205'::uuid,
    null,
    't-011',
    'Identify top 10 local travel team prospects for B2B outreach',
    'B2B Expansion',
    'both',
    'not_started',
    'high',
    false,
    false,
    '10 prospects entered in B2B Pipeline tab with contact info and sport',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'b963e335-2cfd-4d64-8091-8c1f777173d1'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-002'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'f311afc1-99a7-493b-895a-faa82688fd23'::uuid,
    v_plan_row_id,
    '2e6f2fdc-6149-4403-8ecc-3c3b09caf205'::uuid,
    null,
    't-012',
    'Draft B2B one-pager: ''Off-Season Strength & Conditioning'' proposal',
    'B2B Expansion',
    'corduroy',
    'not_started',
    'high',
    false,
    false,
    'One-pager drafted using Colonials deal as template; ready for Antonio review',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'f311afc1-99a7-493b-895a-faa82688fd23'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-003'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '65cbf153-0b77-41cc-8695-65ce702fb446'::uuid,
    v_plan_row_id,
    '2e6f2fdc-6149-4403-8ecc-3c3b09caf205'::uuid,
    null,
    't-013',
    'Antonio reviews and approves B2B one-pager',
    'B2B Expansion',
    'client',
    'not_started',
    'high',
    false,
    false,
    'One-pager approved and ready to send',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '65cbf153-0b77-41cc-8695-65ce702fb446'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-003'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '7a1884ed-cc95-46cc-8dec-ac448953ac51'::uuid,
    v_plan_row_id,
    '2e6f2fdc-6149-4403-8ecc-3c3b09caf205'::uuid,
    null,
    't-014',
    'Send B2B outreach emails to all 10 prospects',
    'B2B Expansion',
    'corduroy',
    'not_started',
    'high',
    false,
    false,
    '10 outreach emails sent; logged in B2B Pipeline tab',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '7a1884ed-cc95-46cc-8dec-ac448953ac51'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-003'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '263d5763-b305-4f27-8df1-c33b5898288b'::uuid,
    v_plan_row_id,
    '2e6f2fdc-6149-4403-8ecc-3c3b09caf205'::uuid,
    null,
    't-015',
    'Follow up on B2B emails (call or LinkedIn if no response within 5 days)',
    'B2B Expansion',
    'client',
    'not_started',
    'high',
    false,
    false,
    'All 10 prospects followed up; B2B Pipeline updated with responses',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '263d5763-b305-4f27-8df1-c33b5898288b'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-004'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'cc0a7f87-abdc-4c9f-86b1-2d9525b248b7'::uuid,
    v_plan_row_id,
    '2e6f2fdc-6149-4403-8ecc-3c3b09caf205'::uuid,
    null,
    't-016',
    'Book free team assessment days for interested B2B prospects',
    'B2B Expansion',
    'client',
    'not_started',
    'medium',
    false,
    false,
    'At least 1 team assessment day booked',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'cc0a7f87-abdc-4c9f-86b1-2d9525b248b7'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-004'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'cc0a7f87-abdc-4c9f-86b1-2d9525b248b7'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-005'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '9d422e29-ecd4-4f64-8ad3-77921fa8c426'::uuid,
    v_plan_row_id,
    'e1057289-b70c-4ec9-822f-611ae264821a'::uuid,
    null,
    't-017',
    'Contact PIF members expiring in June or July — personal call or text',
    'PIF Renewal System',
    'client',
    'not_started',
    'high',
    false,
    false,
    '100% of June/July-expiring PIF members personally contacted',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '9d422e29-ecd4-4f64-8ad3-77921fa8c426'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-002'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '20b41e81-0e41-4c20-8cd8-c23aed497990'::uuid,
    v_plan_row_id,
    'e1057289-b70c-4ec9-822f-611ae264821a'::uuid,
    null,
    't-018',
    'Offer PIF renewal incentive: 5% discount for early renewal OR bonus session for referral',
    'PIF Renewal System',
    'client',
    'not_started',
    'medium',
    false,
    false,
    'Renewal offer communicated to all expiring PIF members',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '20b41e81-0e41-4c20-8cd8-c23aed497990'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-002'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '20b41e81-0e41-4c20-8cd8-c23aed497990'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-003'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'a453af6f-e238-45c1-83d9-632f7f09217e'::uuid,
    v_plan_row_id,
    'e1057289-b70c-4ec9-822f-611ae264821a'::uuid,
    null,
    't-019',
    'Set up 60/30/7-day renewal reminder workflow in PIF Tracker',
    'PIF Renewal System',
    'corduroy',
    'not_started',
    'high',
    false,
    false,
    'PIF Tracker has alert columns for 60/30/7 days; auto-highlighting active',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'a453af6f-e238-45c1-83d9-632f7f09217e'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-002'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '2920b6ab-f486-40b6-8193-5dfa5429b954'::uuid,
    v_plan_row_id,
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    null,
    't-020',
    'Weekly Monday review: leads by source, stuck leads, conversion rate',
    'Lead Tracking',
    'both',
    'not_started',
    'high',
    true,
    true,
    'Weekly review completed; any stuck leads actioned',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '2920b6ab-f486-40b6-8193-5dfa5429b954'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-002'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '2920b6ab-f486-40b6-8193-5dfa5429b954'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-003'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '2920b6ab-f486-40b6-8193-5dfa5429b954'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-004'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '2920b6ab-f486-40b6-8193-5dfa5429b954'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-005'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '30eb9686-5e34-45a1-82c5-42506082371c'::uuid,
    v_plan_row_id,
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    null,
    't-021',
    'Review pricing: implement June 2026 rate increase ($5–10/hr)',
    'Lead Tracking',
    'client',
    'not_started',
    'medium',
    false,
    false,
    'New pricing in effect and communicated to new prospects',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '30eb9686-5e34-45a1-82c5-42506082371c'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-002'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '3fb3b810-5be5-42e1-83c5-4c92d4709ca2'::uuid,
    v_plan_row_id,
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    null,
    't-022',
    'GloFox decision: keep or cancel',
    'Lead Tracking',
    'both',
    'not_started',
    'medium',
    false,
    true,
    'Decision made and documented; action taken if cancelling',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '3fb3b810-5be5-42e1-83c5-4c92d4709ca2'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-003'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'b6163243-0930-4c03-845c-3261577673f2'::uuid,
    v_plan_row_id,
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    null,
    't-023',
    'Review Weeks 1–2 lead data: which sources producing? Cut or double down',
    'Lead Tracking',
    'both',
    'not_started',
    'medium',
    false,
    false,
    'Channel ranking documented; budget or time reallocation decision made',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'b6163243-0930-4c03-845c-3261577673f2'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-003'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '4d90cbd8-664e-473f-8d68-f32c77a5aa79'::uuid,
    v_plan_row_id,
    null,
    'bfbecdc7-1cd8-4060-81c0-2de69f853452'::uuid,
    't-024',
    'MONTH-END REVIEW: Leads, funnel, revenue, PIF, B2B, GloFox decision',
    'Month-End Check-In',
    'both',
    'not_started',
    'high',
    false,
    true,
    'Month 1 review completed; Month 2 priorities confirmed',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '4d90cbd8-664e-473f-8d68-f32c77a5aa79'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-005'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '376f8756-8914-4816-87b3-da3b9dd4bd91'::uuid,
    v_plan_row_id,
    '2e6f2fdc-6149-4403-8ecc-3c3b09caf205'::uuid,
    null,
    't-025',
    'Conduct booked B2B team assessment days',
    'B2B Expansion',
    'client',
    'not_started',
    'high',
    false,
    false,
    'Assessment days completed; B2B Pipeline updated with outcomes',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '376f8756-8914-4816-87b3-da3b9dd4bd91'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-006'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '376f8756-8914-4816-87b3-da3b9dd4bd91'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-007'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'e496aa10-9389-486f-829f-f4738b6344f0'::uuid,
    v_plan_row_id,
    '2e6f2fdc-6149-4403-8ecc-3c3b09caf205'::uuid,
    null,
    't-026',
    'Prepare formal B2B proposals for interested prospects (price, scope, schedule)',
    'B2B Expansion',
    'corduroy',
    'not_started',
    'high',
    false,
    false,
    'Formal proposals drafted and ready for Antonio review',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'e496aa10-9389-486f-829f-f4738b6344f0'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-007'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '088915e8-873b-40e5-832b-9e9c9fef6f87'::uuid,
    v_plan_row_id,
    '2e6f2fdc-6149-4403-8ecc-3c3b09caf205'::uuid,
    null,
    't-027',
    'Antonio reviews and sends B2B proposals',
    'B2B Expansion',
    'client',
    'not_started',
    'high',
    false,
    false,
    'All proposals sent; logged in B2B Pipeline with sent date',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '088915e8-873b-40e5-832b-9e9c9fef6f87'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-007'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'b5ad5a68-6494-40c1-876d-8863c2c7da6e'::uuid,
    v_plan_row_id,
    '2e6f2fdc-6149-4403-8ecc-3c3b09caf205'::uuid,
    null,
    't-028',
    'Follow up on all B2B proposals — push for decision or next meeting',
    'B2B Expansion',
    'client',
    'not_started',
    'high',
    false,
    false,
    'All proposals have a decision or a next meeting scheduled',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'b5ad5a68-6494-40c1-876d-8863c2c7da6e'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-008'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'b5ad5a68-6494-40c1-876d-8863c2c7da6e'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-009'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'b9c8b451-cc29-40db-8438-6992f0d01708'::uuid,
    v_plan_row_id,
    '2e6f2fdc-6149-4403-8ecc-3c3b09caf205'::uuid,
    null,
    't-029',
    'Identify 5 additional B2B prospects for fall sports season',
    'B2B Expansion',
    'both',
    'not_started',
    'medium',
    false,
    false,
    '5 fall-season prospects added to B2B Pipeline tab',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'b9c8b451-cc29-40db-8438-6992f0d01708'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-009'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '549023ad-e0ea-4785-88cc-c69e679ab6f6'::uuid,
    v_plan_row_id,
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    null,
    't-030',
    'Launch formal referral program: $50 account credit per new paying member',
    'Referral Program',
    'corduroy',
    'not_started',
    'high',
    false,
    false,
    'Referral program live; one-pager and social post ready',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '549023ad-e0ea-4785-88cc-c69e679ab6f6'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-006'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '121f45b3-c8ab-4f18-8539-82d68683ea9b'::uuid,
    v_plan_row_id,
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    null,
    't-031',
    'Antonio personally contacts all active members to announce referral program',
    'Referral Program',
    'client',
    'not_started',
    'high',
    false,
    false,
    '100% of active members personally notified (call or text)',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '121f45b3-c8ab-4f18-8539-82d68683ea9b'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-006'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '3bf4b55f-a948-43e1-80e2-d8ba6af08836'::uuid,
    v_plan_row_id,
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    null,
    't-032',
    'Log all referral leads with Source = ''Referral'' and note who referred them',
    'Referral Program',
    'client',
    'not_started',
    'high',
    true,
    false,
    'All referral leads logged; referrer identified in Notes field',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '3bf4b55f-a948-43e1-80e2-d8ba6af08836'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-007'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '3bf4b55f-a948-43e1-80e2-d8ba6af08836'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-008'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '3bf4b55f-a948-43e1-80e2-d8ba6af08836'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-009'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '3bf4b55f-a948-43e1-80e2-d8ba6af08836'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-010'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '65f98138-20a5-4662-841b-31fe690250f7'::uuid,
    v_plan_row_id,
    'e1057289-b70c-4ec9-822f-611ae264821a'::uuid,
    null,
    't-033',
    '60-day PIF alert: contact all members with credits expiring in September',
    'PIF Renewal System',
    'client',
    'not_started',
    'high',
    false,
    false,
    'All September-expiring PIF members personally contacted',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '65f98138-20a5-4662-841b-31fe690250f7'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-006'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'bf70e7da-5719-422f-87c1-8f03721e2337'::uuid,
    v_plan_row_id,
    'e1057289-b70c-4ec9-822f-611ae264821a'::uuid,
    null,
    't-034',
    '30-day PIF alert: follow up on August expirations',
    'PIF Renewal System',
    'client',
    'not_started',
    'high',
    false,
    false,
    'All August-expiring PIF members followed up',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'bf70e7da-5719-422f-87c1-8f03721e2337'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-008'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '961890fe-86a7-4ebe-86a7-df1b79987384'::uuid,
    v_plan_row_id,
    'b245e3a2-f29b-4a50-87d9-5edce1d39c67'::uuid,
    null,
    't-035',
    'Analyze MHS funnel: scans → submissions → assessments → conversions',
    'MHS Lead Funnel',
    'corduroy',
    'not_started',
    'high',
    false,
    false,
    'Funnel conversion rates documented at each stage',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '961890fe-86a7-4ebe-86a7-df1b79987384'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-008'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'aa11c55d-ba36-4059-8b4a-11277e304cdd'::uuid,
    v_plan_row_id,
    'b245e3a2-f29b-4a50-87d9-5edce1d39c67'::uuid,
    null,
    't-036',
    'Adjust MHS offer if form submission rate < 15%',
    'MHS Lead Funnel',
    'both',
    'not_started',
    'medium',
    false,
    false,
    'Updated offer or headline live on landing page',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'aa11c55d-ba36-4059-8b4a-11277e304cdd'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-009'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '99218d55-bed3-43d0-88ef-8aae292f3b54'::uuid,
    v_plan_row_id,
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    null,
    't-037',
    'Valpak accountability check: leads from last mailing, CPL calculation',
    'Lead Tracking',
    'both',
    'not_started',
    'high',
    false,
    false,
    'CPL calculated; decision documented: keep or reallocate budget',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '99218d55-bed3-43d0-88ef-8aae292f3b54'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-009'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'ae66524c-a2e7-4d17-88de-966eb8108aa2'::uuid,
    v_plan_row_id,
    null,
    '4c775cd2-d62d-4c04-86b4-ffea233adf94'::uuid,
    't-038',
    'MONTH-END REVIEW: Month 2 leads, conversions, revenue, B2B, referrals, Valpak CPL decision',
    'Month-End Check-In',
    'both',
    'not_started',
    'high',
    false,
    true,
    'Month 2 review completed; Month 3 priorities confirmed',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'ae66524c-a2e7-4d17-88de-966eb8108aa2'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-010'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'f24abd2a-a00a-4285-8756-c69064a34925'::uuid,
    v_plan_row_id,
    '2e6f2fdc-6149-4403-8ecc-3c3b09caf205'::uuid,
    null,
    't-039',
    'Close open B2B negotiations — target: 2 total signed contracts by end of August',
    'B2B Expansion',
    'client',
    'not_started',
    'high',
    false,
    false,
    '2 new B2B contracts signed',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'f24abd2a-a00a-4285-8756-c69064a34925'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-011'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'f24abd2a-a00a-4285-8756-c69064a34925'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-012'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '4cc25446-5129-4870-8d67-f9277883fb3e'::uuid,
    v_plan_row_id,
    '2e6f2fdc-6149-4403-8ecc-3c3b09caf205'::uuid,
    null,
    't-040',
    'Onboard newly signed B2B clients; document what works for future sales',
    'B2B Expansion',
    'both',
    'not_started',
    'medium',
    false,
    false,
    'Onboarding notes documented in B2B Pipeline; playbook started',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '4cc25446-5129-4870-8d67-f9277883fb3e'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-012'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '4cc25446-5129-4870-8d67-f9277883fb3e'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-013'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '6a9cd46e-2c9c-4a2d-8951-a3356806007d'::uuid,
    v_plan_row_id,
    '2e6f2fdc-6149-4403-8ecc-3c3b09caf205'::uuid,
    null,
    't-041',
    'Identify 10 B2B prospects for fall sports season outreach',
    'B2B Expansion',
    'corduroy',
    'not_started',
    'medium',
    false,
    false,
    '10 Q4 prospects listed in B2B Pipeline tab',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '6a9cd46e-2c9c-4a2d-8951-a3356806007d'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-014'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '6f30304a-ad34-4606-88eb-849dbf7590dc'::uuid,
    v_plan_row_id,
    'b245e3a2-f29b-4a50-87d9-5edce1d39c67'::uuid,
    null,
    't-042',
    'Draft Fall Performance Pack offer targeting returning students and athletes',
    'Seasonal Offer',
    'corduroy',
    'not_started',
    'high',
    false,
    false,
    'Offer defined: price, duration, eligibility, urgency mechanism',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '6f30304a-ad34-4606-88eb-849dbf7590dc'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-012'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'd4fd5b9d-0adf-45c8-8673-98c0089c0b42'::uuid,
    v_plan_row_id,
    'b245e3a2-f29b-4a50-87d9-5edce1d39c67'::uuid,
    null,
    't-043',
    'Antonio tests Fall Pack offer with 3–5 existing member contacts before launch',
    'Seasonal Offer',
    'client',
    'not_started',
    'medium',
    false,
    false,
    'Feedback from 3–5 contacts; offer refined if needed',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'd4fd5b9d-0adf-45c8-8673-98c0089c0b42'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-013'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '8f0c3402-4c3d-4f7a-8c30-75b5827be0ff'::uuid,
    v_plan_row_id,
    'b245e3a2-f29b-4a50-87d9-5edce1d39c67'::uuid,
    null,
    't-044',
    'Launch Fall Pack promotion: Instagram/Facebook ($200 budget), MHS network, referrals',
    'Seasonal Offer',
    'both',
    'not_started',
    'high',
    false,
    false,
    'Promotion live across all channels',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '8f0c3402-4c3d-4f7a-8c30-75b5827be0ff'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-014'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'd2cb2357-1a9f-4ea1-8548-46ecdcbe2c72'::uuid,
    v_plan_row_id,
    'b245e3a2-f29b-4a50-87d9-5edce1d39c67'::uuid,
    null,
    't-045',
    'Final Fall Pack urgency push: ''Last 5 spots'' messaging if not sold out',
    'Seasonal Offer',
    'client',
    'not_started',
    'medium',
    false,
    false,
    'Final push sent; sales logged',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'd2cb2357-1a9f-4ea1-8548-46ecdcbe2c72'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-015'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '94581faa-340a-4a15-8bcb-03b8dced4a3e'::uuid,
    v_plan_row_id,
    'b245e3a2-f29b-4a50-87d9-5edce1d39c67'::uuid,
    null,
    't-046',
    'Review MHS data at 90-day mark: 15%+ form submission rate?',
    'MHS Lead Funnel',
    'both',
    'not_started',
    'high',
    false,
    false,
    'Funnel performance documented against 15% submission rate target',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '94581faa-340a-4a15-8bcb-03b8dced4a3e'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-013'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '9ae222ad-05d2-4c10-8e6c-449a18475932'::uuid,
    v_plan_row_id,
    'b245e3a2-f29b-4a50-87d9-5edce1d39c67'::uuid,
    null,
    't-047',
    'Personal check-in calls to June/July MHS converts — getting results? Referrals?',
    'MHS Lead Funnel',
    'client',
    'not_started',
    'medium',
    false,
    false,
    'All early converts checked in; referral asks made',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '9ae222ad-05d2-4c10-8e6c-449a18475932'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-014'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '8074cdb0-bf2e-465c-8d4f-5d4b819975f7'::uuid,
    v_plan_row_id,
    'e1057289-b70c-4ec9-822f-611ae264821a'::uuid,
    null,
    't-048',
    '60-day PIF alert: contact members with credits expiring in October',
    'PIF Renewal System',
    'client',
    'not_started',
    'high',
    false,
    false,
    'All October-expiring PIF members personally contacted',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '8074cdb0-bf2e-465c-8d4f-5d4b819975f7'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-011'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '3925573e-d521-46e7-8444-9f952277877d'::uuid,
    v_plan_row_id,
    'e1057289-b70c-4ec9-822f-611ae264821a'::uuid,
    null,
    't-049',
    '30-day PIF alert: follow up on September expirations',
    'PIF Renewal System',
    'client',
    'not_started',
    'high',
    false,
    false,
    'All September-expiring PIF members followed up',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '3925573e-d521-46e7-8444-9f952277877d'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-013'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '68d2b148-0c72-4f5d-82d9-5f5416c1b21c'::uuid,
    v_plan_row_id,
    'e1057289-b70c-4ec9-822f-611ae264821a'::uuid,
    null,
    't-050',
    '7-day PIF alert: final renewal push for imminent expirations',
    'PIF Renewal System',
    'client',
    'not_started',
    'high',
    false,
    false,
    'All imminent expirations personally contacted; renewals logged',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '68d2b148-0c72-4f5d-82d9-5f5416c1b21c'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-014'
  on conflict do nothing;
  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '68d2b148-0c72-4f5d-82d9-5f5416c1b21c'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-015'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'd4f62e4a-994c-4e64-8d74-8640906e0bba'::uuid,
    v_plan_row_id,
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    null,
    't-051',
    'Formally cut any channel with zero trackable leads over 10 weeks',
    'Lead Tracking',
    'both',
    'not_started',
    'medium',
    false,
    false,
    'Channel decisions documented; budget reallocated',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'd4f62e4a-994c-4e64-8d74-8640906e0bba'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-012'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'cf38280b-a7be-4b2d-89b2-95e266574986'::uuid,
    v_plan_row_id,
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    null,
    't-052',
    'Double down on top lead source identified from 8+ weeks of data',
    'Lead Tracking',
    'client',
    'not_started',
    'high',
    false,
    false,
    'Increased time or budget allocated to top source',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'cf38280b-a7be-4b2d-89b2-95e266574986'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-012'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'e13034b2-d246-4641-8a8e-a096abe04b8b'::uuid,
    v_plan_row_id,
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    null,
    't-053',
    'Personal check-in calls to all June joiners — zero churn goal; ask for referrals',
    'Lead Tracking',
    'client',
    'not_started',
    'medium',
    false,
    false,
    '100% of June joiners checked in; referral asks logged',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'e13034b2-d246-4641-8a8e-a096abe04b8b'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-013'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '958f5c02-4421-405d-8bd9-0f6fc8e0aa25'::uuid,
    v_plan_row_id,
    'c18e4a7f-b907-4a4e-8111-69eb86c33723'::uuid,
    null,
    't-054',
    'Calculate actual marketing CPL and CPA for each channel',
    'Lead Tracking',
    'corduroy',
    'not_started',
    'high',
    false,
    false,
    'CPL and CPA documented per channel; final channel scorecard complete',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '958f5c02-4421-405d-8bd9-0f6fc8e0aa25'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-015'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'eb8cc443-dbcc-4b9e-8012-ea2bc3976fdd'::uuid,
    v_plan_row_id,
    null,
    null,
    't-055',
    'Corduroy prepares 90-Day Milestone Summary document',
    '90-Day Review',
    'corduroy',
    'not_started',
    'high',
    false,
    false,
    'Milestone Summary document delivered to Antonio before final review call',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'eb8cc443-dbcc-4b9e-8012-ea2bc3976fdd'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-015'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    'b0eaf720-bf3e-4118-8969-e467448a895b'::uuid,
    v_plan_row_id,
    null,
    null,
    't-056',
    'Set Q4 2026 goals and draft Month 4 plan',
    '90-Day Review',
    'both',
    'not_started',
    'high',
    false,
    false,
    'Q4 goals defined; Month 4 plan drafted',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    'b0eaf720-bf3e-4118-8969-e467448a895b'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-015'
  on conflict do nothing;
  insert into public.plan_tasks (
    id, plan_id, initiative_id, check_in_id, task_id, label, category,
    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at
  ) values (
    '50962745-558d-4f9a-8065-9e6e7e5557d7'::uuid,
    v_plan_row_id,
    null,
    '8ce4f71c-6695-4194-81ac-696a338e8d4d'::uuid,
    't-057',
    '90-DAY FINAL REVIEW: Full audit — leads, members, revenue, B2B, PIF, CPL. Set Q4 plan.',
    '90-Day Review',
    'both',
    'not_started',
    'high',
    false,
    true,
    '90-day review completed; Q4 plan confirmed',
    null
  ) on conflict (plan_id, task_id) do update set
    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,
    label = excluded.label, category = excluded.category, owner = excluded.owner,
    status = excluded.status, priority = excluded.priority,
    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,
    deliverable = excluded.deliverable, completed_at = excluded.completed_at;

  insert into public.task_week_refs (plan_task_id, week_id)
  select
    '50962745-558d-4f9a-8065-9e6e7e5557d7'::uuid,
    pw.id
  from public.plan_weeks pw
  join public.plan_months pm on pm.id = pw.month_id
  where pm.plan_id = v_plan_row_id
    and pw.week_id = 'week-015'
  on conflict do nothing;

  insert into public.plan_budget_allocations (plan_id, category, monthly_usd, note)
  select v_plan_row_id, 'Paid Advertising (Valpak / Digital)', 400, 'Valpak tracked with unique code. If CPL > $50 with no conversions, reallocate to digital.'
  where not exists (
    select 1 from public.plan_budget_allocations pba
    where pba.plan_id = v_plan_row_id and pba.category = 'Paid Advertising (Valpak / Digital)'
  );
  insert into public.plan_budget_allocations (plan_id, category, monthly_usd, note)
  select v_plan_row_id, 'Referral Incentives', 200, '$50 account credit per successful referral. Paid from revenue.'
  where not exists (
    select 1 from public.plan_budget_allocations pba
    where pba.plan_id = v_plan_row_id and pba.category = 'Referral Incentives'
  );
  insert into public.plan_budget_allocations (plan_id, category, monthly_usd, note)
  select v_plan_row_id, 'Promotional Materials', 150, 'MHS cards, QR codes, B2B proposal printing. One-time ~$100.'
  where not exists (
    select 1 from public.plan_budget_allocations pba
    where pba.plan_id = v_plan_row_id and pba.category = 'Promotional Materials'
  );
  insert into public.plan_budget_allocations (plan_id, category, monthly_usd, note)
  select v_plan_row_id, 'Local Sponsorships / Events', 150, 'Defer until B2B and MHS funnels are live.'
  where not exists (
    select 1 from public.plan_budget_allocations pba
    where pba.plan_id = v_plan_row_id and pba.category = 'Local Sponsorships / Events'
  );
  insert into public.plan_budget_allocations (plan_id, category, monthly_usd, note)
  select v_plan_row_id, 'Contingency / New Tests', 100, 'Fall Pack social ads, new channel experiments.'
  where not exists (
    select 1 from public.plan_budget_allocations pba
    where pba.plan_id = v_plan_row_id and pba.category = 'Contingency / New Tests'
  );

  insert into public.plan_success_criteria (plan_id, plan_kpi_id, metric, target)
  select v_plan_row_id, '39989856-64d1-45b5-82bb-0f5e50bd7b4c'::uuid, 'New members added (90-day total)', '6+ (2/month)'
  where not exists (
    select 1 from public.plan_success_criteria psc
    where psc.plan_id = v_plan_row_id and psc.metric = 'New members added (90-day total)'
  );
  insert into public.plan_success_criteria (plan_id, plan_kpi_id, metric, target)
  select v_plan_row_id, '99e7e9c4-13a5-41db-8972-6c8614cb6810'::uuid, 'Monthly gross revenue', '$21,000+/month'
  where not exists (
    select 1 from public.plan_success_criteria psc
    where psc.plan_id = v_plan_row_id and psc.metric = 'Monthly gross revenue'
  );
  insert into public.plan_success_criteria (plan_id, plan_kpi_id, metric, target)
  select v_plan_row_id, '2fe278c3-754a-4eb1-8136-0d25879c7506'::uuid, 'New B2B contracts signed', '2 (3 total active)'
  where not exists (
    select 1 from public.plan_success_criteria psc
    where psc.plan_id = v_plan_row_id and psc.metric = 'New B2B contracts signed'
  );
  insert into public.plan_success_criteria (plan_id, plan_kpi_id, metric, target)
  select v_plan_row_id, 'd3607f98-54e2-4f7c-88cb-56bcffd601a4'::uuid, 'PIF renewal rate', '80%+, zero surprise expirations'
  where not exists (
    select 1 from public.plan_success_criteria psc
    where psc.plan_id = v_plan_row_id and psc.metric = 'PIF renewal rate'
  );
  insert into public.plan_success_criteria (plan_id, plan_kpi_id, metric, target)
  select v_plan_row_id, '6e4dbac0-239d-464a-8a60-f66938a2c659'::uuid, 'MHS leads generated (90-day total)', '30+'
  where not exists (
    select 1 from public.plan_success_criteria psc
    where psc.plan_id = v_plan_row_id and psc.metric = 'MHS leads generated (90-day total)'
  );
  insert into public.plan_success_criteria (plan_id, plan_kpi_id, metric, target)
  select v_plan_row_id, 'e5ced65a-e86f-442b-870e-2f4630da73cd'::uuid, 'MHS paid conversions (90-day total)', '6+'
  where not exists (
    select 1 from public.plan_success_criteria psc
    where psc.plan_id = v_plan_row_id and psc.metric = 'MHS paid conversions (90-day total)'
  );
  insert into public.plan_success_criteria (plan_id, plan_kpi_id, metric, target)
  select v_plan_row_id, 'cdec0ae2-1476-4f2d-8db1-6b9ebb1469f2'::uuid, 'Lead tracker completeness', '100% — every lead logged with source'
  where not exists (
    select 1 from public.plan_success_criteria psc
    where psc.plan_id = v_plan_row_id and psc.metric = 'Lead tracker completeness'
  );
  insert into public.plan_success_criteria (plan_id, plan_kpi_id, metric, target)
  select v_plan_row_id, '6c987e79-13e7-4c2b-86d7-f4c73f2a6a47'::uuid, 'Marketing CPL documented', 'All channels measured'
  where not exists (
    select 1 from public.plan_success_criteria psc
    where psc.plan_id = v_plan_row_id and psc.metric = 'Marketing CPL documented'
  );
  insert into public.plan_success_criteria (plan_id, plan_kpi_id, metric, target)
  select v_plan_row_id, '6c987e79-13e7-4c2b-86d7-f4c73f2a6a47'::uuid, 'Valpak decision', 'Keep or cut — decided from real data'
  where not exists (
    select 1 from public.plan_success_criteria psc
    where psc.plan_id = v_plan_row_id and psc.metric = 'Valpak decision'
  );
  insert into public.plan_success_criteria (plan_id, plan_kpi_id, metric, target)
  select v_plan_row_id, null, 'GloFox decision', 'Keep or cancel — decided by end of June'
  where not exists (
    select 1 from public.plan_success_criteria psc
    where psc.plan_id = v_plan_row_id and psc.metric = 'GloFox decision'
  );
  insert into public.metric_observations (
    client_metric_id, value, observed_on, change_source, recorded_by
  ) select
    '04cae5ee-9cb8-4f94-8832-7f27ba570019'::uuid,
    23870,
    '2024-12-01'::date,
    'agent_ingest', 'aaf_plan_seed'
  where not exists (
    select 1 from public.metric_observations mo
    where mo.client_metric_id = '04cae5ee-9cb8-4f94-8832-7f27ba570019'::uuid
      and mo.observed_on = '2024-12-01'::date
      and mo.change_source = 'agent_ingest'
      and mo.recorded_by = 'aaf_plan_seed'
  );
  insert into public.metric_observations (
    client_metric_id, value, observed_on, change_source, recorded_by
  ) select
    '04cae5ee-9cb8-4f94-8832-7f27ba570019'::uuid,
    12800,
    '2025-12-01'::date,
    'agent_ingest', 'aaf_plan_seed'
  where not exists (
    select 1 from public.metric_observations mo
    where mo.client_metric_id = '04cae5ee-9cb8-4f94-8832-7f27ba570019'::uuid
      and mo.observed_on = '2025-12-01'::date
      and mo.change_source = 'agent_ingest'
      and mo.recorded_by = 'aaf_plan_seed'
  );
  insert into public.metric_observations (
    client_metric_id, value, observed_on, change_source, recorded_by
  ) select
    '04cae5ee-9cb8-4f94-8832-7f27ba570019'::uuid,
    18000,
    '2025-06-01'::date,
    'agent_ingest', 'aaf_plan_seed'
  where not exists (
    select 1 from public.metric_observations mo
    where mo.client_metric_id = '04cae5ee-9cb8-4f94-8832-7f27ba570019'::uuid
      and mo.observed_on = '2025-06-01'::date
      and mo.change_source = 'agent_ingest'
      and mo.recorded_by = 'aaf_plan_seed'
  );
  insert into public.metric_observations (
    client_metric_id, value, observed_on, change_source, recorded_by
  ) select
    '8b297324-c42c-4a39-83c3-616c02ee14a3'::uuid,
    128000,
    '2024-12-31'::date,
    'agent_ingest', 'aaf_plan_seed'
  where not exists (
    select 1 from public.metric_observations mo
    where mo.client_metric_id = '8b297324-c42c-4a39-83c3-616c02ee14a3'::uuid
      and mo.observed_on = '2024-12-31'::date
      and mo.change_source = 'agent_ingest'
      and mo.recorded_by = 'aaf_plan_seed'
  );
  insert into public.metric_observations (
    client_metric_id, value, observed_on, change_source, recorded_by
  ) select
    '8b297324-c42c-4a39-83c3-616c02ee14a3'::uuid,
    96000,
    '2025-12-31'::date,
    'agent_ingest', 'aaf_plan_seed'
  where not exists (
    select 1 from public.metric_observations mo
    where mo.client_metric_id = '8b297324-c42c-4a39-83c3-616c02ee14a3'::uuid
      and mo.observed_on = '2025-12-31'::date
      and mo.change_source = 'agent_ingest'
      and mo.recorded_by = 'aaf_plan_seed'
  );
  insert into public.metric_observations (
    client_metric_id, value, observed_on, change_source, recorded_by
  ) select
    'bde39191-89f7-499a-8951-6f032f6368cd'::uuid,
    28000,
    '2025-06-01'::date,
    'agent_ingest', 'aaf_plan_seed'
  where not exists (
    select 1 from public.metric_observations mo
    where mo.client_metric_id = 'bde39191-89f7-499a-8951-6f032f6368cd'::uuid
      and mo.observed_on = '2025-06-01'::date
      and mo.change_source = 'agent_ingest'
      and mo.recorded_by = 'aaf_plan_seed'
  );
  insert into public.metric_observations (
    client_metric_id, value, observed_on, change_source, recorded_by
  ) select
    '49a9274e-f707-4f01-88df-c44960188644'::uuid,
    1,
    '2025-06-01'::date,
    'agent_ingest', 'aaf_plan_seed'
  where not exists (
    select 1 from public.metric_observations mo
    where mo.client_metric_id = '49a9274e-f707-4f01-88df-c44960188644'::uuid
      and mo.observed_on = '2025-06-01'::date
      and mo.change_source = 'agent_ingest'
      and mo.recorded_by = 'aaf_plan_seed'
  );
  insert into public.metric_observations (
    client_metric_id, value, observed_on, change_source, recorded_by
  ) select
    'f51594bd-7f62-46d4-88e5-277356309ac1'::uuid,
    1.5,
    '2025-01-01'::date,
    'agent_ingest', 'aaf_plan_seed'
  where not exists (
    select 1 from public.metric_observations mo
    where mo.client_metric_id = 'f51594bd-7f62-46d4-88e5-277356309ac1'::uuid
      and mo.observed_on = '2025-01-01'::date
      and mo.change_source = 'agent_ingest'
      and mo.recorded_by = 'aaf_plan_seed'
  );

end $$;
