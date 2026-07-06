============= AccessBroker telltale =================
The pill in the Staff console checks (on load and every five minutes) whether the api can successfully connect with the Lambda that manages files in the Vault.
  1. Next.js → queries GET /api/staff/vault/access-broker-status
  2. Orchestration API → GET /staff/vault/access-broker-status  (apps/api)
  3. Runs → AWS Lambda API  Invoke (DryRun)
So every color reflects what the orchestration API can do with AWS — using whatever env vars and credentials that API process has loaded.


Signal                     | Likely cause	                                  | Fix
----------------------------------------------------------------------------------------
Orange                     | API process has no ACCESS_BROKER_LAMBDA_NAME     | Set in apps/api/.env (or Railway); restart API
Orange after “fixing” .env | Stale API on :4000 (Docker or old node)          | Stop the other one; restart API
Red                        | AWS/IAM/name/region                              | Read detail in tooltip; verify keys + function name
Green                      | All good at platform level                       | Optional: test:vault-presign for full path

# Green — “Lambda invoke permitted (DryRun check)”
DryRun is an AWS Lambda invoke option: “Check that this invoke would be allowed, but don’t run the function.”

- AWS checks: function exists, your IAM user/role has lambda:InvokeFunction, region/name match, etc.
- The Lambda does not execute — no Supabase, no presign, no audit row.
- You get back quickly with something like Invoke permitted (42ms).
Green means: the API is configured and AWS says “yes, you may invoke this function.” It does not prove presign end-to-end works (that’s what npm run test:vault-presign is for), but it’s a good platform health signal.

# Orange — “AccessBroker not configured”
ACCESS_BROKER_LAMBDA_NAME is missing from the orchestration API process (... not from the browser, not from Terraform, not from the staff UI)

Where you run the API | Where the var must live |
------------------------------------------------
npm run dev:api       | apps/api/.env
Docker api service    | apps/api/.env (via env_file in docker-compose.yml)
Railway               | API service variables

The web app only needs ORCHESTRATION_API_URL (in apps/web/.env) so it knows which API to ask. It never reads ACCESS_BROKER_LAMBDA_NAME itself.

# Red — “unhealthy”
The name is set, but the DryRun invoke failed. Typical causes:
- Wrong function name
- Bad/expired AWS keys
- IAM user lacks lambda:InvokeFunction on that function
- Wrong region (AWS_REGION ≠ Lambda’s region)
- Function deleted / never deployed
Hover the pill or check the admin health panel — the tooltip includes AWS’s error message.

## How to troubleshoot
====== 1. Only one thing should listen on :4000. EITHER
- npm run dev:api from the CLI OR
- docker compose api service
If both try to run, you get EADDRINUSE and the telltale keeps talking to the old process (often Docker without apps/api/.env).
## Steps:
  # See what’s on 4000
<netstat -ano | findstr ":4000">

  # If using local API — free the port
<docker compose stop api>

  # If using Docker API — don’t run npm run dev:api
<docker compose up -d api>

====== 2. Confirm the web app hits the API you think
  # In apps/web/.env:
ORCHESTRATION_API_URL=http://127.0.0.1:4000
Restart the Next dev server after changing that.

====== 3. Confirm the API has the Lambda env
  # In apps/api/.env
- ACCESS_BROKER_LAMBDA_NAME=corduroy-dev-access-broker
- AWS_REGION=us-east-1
- AWS_ACCESS_KEY_ID= [get this from the AWS IAM user for corduroy-dev-railway-invoke]
- AWS_SECRET_ACCESS_KEY= [get this from the AWS IAM user for corduroy-dev-railway-invoke]

# Restart the API after edits (env is read at startup):
<npm run dev:api>
# OR
<docker compose restart api>

====== 4. Hit the API directly
Invoke-RestMethod http://127.0.0.1:4000/health
# Health OK but telltale still orange → web is probably pointing at a different API URL.

====== 5. Full path (needs staff login cookie)
Open staff console → click the pill to refresh, or DevTools → Network → access-broker-status and read the JSON:

{
  "status": "healthy" | "not_configured" | "unhealthy",
  "function_name": "corduroy-dev-access-broker",
  "detail": "..."
}
====== 6. End-to-end vault check
<npm run test:vault-presign>
That exercises real invoke + Lambda + Supabase + presign (not DryRun).