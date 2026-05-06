#!/usr/bin/env bash
# One-shot Cloudflare provisioning for isbadip.com (free tier only).
# Requirements:
#   - .env in project root with CF_ACCOUNT_ID and CF_API_TOKEN (token must be valid)
#   - Token scopes: Pages:Edit, DNS:Edit, Cache Rules:Edit, Page Rules:Edit,
#                   Zone Settings:Edit, Zone WAF:Edit, Workers Scripts:Edit
#   - npx wrangler available (npm i -g wrangler  OR  npx --yes wrangler ...)
#   - dist/ already built (run `npm run build` first)
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . .env; set +a

CF="https://api.cloudflare.com/client/v4"
H_AUTH="Authorization: Bearer ${CF_API_TOKEN}"
H_JSON="Content-Type: application/json"
DOMAIN="isbadip.com"
PROJECT="isbadip"

api() { curl -sS -H "$H_AUTH" -H "$H_JSON" "$@"; }
ok()  { python3 -c "import sys,json;d=json.load(sys.stdin);sys.exit(0 if d.get('success') else 1)"; }

echo "==> Verifying token"
api "$CF/user/tokens/verify" | tee /tmp/cf.json | ok

echo "==> Looking up zone $DOMAIN"
ZONE_ID=$(api "$CF/zones?name=$DOMAIN" | python3 -c "import sys,json;print(json.load(sys.stdin)['result'][0]['id'])")
echo "    zone=$ZONE_ID"

echo "==> Creating Pages project (idempotent)"
api -X POST "$CF/accounts/$CF_ACCOUNT_ID/pages/projects" \
  --data "{\"name\":\"$PROJECT\",\"production_branch\":\"main\"}" >/dev/null || true

echo "==> Deploying ./dist via wrangler"
CLOUDFLARE_API_TOKEN="$CF_API_TOKEN" CLOUDFLARE_ACCOUNT_ID="$CF_ACCOUNT_ID" \
  npx --yes wrangler@latest pages deploy ./dist --project-name="$PROJECT" --branch=main --commit-dirty=true

echo "==> Adding custom domains $DOMAIN and www.$DOMAIN to Pages project"
for D in "$DOMAIN" "www.$DOMAIN"; do
  api -X POST "$CF/accounts/$CF_ACCOUNT_ID/pages/projects/$PROJECT/domains" \
    --data "{\"name\":\"$D\"}" >/dev/null || true
done

echo "==> DNS: apex + www -> $PROJECT.pages.dev (proxied)"
for NAME in "$DOMAIN" "www.$DOMAIN"; do
  api -X POST "$CF/zones/$ZONE_ID/dns_records" \
    --data "{\"type\":\"CNAME\",\"name\":\"$NAME\",\"content\":\"$PROJECT.pages.dev\",\"proxied\":true,\"ttl\":1}" >/dev/null || true
done

echo "==> Zone settings: HTTPS, HSTS, TLS 1.3, Brotli, HTTP/3, 0-RTT, BIC, Email Obfuscation"
for KV in \
  "always_use_https=on" \
  "automatic_https_rewrites=on" \
  "min_tls_version=1.2" \
  "tls_1_3=on" \
  "brotli=on" \
  "http3=on" \
  "0rtt=on" \
  "browser_check=on" \
  "email_obfuscation=on" \
  "ssl=full"; do
  K="${KV%=*}"; V="${KV#*=}"
  api -X PATCH "$CF/zones/$ZONE_ID/settings/$K" --data "{\"value\":\"$V\"}" >/dev/null || true
done
api -X PATCH "$CF/zones/$ZONE_ID/settings/security_header" --data \
  '{"value":{"strict_transport_security":{"enabled":true,"max_age":15552000,"include_subdomains":true,"preload":true,"nosniff":true}}}' >/dev/null || true

echo "==> Cache rule: long-cache /assets/* on isbadip.com"
api -X PUT "$CF/zones/$ZONE_ID/rulesets/phases/http_request_cache_settings/entrypoint" --data '{
  "rules":[
    {"description":"Static assets long cache","expression":"(http.host eq \"isbadip.com\" and starts_with(http.request.uri.path,\"/assets/\"))",
     "action":"set_cache_settings","action_parameters":{"cache":true,"edge_ttl":{"mode":"override_origin","default":31536000},"browser_ttl":{"mode":"override_origin","default":31536000}}},
    {"description":"Cache API host responses 5m","expression":"(http.host eq \"api.isbadip.com\" and starts_with(http.request.uri.path,\"/api/v1/host/\") and http.request.method eq \"GET\")",
     "action":"set_cache_settings","action_parameters":{"cache":true,"edge_ttl":{"mode":"override_origin","default":300},"browser_ttl":{"mode":"override_origin","default":60},"respect_strong_etags":true}}
  ]}' >/dev/null

echo "==> Redirect rules: www -> apex, http -> https handled by always_use_https"
api -X PUT "$CF/zones/$ZONE_ID/rulesets/phases/http_request_dynamic_redirect/entrypoint" --data '{
  "rules":[
    {"description":"www -> apex","expression":"(http.host eq \"www.isbadip.com\")","action":"redirect",
     "action_parameters":{"from_value":{"status_code":301,"target_url":{"expression":"concat(\"https://isbadip.com\",http.request.uri.path)"},"preserve_query_string":true}}}
  ]}' >/dev/null

echo "==> WAF custom rules (free tier: up to 5 custom + managed challenge)"
api -X PUT "$CF/zones/$ZONE_ID/rulesets/phases/http_request_firewall_custom/entrypoint" --data '{
  "rules":[
    {"description":"Block obvious scanners","expression":"(http.user_agent contains \"sqlmap\" or http.user_agent contains \"nikto\" or http.user_agent contains \"acunetix\" or http.user_agent contains \"masscan\")","action":"block"},
    {"description":"Challenge bad bot scores on API","expression":"(http.host eq \"api.isbadip.com\" and cf.bot_management.score lt 10)","action":"managed_challenge"},
    {"description":"Block empty UA on web","expression":"(http.host eq \"isbadip.com\" and len(http.user_agent) eq 0)","action":"block"}
  ]}' >/dev/null || echo "    (WAF custom rules may require Bot Fight Mode; non-fatal)"

echo "==> Rate limit: api.isbadip.com /api/v1/host/* (free: 10k req / 10s threshold)"
api -X PUT "$CF/zones/$ZONE_ID/rulesets/phases/http_ratelimit/entrypoint" --data '{
  "rules":[
    {"description":"API rate limit","expression":"(http.host eq \"api.isbadip.com\" and starts_with(http.request.uri.path,\"/api/v1/host/\"))",
     "action":"block",
     "ratelimit":{"characteristics":["ip.src"],"period":10,"requests_per_period":60,"mitigation_timeout":60}}
  ]}' >/dev/null || echo "    (rate-limit ruleset may need separate enablement)"

echo
echo "==> Done. Verify:"
echo "    curl -I https://isbadip.com   # cf-cache-status, hsts, csp"
echo "    curl -I https://api.isbadip.com/api/v1/host/8.8.8.8"
