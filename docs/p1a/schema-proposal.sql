-- DESIGN PROPOSAL ONLY. Never applied, parsed or executed against PostgreSQL in P1a.
-- No provider selected. Separate from any migration discovery directory.
-- Application uses epoch milliseconds; future adapters must explicitly convert timestamptz.
BEGIN;
CREATE SCHEMA access_foundation;
REVOKE ALL ON SCHEMA access_foundation FROM PUBLIC;
SET LOCAL search_path = access_foundation, pg_catalog;
CREATE TABLE companies (
  id uuid PRIMARY KEY,
  -- Administrative operational lifecycle; independent of the participant window below.
  status text NOT NULL CHECK (status IN ('active','suspended','revoked')),
  -- Customer participant authorization only; never used as staff login/action lifetime.
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  CHECK (isfinite(starts_at) AND isfinite(expires_at) AND starts_at < expires_at)
);
CREATE TABLE invitations (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  kind text NOT NULL DEFAULT 'shared_company' CHECK (kind = 'shared_company'),
  status text NOT NULL CHECK (status IN ('active','redemptions_stopped','revoked')),
  token_digest text NOT NULL UNIQUE CHECK (token_digest ~ '^[a-f0-9]{64}$'),
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  UNIQUE(company_id,id),
  CHECK (isfinite(starts_at) AND isfinite(expires_at) AND starts_at < expires_at)
);
CREATE INDEX invitations_company ON invitations(company_id);
CREATE TABLE participant_grants (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  invitation_id uuid NOT NULL,
  purpose text NOT NULL DEFAULT 'participant' CHECK (purpose = 'participant'),
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  UNIQUE(company_id,id),
  FOREIGN KEY(company_id,invitation_id) REFERENCES invitations(company_id,id) ON DELETE RESTRICT,
  CHECK (isfinite(starts_at) AND isfinite(expires_at) AND starts_at < expires_at)
);
CREATE INDEX grants_invitation ON participant_grants(company_id,invitation_id);
CREATE TABLE participant_sessions (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  grant_id uuid NOT NULL,
  purpose text NOT NULL DEFAULT 'participant' CHECK (purpose = 'participant'),
  token_digest text NOT NULL UNIQUE CHECK (token_digest ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL,
  last_activity_at timestamptz NOT NULL,
  revoked_at timestamptz,
  FOREIGN KEY(company_id,grant_id) REFERENCES participant_grants(company_id,id) ON DELETE RESTRICT,
  CHECK (isfinite(created_at) AND isfinite(last_activity_at) AND last_activity_at >= created_at)
);
CREATE INDEX sessions_grant ON participant_sessions(company_id,grant_id);
CREATE INDEX sessions_cleanup ON participant_sessions(last_activity_at);
-- Provider subject is (issuer, subject), never email or anonymous invitation possession.
CREATE TABLE staff_identities (
  id uuid PRIMARY KEY,
  provider_issuer text NOT NULL CHECK (length(provider_issuer) > 0),
  provider_subject text NOT NULL CHECK (length(provider_subject) > 0),
  UNIQUE(provider_issuer,provider_subject)
);
-- Application membership controls staff login/offboarding, but grants no tenant permissions.
CREATE TABLE application_staff_memberships (
  id uuid PRIMARY KEY,
  staff_id uuid NOT NULL UNIQUE REFERENCES staff_identities(id) ON DELETE RESTRICT,
  active boolean NOT NULL
);
CREATE TABLE staff_memberships (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  staff_id uuid NOT NULL REFERENCES application_staff_memberships(staff_id) ON DELETE RESTRICT,
  active boolean NOT NULL,
  role text NOT NULL CHECK (role IN ('staff','issuer')),
  UNIQUE(company_id,staff_id),
  UNIQUE(company_id,id)
);
CREATE INDEX memberships_identity ON staff_memberships(staff_id);
CREATE TABLE staff_sessions (
  id uuid PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES staff_identities(id) ON DELETE RESTRICT,
  purpose text NOT NULL DEFAULT 'staff' CHECK (purpose = 'staff'),
  token_digest text NOT NULL UNIQUE CHECK (token_digest ~ '^[a-f0-9]{64}$'),
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  -- No default lifetime: policy approval is a prerequisite to issuing any staff session.
  lifetime_policy_version text NOT NULL CHECK (length(lifetime_policy_version) > 0),
  revoked_at timestamptz,
  CHECK (isfinite(starts_at) AND isfinite(expires_at) AND starts_at < expires_at)
);
CREATE INDEX staff_sessions_identity ON staff_sessions(staff_id);
CREATE INDEX staff_sessions_cleanup ON staff_sessions(expires_at);
CREATE TABLE issuer_privileges (
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  membership_id uuid NOT NULL,
  active boolean NOT NULL,
  PRIMARY KEY(company_id,membership_id),
  FOREIGN KEY(company_id,membership_id) REFERENCES staff_memberships(company_id,id) ON DELETE RESTRICT
);
CREATE TABLE security_audit_events (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  occurred_at timestamptz NOT NULL CHECK (isfinite(occurred_at)),
  event_kind text NOT NULL CHECK (event_kind IN ('redemption','revocation','authorization_denied','issuer_change')),
  actor_kind text NOT NULL CHECK (actor_kind IN ('staff','anonymous','system')),
  outcome text NOT NULL CHECK (outcome IN ('allowed','denied'))
  -- No arbitrary JSON, raw tokens, financial data, fingerprint, IP address or user agent.
);
CREATE INDEX audit_company_time ON security_audit_events(company_id,occurred_at);
-- Defense in depth: no policies means deny by default to non-owner/non-bypass roles.
-- Runtime grants and verified tenant RLS policies are a P1b release prerequisite.
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies FORCE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations FORCE ROW LEVEL SECURITY;
ALTER TABLE participant_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_grants FORCE ROW LEVEL SECURITY;
ALTER TABLE participant_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE staff_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_identities FORCE ROW LEVEL SECURITY;
ALTER TABLE application_staff_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_staff_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE staff_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE staff_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE issuer_privileges ENABLE ROW LEVEL SECURITY;
ALTER TABLE issuer_privileges FORCE ROW LEVEL SECURITY;
ALTER TABLE security_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA access_foundation FROM PUBLIC;
-- Deliberately rolls back even if someone manually executes this proposal.
ROLLBACK;
