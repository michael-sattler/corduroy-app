# Lambda module — Phase 1 stub

AccessBroker and ContentDispatcher functions. Not wired in B3.

## Phase 1 plan

- Deploy into VPC private subnets from `modules/network`
- AccessBroker: validate + pre-sign + audit (hot path)
- ContentDispatcher: S3 ObjectCreated on `raw/` → extract → derived writes → catalog upsert
- Wire `railway-invoke` IAM user with `lambda:InvokeFunction` on function ARNs only
