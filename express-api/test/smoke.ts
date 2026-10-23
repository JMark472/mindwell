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
  jar.store(reg.setCookies);
  check("register 201", reg.status === 201, `got ${reg.status} ${JSON.stringify(reg.body)}`);

  // 10. duplicate register -> 409
  const dup = await req("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: smokeEmail, password: "Password123", fullName: "Test Student" }),
    headers: { "x-csrf-token": csrfNow() },
  }, jar);
  jar.store(dup.setCookies);
  check("duplicate register 409", dup.status === 409, `got ${dup.status}`);

  // The registration response does not switch the browser session. Log in as
  // the fresh student so the messaging tests run as an unrelated account.
  const smokeLogin = await req("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: smokeEmail, password: "Password123" }),
    headers: { "x-csrf-token": csrfNow() },
  }, jar);
  jar.store(smokeLogin.setCookies);
  check(
    "smoke user login 200",
    smokeLogin.status === 200 && smokeLogin.body?.data?.user?.email === smokeEmail,
    `got ${smokeLogin.status} ${JSON.stringify(smokeLogin.body)}`,
  );

  // 11. messaging contacts are limited to the opposite role
  const contacts = await req("/messages/contacts", {}, jar);
  const counselor = contacts.body?.data?.contacts?.find((c) => c.role === "counselor");
  check(
    "messaging contacts include a counselor",
    contacts.status === 200 && !!counselor,
    `got ${contacts.status} ${JSON.stringify(contacts.body?.data)}`,
  );

  // 12. start a new private thread
  const start = await req("/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ participantId: counselor?.id }),
    headers: { "x-csrf-token": csrfNow() },
  }, jar);
  const conversationId = start.body?.data?.conversation?.id;
  check(
    "start conversation 201",
    start.status === 201 && Number.isInteger(conversationId),
    `got ${start.status} ${JSON.stringify(start.body)}`,
  );

  // 13. starting the same thread again reuses it
  const reopen = await req("/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ participantId: counselor?.id }),
    headers: { "x-csrf-token": csrfNow() },
  }, jar);
  check(
    "reopen existing conversation 200",
    reopen.status === 200 && reopen.body?.data?.conversation?.id === conversationId,
    `got ${reopen.status} ${JSON.stringify(reopen.body?.data?.conversation)}`,
  );

  // 14. send a message and see it in the inbox
  const messageBody = `Smoke test ${Date.now()}`;
  const sent = await req(`/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body: messageBody }),
    headers: { "x-csrf-token": csrfNow() },
  }, jar);
  check(
    "send message 201",
    sent.status === 201 && sent.body?.data?.message?.body === messageBody,
    `got ${sent.status} ${JSON.stringify(sent.body)}`,
  );

  const inbox = await req("/messages/conversations", {}, jar);
  const thread = inbox.body?.data?.conversations?.find((c) => c.id === conversationId);
  check(
    "inbox includes sent message",
    inbox.status === 200 && thread?.lastMessageBody === messageBody,
    `got ${inbox.status} ${JSON.stringify(thread)}`,
  );

  // 15. read state
  const read = await req(`/messages/conversations/${conversationId}/read`, {
    method: "POST",
    headers: { "x-csrf-token": csrfNow() },
  }, jar);
  check("mark conversation read 200", read.status === 200 && read.body?.data?.read === true);

  // 16. empty/oversized messages are rejected
  const empty = await req(`/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body: "   " }),
    headers: { "x-csrf-token": csrfNow() },
  }, jar);
  check("empty message 400", empty.status === 400, `got ${empty.status}`);

  // 17. IDOR: a student cannot read a conversation they are not part of
  const forbidden = await req("/messages/conversations/1", {}, jar);
  check("conversation access is participant-only 404", forbidden.status === 404, `got ${forbidden.status}`);

  let failed = 0;
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail && !r.pass ? "  -- " + r.detail : ""}`);
    if (!r.pass) failed++;
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
