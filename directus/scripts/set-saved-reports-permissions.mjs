/**
 * Grants authenticated users full CRUD on their own saved_reports rows.
 *
 * Strategy: find every policy that isn't the Public policy and isn't the
 * Administrator policy, then add CRUD permissions scoped to the user's own
 * rows (filter: user_id._eq = $CURRENT_USER). Idempotent.
 *
 * Usage: DIRECTUS_TOKEN=xxx node scripts/set-saved-reports-permissions.mjs
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const TOKEN = process.env.DIRECTUS_TOKEN;
if (!TOKEN) {
  console.error("DIRECTUS_TOKEN required");
  process.exit(1);
}

const COLLECTION = "saved_reports";
const OWN_FILTER = { user_id: { _eq: "$CURRENT_USER" } };
const ACTIONS = ["create", "read", "update", "delete"];

async function api(path, init = {}) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.errors?.[0]?.message || `${path} → ${res.status}`);
  return data;
}

async function main() {
  console.log(`Setting saved_reports permissions on ${DIRECTUS_URL}`);

  // Find all policies. Skip:
  //  - admin policies (they already have access)
  //  - public policy (anonymous users shouldn't see saved reports)
  const policies = (await api("/policies?limit=-1")).data || [];
  const target = policies.filter(
    (p) => !p.admin_access && p.app_access && p.name !== "$t:public_label"
  );
  if (target.length === 0) {
    console.warn("No authenticated-user policies found. Nothing to do.");
    return;
  }
  console.log(`Targeting ${target.length} policies: ${target.map((p) => p.name).join(", ")}`);

  // Existing perms for this collection across these policies
  const policyIds = target.map((p) => p.id);
  const existing = (await api(
    `/permissions?filter[collection][_eq]=${COLLECTION}&filter[policy][_in]=${encodeURIComponent(policyIds.join(","))}&limit=-1`
  )).data || [];
  const existingKey = new Map(existing.map((p) => [`${p.policy}:${p.action}`, p]));

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const policy of target) {
    for (const action of ACTIONS) {
      const key = `${policy.id}:${action}`;
      const ex = existingKey.get(key);

      // For "create" we don't need a row filter (filters apply to existing rows);
      // user_id is auto-populated via the field's user-created special.
      const permissions = action === "create" ? {} : OWN_FILTER;

      // For create, validation enforces the user_id matches (defensive).
      const validation = action === "create" ? OWN_FILTER : {};

      const payload = {
        policy: policy.id,
        collection: COLLECTION,
        action,
        fields: ["*"],
        permissions,
        validation,
      };

      try {
        if (ex) {
          await api(`/permissions/${ex.id}`, { method: "PATCH", body: JSON.stringify(payload) });
          console.log(`  ~ ${policy.name}/${action} (updated)`);
        } else {
          await api(`/permissions`, { method: "POST", body: JSON.stringify(payload) });
          console.log(`  + ${policy.name}/${action}`);
        }
        ok++;
      } catch (e) {
        failed++;
        console.error(`  ! ${policy.name}/${action}: ${e.message}`);
      }
      await new Promise((r) => setTimeout(r, 60));
    }
  }
  console.log(`\nDone: ${ok} OK, ${skipped} skipped, ${failed} failed`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
