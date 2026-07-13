slug	name	type	unit	category	stock_flow	formula	definition					
total_revenue	Total Revenue	core	dollars	Financial	flow		Sum of all sales income recognized in the period, before any costs. Include all P&L revenue lines; exclude loans, owner contributions, and asset sales.					
total_cogs	Total COGS	core	dollars	Financial	flow		Direct cost of producing or delivering what was sold in the period (materials, direct labor, inbound freight). Excludes overhead.					
total_operating_expenses	Total Operating Expenses	core	dollars	Financial	flow		Overhead incurred in the period (SG&A, rent, salaries, marketing, etc.). Excludes COGS, depreciation, interest, and taxes.					
total_depreciation	Total Depreciation	core	dollars	Financial	flow		Depreciation and amortization expense recognized in the period.					
total_interest	Total Interest	core	dollars	Financial	flow		Interest expense on debt in the period.					
total_taxes	Total Taxes	core	dollars	Financial	flow		Income or business taxes attributable to the period.					
marketing_spend	Marketing Spend	core	dollars	Financial	flow		Spend on customer acquisition in the period (ads, campaigns, agency). A subset of Operating Expenses, tracked separately for CAC.					
total_member_revenue	Total Member Revenue	core	dollars	Membership	flow		Revenue from memberships or subscriptions in the period. A subset of Total Revenue.					
cash	Cash	core	dollars	Financial	stock		Cash and cash equivalents on hand at the observation date.					
accounts_receivable_dollars	Accounts Receivable (dollars)	core	dollars	Financial	stock		Total outstanding customer invoices unpaid at the observation date.					
accounts_receivable_count	Accounts Receivable (count)	core	units	Financial	stock		Count of open or unpaid invoices (or customer accounts) at the observation date.					
active_customers	Active Customers	core	units	Customers	stock		Distinct customers considered active at the observation date, per the client's active definition.					
new_customers_acquired	New Customers Acquired	core	units	Customers	flow		Count of customers acquired for the first time during the period. Required to derive churn and CAC.					
headcount	Headcount	core	units	People	stock		Number of employees at the observation date (define FTE vs. headcount convention per client).					
b2b_leads	B2B Leads	core	units	B2B Pipeline	flow		New leads entering the funnel in the period.					
b2b_prospects	B2B Prospects	core	units	B2B Pipeline	flow		Leads qualified into prospects in the period.					
b2b_won	B2B Won	core	units	B2B Pipeline	flow		Deals closed-won in the period.					
b2b_lost	B2B Lost	core	units	B2B Pipeline	flow		Deals closed-lost in the period.					
members_total	Members Total	core	units	Membership	stock		Total active members at the observation date.					
paid_in_full_members	Paid in Full Members	core	units	Membership	stock		Members on a paid-in-full plan at the observation date.					
paid_in_full_renewals	Paid in Full Renewals	core	units	Membership	flow		Paid-in-full memberships renewed in the period.					
net_new_customers	Net New Customers	derived	units	Customers		active_customers(end) - active_customers(baseline)	Change in active customer count over the period versus the baseline.					
net_new_revenue	Net New Revenue	derived	dollars	Financial		total_revenue(period) - total_revenue(baseline)	Change in revenue over the period versus the baseline.					
lost_customers	Lost Customers	derived	units	Customers		new_customers_acquired - net_new_customers	Customers lost during the period, derived once New Customers Acquired is observed.					
annualized_revenue	Annualized Revenue	derived	dollars	Financial		total_revenue(period) * periods_per_year	Period revenue scaled to a full year (e.g. monthly revenue x 12).					
average_member_revenue	Average Member Revenue	derived	dollars	Membership		total_member_revenue / members_total	Average revenue per member for the period.					
b2b_marketing_cost_per_lead	B2B Marketing Cost per Lead	derived	dollars	B2B Pipeline		marketing_spend / b2b_leads	Average marketing cost to generate one lead.					
customer_acquisition_cost	Customer Acquisition Cost (CAC)	derived	dollars	Customers		marketing_spend / new_customers_acquired	Average marketing cost to acquire one new customer. Uses gross customers acquired, not net.					
days_sales_outstanding	Days Sales Outstanding (DSO)	derived	days	Financial		(accounts_receivable_dollars / total_revenue) * days_in_period	Average number of days to collect receivables.					
gross_profit	Gross Profit	ratio	dollars	Financial		total_revenue - total_cogs	Revenue remaining after direct costs.					
gross_margin	Gross Margin	ratio	ratio	Financial		(total_revenue - total_cogs) / total_revenue	Share of revenue kept after direct costs.					
ebitda	EBITDA	ratio	dollars	Financial		total_revenue - total_cogs - total_operating_expenses	Earnings before interest, taxes, depreciation, and amortization.					
net_income	Net Income / Net Profit	ratio	dollars	Financial		total_revenue - total_cogs - total_operating_expenses - total_depreciation - total_interest - total_taxes	True bottom-line profit for the period.					
net_margin	Net Margin	ratio	ratio	Financial		net_income / total_revenue	Share of revenue kept as net profit.					
revenue_per_employee	Revenue per Employee	ratio	dollars	People		total_revenue / headcount	Revenue produced per employee.					
churn_rate	Churn Rate	ratio	ratio	Customers		lost_customers / active_customers(baseline)	Share of starting customers lost during the period.					