/**
 * End-to-end verification: authenticate against the Express service, then
 * exercise the Laravel service with the same cookies (as the browser SPA
 * would). Run with the Express API on :3000 and the Laravel API on :8000.
 */
const EXPRESS = "http://127.0.0.1:3000/api";
const LARAVEL = "http://127.0.0.1:8000/api";

let failures = 0;
function check(name, ok, detail = "") {
  if (ok) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function cookieJar() {
  const jar = new Map();
  return {
    store(setCookies = []) {
      for (const c of setCookies) {
        const [pair] = c.split(";");
        const idx = pair.indexOf("=");
        if (idx > 0) jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
      }
    },
    get(name) {
      return jar.get(name) ?? "";
    },
    header() {
      return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    csrf() {
      return jar.get("mw_csrf");
    },
  };
}

async function req(base, path, { method = "GET", body, jar, csrf = false } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (jar) {
    headers.Cookie = jar.header();
    if (csrf) headers["x-csrf-token"] = jar.csrf();
  }
  const res = await fetch(base + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  if (jar && setCookies.length) jar.store(setCookies);
  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { status: res.status, json, setCookies };
}

async function login(email) {
  const jar = cookieJar();
  const bootstrap = await req(EXPRESS, "/auth/csrf-token", { jar });
  jar.store(bootstrap.setCookies);
  const res = await req(EXPRESS, "/auth/login", {
    method: "POST",
    body: { email, password: "Password123" },
    jar,
    csrf: true,
  });
  return { jar, res };
}

async function main() {
  console.log("--- health ---");
  const laravelHealth = await req(LARAVEL, "/health");
  check("Laravel health 200", laravelHealth.status === 200, `got ${laravelHealth.status}`);

  console.log("\n--- unauthenticated access is rejected ---");
  const anon = await req(LARAVEL, "/wellness-resources");
  check("Laravel rejects anonymous request", anon.status === 401, `got ${anon.status}`);

  console.log("\n--- student session ---");
  const student = await login("student@mindwell.test");
  check("student login via Express", student.res.status === 200, `got ${student.res.status}`);

  const resources = await req(LARAVEL, "/wellness-resources", { jar: student.jar });
  check(
    "Laravel accepts Express-issued token",
    resources.status === 200 && Array.isArray(resources.json?.data?.resources),
    `got ${resources.status} ${JSON.stringify(resources.json).slice(0, 200)}`,
  );
  check(
    "resource library returns published items",
    (resources.json?.data?.resources?.length ?? 0) >= 6,
    `got ${resources.json?.data?.resources?.length}`,
  );

  const counselors = await req(LARAVEL, "/appointments/counselors", { jar: student.jar });
  check("student can list counselors", counselors.status === 200 && counselors.json?.data?.counselors?.length === 2);

  const appts = await req(LARAVEL, "/appointments", { jar: student.jar });
  const studentAppts = appts.json?.data?.appointments ?? [];
  check("student sees only own appointments", appts.status === 200 && studentAppts.every((a) => a.student_user_id === 4), `ids=${studentAppts.map((a) => a.student_user_id).join(",")}`);

  const checkins = await req(LARAVEL, "/wellness-checkins", { jar: student.jar });
  check("student sees own check-ins", checkins.status === 200 && (checkins.json?.data?.checkins ?? []).length >= 7);

  const trend = await req(LARAVEL, "/wellness-checkins/trend", { jar: student.jar });
  check("student trend returns 7 points", trend.json?.data?.trend?.length === 7);

  const consents = await req(LARAVEL, "/consents", { jar: student.jar });
  check("consent state readable", consents.status === 200 && consents.json?.data?.consents?.checkin_sharing?.granted === false);

  console.log("\n--- student is blocked from counselor/admin areas ---");
  const studentRecords = await req(LARAVEL, "/counseling-records", { jar: student.jar });
  check("student blocked from counseling records", studentRecords.status === 403, `got ${studentRecords.status}`);

  const studentCreateResource = await req(LARAVEL, "/wellness-resources", {
    method: "POST",
    body: { wellness_category_id: 1, title: "x", excerpt: "x", body: "x" },
    jar: student.jar,
    csrf: true,
  });
  check("student blocked from creating resources", studentCreateResource.status === 403, `got ${studentCreateResource.status}`);

  console.log("\n--- CSRF is enforced on writes ---");
  const noCsrf = await req(LARAVEL, "/wellness-checkins", {
    method: "POST",
    body: { mood_score: 3 },
    jar: student.jar,
  });
  check("write without CSRF rejected", noCsrf.status === 403, `got ${noCsrf.status}`);

  console.log("\n--- check-in creation and privacy ---");
  const created = await req(LARAVEL, "/wellness-checkins", {
    method: "POST",
    body: {
      mood_score: 4,
      energy_score: 3,
      stress_score: 2,
      sleep_hours: 7.5,
      influences: ["study", "friends"],
      note: "Automated verification check-in.",
      share_with_counselor: true,
    },
    jar: student.jar,
    csrf: true,
  });
  check(
    "sharing without consent is refused",
    created.status === 422,
    `got ${created.status} ${JSON.stringify(created.json).slice(0, 160)}`,
  );

  const privateCheckin = await req(LARAVEL, "/wellness-checkins", {
    method: "POST",
    body: { mood_score: 4, note: "Private note.", share_with_counselor: false },
    jar: student.jar,
    csrf: true,
  });
  check("private check-in created", privateCheckin.status === 201, `got ${privateCheckin.status}`);

  console.log("\n--- appointment booking & conflict prevention ---");
  const s2 = await login("student2@mindwell.test");
  let openSlot = null;
  let slotsDate = null;
  for (let offset = 1; offset <= 14 && !openSlot; offset++) {
    const probe = new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
    const res = await req(LARAVEL, `/appointments/1/slots?date=${probe}`, { jar: student.jar });
    if (res.status !== 200) {
      check("counselor slots listed", false, `got ${res.status}`);
      break;
    }
    const found = (res.json?.data?.slots ?? []).find((s) => s.available);
    if (found) {
      openSlot = found;
      slotsDate = probe;
    }
  }
  check("counselor slots listed", slotsDate !== null, "no availability in the next 14 days");

  if (openSlot) {
    const book = await req(LARAVEL, "/appointments", {
      method: "POST",
      body: {
        counselor_profile_id: 1,
        slot_start: openSlot.start,
        mode: "online",
        concern_category: "Academic stress",
        student_note: "Automated booking test.",
      },
      jar: student.jar,
      csrf: true,
    });
    check("student books an open slot", book.status === 201, `got ${book.status} ${JSON.stringify(book.json).slice(0, 200)}`);

    const clash = await req(LARAVEL, "/appointments", {
      method: "POST",
      body: { counselor_profile_id: 1, slot_start: openSlot.start, mode: "online" },
      jar: s2.jar,
      csrf: true,
    });
    check(
      "same slot cannot be double-booked",
      clash.status === 422,
      `got ${clash.status} ${JSON.stringify(clash.json).slice(0, 200)}`,
    );

    const cancel = await req(LARAVEL, `/appointments/${book.json.data.appointment.id}/cancel`, {
      method: "POST",
      body: { reason: "Automated test cleanup." },
      jar: student.jar,
      csrf: true,
    });
    check("student cancels own appointment", cancel.status === 200, `got ${cancel.status}`);
  } else {
    check("student books an open slot", false, "no open slot found");
  }

  const past = await req(LARAVEL, "/appointments", {
    method: "POST",
    body: { counselor_profile_id: 1, slot_start: new Date(Date.now() - 86400000).toISOString() },
    jar: student.jar,
    csrf: true,
  });
  check("booking in the past is rejected", past.status === 422, `got ${past.status}`);

  console.log("\n--- counselor session ---");
  const counselor = await login("counselor@mindwell.test");
  check("counselor login via Express", counselor.res.status === 200);

  const profile = await req(LARAVEL, "/counselors/profile", { jar: counselor.jar });
  check("counselor profile loaded", profile.status === 200 && profile.json?.data?.profile?.id === 1);

  const caseload = await req(LARAVEL, "/counseling-records/caseload", { jar: counselor.jar });
  check("counselor caseload includes assigned students", (caseload.json?.data?.caseload ?? []).length >= 2);

  const records = await req(LARAVEL, "/counseling-records", { jar: counselor.jar });
  check("counselor reads own records", records.status === 200 && (records.json?.data?.records ?? []).length === 1);

  const counselorCheckins = await req(LARAVEL, "/wellness-checkins", { jar: counselor.jar });
  const shared = counselorCheckins.json?.data?.checkins ?? [];
  check(
    "counselor cannot see unshared check-ins",
    counselorCheckins.status === 200 && shared.every((c) => c.is_shared_with_counselor === true),
    `count=${shared.length}`,
  );

  const counselorAppts = await req(LARAVEL, "/appointments", { jar: counselor.jar });
  const cAppts = counselorAppts.json?.data?.appointments ?? [];
  check(
    "counselor sees only their own appointment queue",
    cAppts.length > 0 && cAppts.every((a) => a.counselor_profile_id === 1),
  );

  console.log("\n--- IDOR protection ---");
  // Student 5's appointment id, fetched via their own session.
  const s2Appts = (await req(LARAVEL, "/appointments", { jar: s2.jar })).json?.data?.appointments ?? [];
  const victimId = s2Appts[0]?.id;
  if (victimId) {
    const idor = await req(LARAVEL, `/appointments/${victimId}`, { jar: student.jar });
    check("student cannot read another student's appointment", idor.status === 403, `got ${idor.status}`);
  } else {
    check("student cannot read another student's appointment", false, "no appointment to test");
  }

  console.log("\n--- admin session ---");
  const admin = await login("admin@mindwell.test");
  check("admin login via Express", admin.res.status === 200);

  const adminAppts = await req(LARAVEL, "/appointments", { jar: admin.jar });
  check(
    "admin sees aggregate appointments without notes",
    adminAppts.status === 200 && (adminAppts.json?.data?.appointments ?? []).every((a) => !("student_note" in a)),
  );

  const adminRecords = await req(LARAVEL, "/counseling-records", { jar: admin.jar });
  check("admin denied counseling records", adminRecords.status === 403, `got ${adminRecords.status}`);

  const adminCheckins = await req(LARAVEL, "/wellness-checkins", { jar: admin.jar });
  check(
    "admin gets aggregates, not check-in rows",
    adminCheckins.status === 200 &&
      (adminCheckins.json?.data?.checkins ?? []).length === 0 &&
      typeof adminCheckins.json?.data?.aggregate?.total === "number",
  );

  const adminCreate = await req(LARAVEL, "/wellness-resources", {
    method: "POST",
    body: {
      wellness_category_id: 1,
      title: "Verification Resource",
      excerpt: "Created by the automated verification script.",
      body: "Body text.",
      status: "published",
    },
    jar: admin.jar,
    csrf: true,
  });
  check("admin can create a resource", adminCreate.status === 201, `got ${adminCreate.status}`);

  // Clean up: archive the resource created above so repeat runs stay tidy.
  if (adminCreate.status === 201) {
    await req(LARAVEL, `/wellness-resources/${adminCreate.json.data.resource.id}`, {
      method: "DELETE",
      jar: admin.jar,
      csrf: true,
    });
  }

  console.log("\n--- service-to-service internal routes ---");
  const noKey = await req(LARAVEL, "/internal/reports/appointment-summary");
  check("internal route rejects missing service key", noKey.status === 401, `got ${noKey.status}`);

  const badKey = await fetch(`${LARAVEL}/internal/reports/appointment-summary`, {
    headers: { "X-Service-Key": "wrong", Accept: "application/json" },
  });
  check("internal route rejects bad service key", badKey.status === 403, `got ${badKey.status}`);

  const goodKey = await fetch(`${LARAVEL}/internal/reports/appointment-summary`, {
    headers: {
      "X-Service-Key": "dev_only_service_key_mindwell_c81e5273af904bd6b27d1358fe0a96c4",
      Accept: "application/json",
    },
  });
  const goodJson = await goodKey.json();
  check(
    "internal report returns aggregates",
    goodKey.status === 200 && typeof goodJson?.data?.total === "number" && Array.isArray(goodJson?.data?.monthly),
  );

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
  return failures;
}

main()
  .then((failures) => {
    process.exitCode = failures === 0 ? 0 : 1;
  })
  .catch((err) => {
    console.error("FATAL", err);
    process.exitCode = 1;
  });
