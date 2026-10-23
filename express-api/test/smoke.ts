// Quick manual smoke test for the Express API. Run: npx tsx test/smoke.ts
const BASE = process.env.API_URL || "http://localhost:3000/api";

async function req(path, opts = {}, jar) {
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  if (jar) headers.cookie = jar.header();
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  let body = null;
  try { body = await res.json(); } catch { /* ignore */ }
  return { status: res.status, body, setCookies: res.headers.getSetCookie?.() || [] };
}

function cookieJar() {
  const jar = new Map();
  return {
    store(setCookies) {
      for (const c of setCookies) {
        const [pair] = c.split(";");
        const [name, ...rest] = pair.split("=");
        jar.set(name.trim(), rest.join("=").trim());
      }
    },
    header() {
      return Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
    },
    get(name) { return jar.get(name); },
  };
}

async function main() {
  const results = [];
  const check = (name, cond, detail = "") =>
    results.push({ name, pass: !!cond, detail });
  // CSRF cookie is rotated on auth writes (login/register/logout), so always
  // read the CURRENT value rather than a captured one.
  const csrfNow = () => jar.get("mw_csrf");

  // 1. CSRF bootstrap
  const jar = cookieJar();
  const csrfRes = await req("/auth/csrf-token");
  jar.store(csrfRes.setCookies);
  check("csrf-token sets cookie", csrfRes.status === 200 && !!jar.get("mw_csrf"));

  // 2. login success
  const login = await req("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "student@mindwell.test", password: "Password123" }),
    headers: { "x-csrf-token": csrfNow() },
  }, jar);
  jar.store(login.setCookies);
  check("student login 200", login.status === 200 && login.body?.data?.user?.role === "student", JSON.stringify(login.body));

  // 3. /auth/me
  const me = await req("/auth/me", {}, jar);
  check("/auth/me 200", me.status === 200 && me.body?.data?.user?.email === "student@mindwell.test");

  // 4. bad password -> 401
  const bad = await req("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "student@mindwell.test", password: "wrong" }),
    headers: { "x-csrf-token": csrfNow() },
  }, jar);
  check("bad password 401", bad.status === 401, `got ${bad.status} ${JSON.stringify(bad.body)}`);

  // 5. student blocked from admin
  const admin = await req("/admin/users", {}, jar);
  check("student blocked from /admin 403", admin.status === 403, `got ${admin.status}`);

  // 6. write without CSRF blocked
  const noCsrf = await req("/users/me", {
    method: "PATCH",
    body: JSON.stringify({ fullName: "X" }),
  }, jar);
  check("write without CSRF 403", noCsrf.status === 403, `got ${noCsrf.status}`);

  // 7. notifications
  const notifs = await req("/notifications", {}, jar);
  check("notifications 200", notifs.status === 200 && Array.isArray(notifs.body?.data?.notifications));

  // 8. profile update
  const patch = await req("/users/me", {
    method: "PATCH",
    body: JSON.stringify({ program: "BS Information Technology" }),
    headers: { "x-csrf-token": csrfNow() },
  }, jar);
  check("profile update 200", patch.status === 200, `got ${patch.status}`);

  // 9. register new student (unique email so re-runs stay idempotent)
  const smokeEmail = `smoke+${Date.now()}@mindwell.test`;
  const reg = await req("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: smokeEmail, password: "Password123", fullName: "Test Student" }),
    headers: { "x-csrf-token": csrfNow() },
  }, jar);
  check("register 201", reg.status === 201, `got ${reg.status} ${JSON.stringify(reg.body)}`);

  // 10. duplicate register -> 409
  const dup = await req("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: smokeEmail, password: "Password123", fullName: "Test Student" }),
    headers: { "x-csrf-token": csrfNow() },
  }, jar);
  check("duplicate register 409", dup.status === 409, `got ${dup.status}`);

  let failed = 0;
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail && !r.pass ? "  -- " + r.detail : ""}`);
    if (!r.pass) failed++;
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
