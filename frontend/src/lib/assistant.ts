export type AssistantRole = "student" | "counselor" | "admin";

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantReply {
  content: string;
  topic: string;
  followUps?: string[];
}

interface Topic {
  name: string;
  keywords: string[];
  followUps: string[];
  reply: (ctx: ReplyContext) => string;
}

interface ReplyContext {
  role: AssistantRole;
  raw: string;
  text: string;
  question: string;
  language: "en" | "fil" | "ceb" | "mixed";
  history: AssistantMessage[];
  lastUserText: string;
  lastAssistantText: string;
  lastTopic: string | null;
  isFollowUp: boolean;
  isQuestion: boolean;
}

const CRISIS_PATTERN =
  /(suicid|kill myself|end my life|don'?t want to (live|be here)|self[- ]?harm|hurt myself|cut myself|no reason to live|better off dead|want to die|take my life|overdose|unsafe at home|someone is hurting me|being abused|abusive|assault|rape|can'?t go on|tired of living|no point in living|nothing to live for|hurt (someone|others)|kill (someone|others)|student (is )?(at risk|unsafe)|client (is )?(at risk|unsafe)|risk of harm|risk assessment|safety plan|harm to (self|others)|gusto ko nang mamatay|ayoko nang mabuhay|magpakamatay|papakamatayin ko ang sarili|saktan ang sarili|gusto kong mawala|wala nang saysay|gikapoy na ko og kinabuhi|gusto na ko mamatay|dili na ko gusto mabuhi)/i;

const INFO_PATTERN =
  /^(who are you|what are you|what can you do|what do you do|your name|how do you work|are you a real (ai|person)|are you human|what are your capabilities|sino ka|ano ka|ano ang kaya mong gawin|kinsa ka|unsa ka|unsa imong mahimo)\??$/i;

const GREETING_PATTERN =
  /^(hi|hello|hey|kumusta|kamusta|musta|maayong (buntag|hapon|gabii|adlaw)|good (morning|afternoon|evening)|hello po|hi po)( there| po| ka| ra)?[!,.?\s]*$/i;

const THANKS_PATTERN =
  /^(thanks|thank you|thank u|ty|salamat|daghang salamat|salamat kaayo|that helps|appreciate it)( so much| po| kaayo| for the help| for your help)?[!,.?\s]*$/i;

const FOLLOW_UP_PATTERN =
  /^(what (should|can|do) i do(\s+(now|next|about (it|this|that)))?|so what now|what now|how\b|why\b|can you (explain|tell me) more|tell me more|give me (an )?example|example\??|another one|and then\??|unsaon nako|unsa man akong buhaton|unsay akong buhaton|ano ang dapat kong gawin|paano\??|bakit\??|pwede mo bang ipaliwanag|pwede pa ba)\b/i;

export const assistantPrompts: Record<AssistantRole, string[]> = {
  student: [
    "I'm overwhelmed by exams",
    "Nahihirapan akong makatulog",
    "Help me stop overthinking",
    "I feel low and unmotivated",
    "How do I deal with a friendship problem?",
    "How do I manage a panic attack?",
  ],
  counselor: [
    "Help me plan my next session",
    "Give me intake questions",
    "How should I document this session?",
    "What coping strategies can I suggest?",
    "How do I respond to a student at risk?",
    "How do I prevent burnout?",
  ],
  admin: [
    "How do I manage student and counselor accounts?",
    "How should I handle password resets securely?",
    "What reports should I review regularly?",
    "How do I review audit logs for issues?",
    "How can I support platform safety and privacy?",
    "What should I check before creating or changing user roles?",
  ],
};

export function assistantGreeting(role: AssistantRole, fullName?: string | null) {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  const titles = new Set(["dr", "dr.", "mr", "mr.", "ms", "ms.", "mrs", "mrs.", "prof", "prof."]);
  const firstName = parts[0] && titles.has(parts[0].toLowerCase()) ? parts[1] : parts[0];
  const name = firstName ? ` ${firstName}` : "";

  if (role === "counselor") {
    return `Hi${name} — I'm your Mindwell AI Counseling Assistant. I can help you prepare sessions, think through clinical and ethical situations, choose interventions, draft objective documentation, and plan for safety and self-care.

I’ll do my best to give clear, practical, and responsible guidance, but I can’t replace your clinical judgment, supervision, direct assessment, or your institution’s protocols.

What would you like to work through today? You can share the situation in general terms and ask follow-up questions anytime.`;
  }
  if (role === "admin") {
    return `Hi${name} — I'm the Mindwell AI Admin Assistant. I can help with user and account management, secure password handling, role/access checks, reports and analytics, audit-log review, and privacy/safety operations.

I provide operational guidance only — verify actions against your institution’s policies, protect credentials, and never access or share private counseling records.

What would you like help with?`;
  }

  return `Hi${name} — I'm the Mindwell AI Assistant. I can help you think through stress, anxiety, sleep, studies, relationships, motivation, grief, and other everyday concerns with practical steps and clear explanations.

I can support you, but I can’t diagnose conditions or provide emergency/crisis care in real time. If you’re in immediate danger, please contact local emergency services or use Help & Crisis.

What’s on your mind today? (You can message in English, Filipino, or Cebuano.)`;
}

function normalise(value: string) {
  return value
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}\s'?.!,:-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shorten(value: string, limit = 180) {
  const text = value.trim().replace(/\s+/g, " ");
  return text.length > limit ? `${text.slice(0, limit - 1).trim()}…` : text;
}

function detectLanguage(text: string): "en" | "fil" | "ceb" | "mixed" {
  const t = ` ${text.toLowerCase()} `;
  const filHints = [" ako ", " ikaw ", " hindi ", " paano ", " bakit ", " gusto ", " nalulungkot ", " nahihirapan ", " tulong ", " kinakabahan ", " pagod ", " problema ", " sana ", " kasi ", " yung ", " nga ", " po ", " naman "];
  const cebHints = [" ako ", " ka ", " dili ", " wala ", " unsa ", " giunsa ", " nganong ", " ngano ", " gusto ", " kapoy ", " nahadlok ", " nasuko ", " problema ", " tabang ", " unya ", " kaayo ", " ra ", " nako ", " nako.", " nako?" ];
  const fil = filHints.reduce((n, h) => n + (t.includes(h) ? 1 : 0), 0);
  const ceb = cebHints.reduce((n, h) => n + (t.includes(h) ? 1 : 0), 0);
  if (fil >= 2 && ceb >= 2) return "mixed";
  if (ceb >= 2 && ceb > fil) return "ceb";
  if (fil >= 2) return "fil";
  if (ceb === 1 && fil === 0) return "ceb";
  if (fil === 1 && ceb === 0) return "fil";
  return "en";
}

function empathyLead(language: ReplyContext["language"]) {
  if (language === "fil") return "Salamat sa pagbabahagi nito. Naiintindihan ko na maaaring mabigat itong nararanasan mo ngayon.";
  if (language === "ceb") return "Salamat sa pagpaambit niini. Masabtan nako nga bug-at ni para nimo karon.";
  if (language === "mixed") return "Salamat sa pagbabahagi/pagpaambit nito. I hear you — this sounds important and not easy to carry.";
  return "Thank you for sharing this. What you’re dealing with sounds important, and it makes sense to want clarity and support.";
}

function languageNote(language: ReplyContext["language"]) {
  if (language === "fil") return "Maaari mo akong kausapin sa Filipino, English, o Taglish — sasagutin kita sa paraang mas malinaw para sa’yo.";
  if (language === "ceb") return "Pwede ka makigsulti nako sa Cebuano, English, o sinagol — tubagon tika sa paagi nga mas klaro para nimo.";
  if (language === "mixed") return "Pwede mong i-message ako in English, Filipino, or Cebuano (kahit halo-halo), at sasabayan ko ang mas klaro para sa’yo.";
  return "";
}

function isLikelyFollowUp(text: string, raw: string, history: AssistantMessage[]) {
  if (history.filter((m) => m.role === "user").length === 0) return false;
  if (FOLLOW_UP_PATTERN.test(raw) || FOLLOW_UP_PATTERN.test(text)) return true;
  const words = text.split(/\s+/).filter(Boolean);
  return words.length > 0 && words.length <= 5;
}

function extractLastTopic(history: AssistantMessage[]): string | null {
  const assistant = [...history].reverse().find((m) => m.role === "assistant");
  if (!assistant) return null;
  const c = assistant.content.toLowerCase();
  const map: [string, string[]][] = [
    ["academic stress", ["exam", "study", "deadline", "academic", "schoolwork"]],
    ["panic", ["panic", "grounding", "5-4-3-2-1"]],
    ["sleep", ["sleep", "insomnia", "wind-down", "bed"]],
    ["anxiety", ["anxiety", "anxious", "worry", "overthinking"]],
    ["low mood", ["low mood", "depressed", "hopeless", "motivation second"]],
    ["relationships", ["relationship", "boundary", "conflict", "friend", "family"]],
    ["loneliness", ["lonely", "isolated", "connection"]],
    ["anger", ["anger", "angry", "cool your body"]],
    ["self-esteem", ["confidence", "self-esteem", "worthless", "evidence log"]],
    ["motivation", ["motivation", "procrastin", "two-minute start"]],
    ["stress", ["stress", "overwhelmed", "pressure", "urgent from important"]],
    ["getting support", ["counseling", "counsellor", "therap", "first session"]],
    ["grief", ["grief", "loss", "died", "passed away"]],
    ["financial stress", ["financial", "money", "budget", "tuition"]],
    ["session planning", ["session plan", "agenda", "review the last note"]],
    ["intake", ["intake", "presenting concern", "onset and course"]],
    ["documentation", ["documentation", "dap", "soap", "session note"]],
    ["rapport", ["rapport", "engagement", "validate before exploring"]],
    ["ethics", ["ethical", "confidentiality", "boundaries", "consultation"]],
    ["coping strategies", ["match the strategy", "behavioral activation", "graded exposure"]],
    ["burnout", ["burnout", "compassion fatigue", "emotional exhaustion"]],
    ["termination", ["ending well", "closing session", "relapse-prevention"]],
    ["referral", ["referral", "warm handoff", "level of care"]],
    ["password management", ["password reset", "temporary password"]],
    ["account management", ["account management", "least privilege"]],
    ["audit & security", ["audit log", "suspicious", "incident-response"]],
    ["reports & analytics", ["reports and analytics", "utilization", "data quality"]],
  ];
  for (const [name, cues] of map) {
    if (cues.some((cue) => c.includes(cue))) return name;
  }
  return null;
}

function infoReply(role: AssistantRole) {
  const base = `I’m a guided support assistant built into Mindwell.

What I can help with
1. Understanding concerns — I can help you break down what you’re asking or experiencing and identify the main issue.
2. Practical guidance — I can suggest realistic steps, coping strategies, planning ideas, communication tips, and next actions.
3. Clear explanations — I can explain options, trade-offs, and why a recommendation may help.
4. Follow-up support — I can keep track of the topic in this conversation, so you can ask follow-up questions like “what should I do next?” or request examples.

What I can’t do
• I don’t diagnose conditions or replace licensed professionals.
• I can’t provide emergency or real-time crisis intervention.
• I don’t have access to private counseling records, and I won’t invent facts or sources.
• I work from general guidance and the information you share in this conversation.

If you tell me your situation or question (in English, Filipino, or Cebuano), I’ll do my best to give a clear, responsible, and useful answer.`;

  if (role === "counselor") {
    return base.replace(
      "1. Understanding concerns — I can help you break down what you’re asking or experiencing and identify the main issue.",
      "1. Clinical thinking support — I can help with session preparation, case-formulation prompts, intervention ideas, documentation structure, and ethical/safety decision frameworks."
    );
  }
  if (role === "admin") {
    return base.replace(
      "1. Understanding concerns — I can help you break down what you’re asking or experiencing and identify the main issue.",
      "1. Operational support — I can help with account/role management, secure password handling, reports, audit-log review, and privacy/safety operations."
    ).replace(
      "• I don’t have access to private counseling records, and I won’t invent facts or sources.",
      "• I don’t have access to private counseling records, and I must not expose sensitive student data. I won’t invent facts or sources."
    );
  }
  return base;
}

function studentCrisisReply(language: ReplyContext["language"]) {
  const lead = language === "fil"
    ? "Salamat sa pagsasabi nito. Mukhang kailangan mo ngayon ng agarang tulong mula sa isang tao — hindi mo kailangang harapin ito mag-isa."
    : language === "ceb"
      ? "Salamat sa pagsulti niini. Murag kinahanglan nimo og dali nga tabang gikan sa tawo karon — dili nimo kinahanglan atubangon ni nga mag-inusara."
      : "I’m really glad you told me. What you’re describing needs urgent, human support — please don’t try to carry this alone.";

  return `${lead}

What to do now (if you may be in danger)
1. **Get immediate help:** If you might act on thoughts of harming yourself or someone else, call your local emergency number now, go to the nearest emergency department, or ask someone you trust to stay with you and help you get there.
2. **Increase safety:** Move away from anything you could use to hurt yourself, and try not to stay alone.
3. **Reach a person:** Contact a trusted person, counselor, or campus support and say clearly: “I’m not safe and I need help right now.”
4. **Use Mindwell resources:** Open **Help & Crisis** in Mindwell for crisis contacts and guidance.
5. **If someone is hurting you:** Prioritize getting to a safe place and contacting emergency services or a trusted adult/support service.

I’m an AI assistant and I can’t keep you safe in real time or respond to emergencies. You deserve immediate care from a real person. If you can, tell me your country/campus area or who is nearby, and I can help you think of what to say when you reach out.`;
}

function counselorCrisisReply() {
  return `Treat this as a potential safety situation first.

Immediate priorities
1. **Assess directly and calmly:** Ask about suicidal ideation, intent, plan, access to means, timeframe, past attempts, self-harm, harm to others, abuse, substance use, and relevant psychotic symptoms.
2. **Do not leave high risk unmanaged:** Follow your institution’s emergency/risk protocol. Arrange same-day urgent review, involve appropriate supports, or escalate to emergency services when imminent risk is present.
3. **Reduce means and increase support:** Collaborate on immediate steps to make the environment safer and identify who can stay with/support the student as appropriate and consented.
4. **Document clearly:** Record what was asked, what was reported (quotes when useful), your risk formulation, actions taken, consultations, notifications per policy, and follow-up plan.
5. **Consult:** Seek supervision/consultation the same day when possible.

Safety-plan elements to cover
• Warning signs • Internal coping steps • People/places for distraction and support • People to contact for help • Professional/crisis contacts • Steps to make the environment safer

I can help you structure risk questions, a safety-plan conversation, or objective documentation in general terms — but I can’t replace direct assessment, supervision, or your emergency protocol.`;
}

function adminCrisisReply() {
  return `If this involves immediate danger to a student or anyone else, treat it as an urgent safety matter — not a routine admin task.

Immediate steps
1. **Escalate now:** Follow your institution’s emergency protocol and contact emergency services or the designated on-call counselor/clinical lead. Admins should facilitate escalation, not perform clinical assessment.
2. **Protect privacy:** Share only the minimum necessary information with authorized responders. Do not access, copy, or distribute private counseling records or sensitive messages.
3. **Verify identity:** Before taking account actions (password resets, role/status changes), confirm identity using approved procedures.
4. **Document appropriately:** Record operational actions factually (who/what/when/why) per policy, without adding unauthorized clinical details.
5. **After stabilization:** Review relevant access, notifications, and audit logs for related security/account concerns.

I can help with a safe operational checklist, but I cannot respond to emergencies or make clinical decisions.`;
}

function followUpSuggestions(role: AssistantRole, topic: string, language: ReplyContext["language"]): string[] {
  const fil = language === "fil" || language === "mixed";
  const ceb = language === "ceb" || language === "mixed";
  if (role === "admin") {
    if (topic.includes("password")) return ["What’s a secure way to share a temporary password?", "What should I check after a reset?", "How do I handle a suspected account compromise?"];
    if (topic.includes("account")) return ["What should I verify before changing a role?", "How do I deactivate an account safely?", "What student/counselor details should be complete?"];
    if (topic.includes("audit")) return ["What patterns suggest suspicious activity?", "How should I document what I reviewed?", "What should I escalate?"];
    if (topic.includes("report")) return ["How do I compare trends over time?", "What should I avoid sharing in summaries?", "What follow-up action makes sense?"];
    return ["Can you give me a step-by-step checklist?", "What privacy risks should I watch for?", "What should I verify before taking action?"];
  }
  if (role === "counselor") {
    if (topic.includes("intake")) return ["Can you give example intake questions?", "How do I ask about risk sensitively?", "How should I structure the first 10 minutes?"];
    if (topic.includes("documentation")) return ["Can you show a DAP example structure?", "What should I avoid writing in notes?", "How do I document risk clearly?"];
    if (topic.includes("session")) return ["How do I set a collaborative agenda?", "What if the student goes off-topic?", "How should I close the session?"];
    if (topic.includes("safety")) return ["How do I ask about means and intent?", "What belongs in a safety plan?", "What should I document after escalation?"];
    return ["Can you give a concrete example?", "What questions should I ask next?", "What are common pitfalls to avoid?"];
  }
  if (topic.includes("sleep")) return [fil ? "Puwede mo bang gawing simple nightly routine?" : ceb ? "Pwede nimo himoong simple nga routine sa gabii?" : "Can you make a simple nightly routine for me?", "What if I wake up in the middle of the night?", "When should I seek professional help?"];
  if (topic.includes("exam") || topic.includes("academic") || topic.includes("motivation")) return ["Can you help me plan the next 24 hours?", "How do I start when I feel stuck?", "How can I talk to my teacher about this?"];
  if (topic.includes("anxiety") || topic.includes("panic")) return ["Can you give me a short grounding script?", "What should I do after an anxious moment?", "How do I handle this in class/public?"];
  if (topic.includes("relationship")) return ["Can you help me write what to say?", "How do I set a boundary kindly?", "What if they react badly?"];
  return [fil ? "Puwede mo bang i-break down ito sa next steps?" : ceb ? "Pwede nimo i-break down ni into next steps?" : "Can you break this into next steps for today?", "Can you give an example?", "How do I explain this to someone I trust?"];
}

function buildStudentReply(topicName: string, ctx: ReplyContext): string {
  const q = ctx.question;
  const lead = empathyLead(ctx.language);
  const note = languageNote(ctx.language);
  const contextLine = q ? `\n\n**About what you shared:** “${q}”` : "";
  const lang = note ? `\n\n_${note}_` : "";

  const body = (() => {
    switch (topicName) {
      case "academic stress":
        return `**Direct answer:** Feeling overwhelmed by schoolwork usually means the load is bigger than your current plan — and that’s something we can make more manageable step by step.

**Why this can feel so hard**
Deadlines, uncertainty, and pressure can trigger stress that makes it harder to start, which then creates more pressure. Struggling to begin doesn’t mean you’re lazy or incapable.

**Practical steps**
1. **List and prioritize:** Write down everything due and mark only what matters in the next 24–72 hours.
2. **Make tasks concrete:** Turn “study biology” into “review pages 10–15 and answer 5 practice questions.”
3. **Use short, active blocks:** Try 25–40 minutes of focused work (recall/practice) + a 5–10 minute break.
4. **Protect basics:** Sleep, food, and water affect focus and memory more than most last-minute cramming.
5. **Ask for support:** If needed, message a classmate/instructor or ask for clarification/extension early.

**A realistic next step (today)**
Pick one subject and do the smallest possible start (even 10 minutes). Progress counts, even if it’s imperfect.

If this pressure is affecting your sleep, appetite, mood, or ability to function for weeks, consider talking with a counselor or trusted support person — you don’t have to handle it alone.${lang}`;
      case "panic":
        return `**Direct answer:** A panic surge feels intense and frightening, but it usually peaks and passes. The goal is to help your body settle, not to fight the feeling perfectly.

**What can help right now**
1. **Slow your exhale:** Breathe in gently for ~4 seconds, out for ~6–8 seconds. Longer exhales can help calm your body.
2. **Ground with 5-4-3-2-1:** Name 5 things you see, 4 feel, 3 hear, 2 smell, 1 taste.
3. **Use a steady reminder:** “This is uncomfortable, but it can pass. I can ride this wave.”
4. **Change stimulation:** If possible, step to a quieter/cooler space, loosen tight clothing, or splash cool water on your face.

**After it eases**
• Notice possible triggers (lack of sleep, caffeine, stress, skipped meals).
• Practice a calming skill when you’re not panicking so it’s easier to access later.
• If panic happens often or leads you to avoid places/activities, a counselor or health professional can help with effective strategies.

**Important:** If chest pain, fainting, breathing problems, or symptoms feel new/severe or you’re unsure if it’s a medical emergency, seek urgent medical care.${lang}`;
      case "sleep":
        return `**Direct answer:** Trouble sleeping is common when your mind/body is stressed. A consistent routine and reducing pressure to “force sleep” usually helps more than trying harder.

**Why it happens**
Stress, irregular schedules, screen use, caffeine, naps, and worry can train your brain to associate bed with alertness instead of rest.

**Practical steps**
1. **Keep a consistent wake time:** Even after a poor night, this helps reset your sleep rhythm.
2. **Build a 30–60 min wind-down:** Dim lights, lighter activities, and avoid intense work/scrolling before bed.
3. **Use bed for rest/sleep:** If you’re awake and frustrated for ~20 minutes, get up briefly and do something calm in low light, then return when sleepy.
4. **Watch stimulants:** Limit caffeine later in the day; alcohol can also disrupt sleep quality.
5. **“Worry dump”:** Write tomorrow’s tasks or repeating thoughts so your mind doesn’t have to hold them all night.

**A realistic next step**
Choose one change for tonight (e.g., fixed wake time or 30-minute wind-down) and try it consistently for several days.

If sleep problems last weeks or significantly affect your mood, safety, or daily functioning, consider speaking with a health professional or counselor.${lang}`;
      case "anxiety":
      case "stress":
        return `**Direct answer:** Anxiety/stress is your mind and body reacting to perceived pressure or threat. You may not be able to remove it instantly, but you can respond in ways that reduce its intensity and help you regain control.

**What can help**
1. **Name it clearly:** “I’m feeling anxious/stressed about…” is easier to work with than a vague sense that everything is wrong.
2. **Calm the body:** Slow breathing (longer exhale), grounding, a short walk, or stretching can lower physical tension.
3. **Sort facts vs. worries:** Write what you know, what you’re guessing, and what you can control today.
4. **Take one small action:** Pick the next doable step instead of solving everything at once.
5. **Reduce avoidable amplifiers:** Lack of sleep, skipped meals, and too much caffeine/scrolling can make anxiety worse.

**A realistic next step**
Ask yourself: “What is one helpful thing I can do in the next 20 minutes?” Then do just that.

If anxiety/stress is frequent, intense, or interfering with school, relationships, or daily life, reaching out to a counselor can help you build a plan that fits your situation.${lang}`;
      case "low mood":
        return `**Direct answer:** When you feel low or unmotivated, it can be hard to do the things that help — so the focus should be on small, compassionate, doable steps rather than forcing yourself to feel better all at once.

**Why this happens**
Low mood can drain energy, focus, and hope. That doesn’t mean you’re weak or failing; it means you may need support and a gentler pace.

**What may help**
1. **Start very small:** One basic task (water, shower, opening a window, short walk, or a message to someone) is a valid start.
2. **Use “action before motivation”:** Choose one small activity for mastery (something useful) and one for care/connection.
3. **Stay connected:** Reach out to someone safe, even with a simple “I’ve been having a hard time lately.”
4. **Be kind but honest with yourself:** Notice harsh thoughts and respond as you would to a friend.
5. **Protect basics:** Regular meals, light/movement, and sleep routines can support mood over time.

**When to seek more support**
If low mood lasts more than two weeks, affects daily functioning, or comes with hopelessness, please talk with a counselor or health professional. If you have thoughts of harming yourself or not wanting to be here, please use **Help & Crisis** or contact emergency services immediately.${lang}`;
      case "relationships":
        return `**Direct answer:** Relationship problems can be painful and confusing. A helpful approach is to understand what you need, communicate it clearly, and also pay attention to whether the relationship feels safe and respectful.

**Steps to work through it**
1. **Clarify the issue:** What happened (facts), how it affected you (feelings), and what you need now?
2. **Choose timing:** Bring it up when both of you are calmer, not in the middle of intense conflict.
3. **Use a clear script:** “When ___ happened, I felt ___. What I need is ___.” This is more constructive than blaming.
4. **Listen and check understanding:** Reflect what you heard before responding.
5. **Set boundaries if needed:** A boundary explains what you can/cannot accept and what you will do to take care of yourself.

**Important:** If there is control, threats, intimidation, or any form of abuse, prioritize safety and seek support from trusted people/services rather than trying to resolve it alone.${lang}`;
      case "loneliness":
        return `**Direct answer:** Feeling lonely is hard, and it can make reaching out feel even harder. Small, low-pressure steps toward connection can help break that cycle.

**Practical steps**
1. **Start small:** Send one message, sit in a shared space, or join a short activity.
2. **Use a simple opener:** “Hey, I’ve been feeling a bit disconnected lately — would you like to catch up?”
3. **Choose structured settings:** Study groups, clubs, volunteering, or classes can make connection easier.
4. **Schedule one contact:** Don’t wait for the perfect mood; plan one small interaction this week.
5. **Be mindful of comparison:** Social media can increase loneliness — take breaks if it makes you feel worse.

If loneliness comes with persistent hopelessness or thoughts of self-harm, please reach out for professional/crisis support. You deserve connection and care.${lang}`;
      case "anger":
        return `**Direct answer:** Anger often signals that something important feels unfair, unsafe, or crossed a boundary. The feeling is valid — the key is responding in a way that protects you and others.

**In the moment**
1. **Pause before reacting:** Step away, delay replying, or take a few slow breaths.
2. **Calm your body first:** Movement, water, or breathing can reduce intensity so you can think clearly.
3. **Avoid harmful actions:** Don’t send messages or make decisions at peak anger.

**Afterward**
4. **Identify the need:** Respect, fairness, space, safety, or being heard?
5. **Communicate clearly:** “When ___ happened, I felt ___. I need ___.”
6. **Repair if needed:** If you reacted harshly, a sincere apology and a plan to do better can help.

If anger is leading to aggression, threats, or harm, please seek professional support promptly — learning safer ways to handle intensity is important for everyone’s wellbeing.${lang}`;
      case "self-esteem":
        return `**Direct answer:** Self-doubt can be loud, but confidence and self-worth can grow through small, repeated experiences of coping and self-respect — not perfection.

**What can help**
1. **Separate behavior from worth:** A mistake or setback is something that happened, not who you are.
2. **Collect evidence:** Write down small things you handled or tried each day.
3. **Practice self-compassion:** Speak to yourself with the same fairness you’d offer a friend.
4. **Take small risks:** Try one manageable challenge (speaking up, asking for help, attempting something imperfect).
5. **Limit harmful comparison:** Curate environments/feeds that support your wellbeing.

If harsh self-talk feels constant or you feel worthless or hopeless, talking with a counselor can provide meaningful support.${lang}`;
      case "motivation":
        return `**Direct answer:** Motivation often comes after starting, not before. Making the next step smaller and easier is usually more effective than waiting to “feel ready.”

**Practical steps**
1. **Pick one task:** Focus on a single next action, not your whole to-do list.
2. **Use a 2–10 minute start:** Commit to a tiny beginning (open the file, write one sentence).
3. **Reduce friction:** Prepare materials, silence distractions, and set a timer.
4. **Work in short blocks:** Short focused sessions with breaks can rebuild momentum.
5. **Be kind after setbacks:** Restarting gently is more effective than self-criticism.

If low motivation has lasted a long time and affects daily functioning or mood, consider reaching out to a counselor or health professional.${lang}`;
      case "grief":
        return `**Direct answer:** Grief doesn’t follow a straight line or a fixed schedule. Whatever you’re feeling — sadness, numbness, anger, guilt, or moments of okayness — can be a natural part of grieving.

**What may help**
1. **Lower expectations:** Focus on essentials and allow yourself time.
2. **Let feelings come in waves:** You don’t have to process everything at once.
3. **Keep connection:** Reach out to someone supportive, even briefly.
4. **Create meaning/ritual if helpful:** Remembering in your own way can be comforting.
5. **Ask for practical help:** It’s okay to request specific support.

If grief feels unbearable, lasts without relief, or includes thoughts of not wanting to be here, please seek professional or crisis support. You deserve care during this.${lang}`;
      case "financial stress":
        return `**Direct answer:** Financial stress can affect your wellbeing and sense of safety. Getting clear on priorities and asking about available support early can make the situation more manageable.

**Practical steps**
1. **List essentials and deadlines:** Focus first on food, housing, transport, medicine, and urgent school needs.
2. **Get clarity:** Write down income, expenses, and what’s due soon.
3. **Ask early:** Contact your school office, student affairs, or relevant services about payment plans, aid, or emergency support.
4. **Talk to someone trusted:** You don’t have to carry money stress alone.
5. **Make one small weekly plan:** A simple, realistic plan is better than avoiding the problem.

If financial stress is affecting your safety, housing, or ability to continue school, seek support as soon as possible.${lang}`;
      case "getting support":
        return `**Direct answer:** Reaching out for support is a strong and reasonable step. You don’t need to be in crisis or have perfect words to start.

**How to prepare**
1. **Write 2–3 things** you want help with (what’s happening, how long, how it affects you).
2. **Start simply:** “I’ve been struggling with…” is enough for a first conversation.
3. **Ask questions:** You can ask about confidentiality, what to expect, and how sessions work.
4. **Go at your pace:** You can choose what to share and when.

**A realistic next step**
Book/contact a counselor or trusted support person and share one sentence about what you need help with today.

If you are in immediate danger or feel unsafe, use **Help & Crisis** or local emergency services right away.${lang}`;
      default:
        return `**Direct answer:** I can help you think this through. Based on what you shared, the most useful next step is to clarify the main concern and choose one realistic action you can take now.

**Let’s break it down**
1. **Main concern:** What is the most important issue right now?
2. **What you know vs. assume:** Separate facts from worries or guesses.
3. **What you can control:** Identify one thing you can influence today.
4. **Support:** Who or what could help (friend, counselor, teacher, family, resource)?
5. **Next step:** Choose a small, specific action for the next 24 hours.

**Recommendation:** Start with the smallest helpful step, then reassess. You don’t have to solve everything at once.${lang}`;
    }
  })();

  return `${lead}${contextLine}\n\n${body}`;
}

function buildCounselorReply(topicName: string, ctx: ReplyContext): string {
  const q = ctx.question;
  const contextLine = q ? `\n\n**Context provided:** “${q}”` : "";

  const body = (() => {
    switch (topicName) {
      case "session planning":
        return `**Direct answer:** Plan a flexible session map centered on the student’s current needs, safety, and one or two meaningful goals.

**Practical structure**
1. **Review briefly:** Prior note, presenting concerns, agreed tasks, risk/safety factors, and one open question.
2. **Set goals:** Relational (rapport/safety), clinical (understanding/coping/change), and practical (plan/referral/follow-up).
3. **Open collaboratively:** “What feels most important to focus on today?” while screening for urgent concerns.
4. **Intervene with fit:** Choose strategies matched to presentation (e.g., grounding for arousal, activation for withdrawal, communication practice for conflict).
5. **Close clearly:** Summarize, confirm next steps, check understanding/agreement, and note follow-up.

**Documentation reminder:** Record key concerns, interventions, response, risk considerations, and plan objectively.

Use your clinical judgment, supervision, and institutional protocol for case-specific decisions.${contextLine}`;
      case "intake":
        return `**Direct answer:** A good intake balances rapport, safety, and enough structure to understand the concern and plan next steps.

**Key areas and example prompts**
1. **Presenting concern:** “What brings you in today?” “What would you like help with?”
2. **Onset/course & impact:** “When did this start?” “How is it affecting sleep, studies, relationships, or daily life?”
3. **Coping/supports/strengths:** “What has helped, even a little?” “Who supports you?”
4. **Risk & safety (ask directly):** Self-harm/suicidal thoughts, harm to others, abuse/unsafe situations, substance use, access to means — explain purpose and follow protocol.
5. **History as relevant:** Prior support/treatment, medical/substance factors, significant stressors/losses.
6. **Goals and expectations:** “What would feel different if this helped?”
7. **Consent/confidentiality limits:** Explain boundaries, documentation, and emergency procedures.

**Recommendation:** Keep it collaborative, pace sensitively, and end with a brief formulation and a clear next step.${contextLine}`;
      case "documentation":
        return `**Direct answer:** Documentation should be clear, objective, and useful for continuity and safety — not a transcript.

**Useful structures**
• **DAP:** Data (reported/observed, relevant quotes), Assessment (clinical impression linked to evidence), Plan (interventions, tasks, referrals, follow-up).
• **SOAP:** Subjective, Objective, Assessment, Plan.

**Good practice**
1. Distinguish observation from interpretation.
2. Use person-centered, nonjudgmental language (“student reported/appeared…”).
3. Record risk discussions specifically (questions asked, responses, formulation, actions, consultation, follow-up).
4. Include only information necessary for care/continuity and follow policy on privacy/retention.
5. Correct errors transparently per policy.

If helpful, I can help you outline a note in DAP/SOAP format from general details you provide.${contextLine}`;
      case "rapport":
        return `**Direct answer:** Engagement improves when students feel safe, respected, and given choice. Prioritize alliance before pushing for depth.

**Practical strategies**
1. **Validate first:** Reflect feelings and meaning before problem-solving.
2. **Be transparent:** Explain purpose of questions and invite collaboration on the agenda.
3. **Offer autonomy:** Give choices (where to start, pace, goals).
4. **Use reflective skills:** Open questions, affirmations, reflections, summaries (MI-consistent).
5. **Name and repair ruptures:** Gently check misunderstandings or discomfort in session.
6. **Match pacing:** Regulate first when highly activated; go slowly with guarded students.

**Recommendation:** Identify one small, student-relevant goal for the session to build momentum and trust.${contextLine}`;
      case "ethics":
        return `**Direct answer:** Slow down, clarify the dilemma, and use policy/code/consultation to guide a defensible, student-centered decision.

**Decision framework**
1. **Define the issue:** Confidentiality, boundaries, consent, competence, dual relationship, documentation, or safety?
2. **Check facts and policy:** Separate knowns from assumptions; review institutional/legal requirements.
3. **Consider welfare and autonomy:** Choose the least intrusive option that maintains safety and care quality.
4. **Consult:** Seek supervision/colleague input early, especially for ambiguity or risk.
5. **Document reasoning:** Record considerations, consultation, decision, and follow-up actions.

**Important:** Urgent safety/mandatory reporting obligations take precedence per applicable law and institutional protocol.${contextLine}`;
      case "coping strategies":
        return `**Direct answer:** Match coping strategies to the student’s current state, goals, culture, and capacity — and practice one skill at a time.

**Examples by need**
• **High arousal/panic:** Slow breathing, grounding (5-4-3-2-1), sensory regulation, brief movement.
• **Low mood/withdrawal:** Behavioral activation (small mastery + connection/pleasure activities), routine support.
• **Worry/rumination:** Worry scheduling, thought records, values-based action, problem-solving.
• **Sleep issues:** Wind-down routine, consistent wake time, stimulus control, worry dump.
• **Conflict/communication:** “I” statements, boundary-setting, repair attempts, role-play.
• **Avoidance/anxiety:** Graded, collaborative exposure steps with coping supports.

**Recommendation:** Explain rationale, anticipate barriers, agree on when/how to use the skill, and review outcomes next session.${contextLine}`;
      case "burnout":
        return `**Direct answer:** Burnout is a workload/resource and sustainability issue — not a personal failure. Address both self-care and systemic boundaries.

**Practical steps**
1. **Assess load:** Track real demands (sessions, documentation, admin tasks) and identify what can be reduced/delegated/deferred.
2. **Protect boundaries:** Transition time between sessions, clear response-time expectations, and protected breaks.
3. **Use support:** Supervision/peer consultation, especially for complex or high-risk cases.
4. **Restore basics:** Sleep, nutrition, movement, and meaningful non-work recovery.
5. **Name systemic issues:** When policies/staffing create unsafe load, raise concerns through appropriate channels.

If burnout is affecting health, judgment, or safety/quality of care, prioritize reducing load and seeking support promptly.${contextLine}`;
      case "termination":
        return `**Direct answer:** Planned endings should consolidate gains, prepare for setbacks, and support continuity of care.

**Closing structure**
1. **Signal early:** Give notice and invite feelings/questions about ending.
2. **Review progress:** What changed, what helped, and what the student contributed.
3. **Relapse-prevention plan:** Early warning signs, coping steps, supports, and when/how to seek help again.
4. **Address referrals/continuity:** Provide clear options and warm handoff where possible.
5. **Document:** Summary of progress, remaining concerns, plan, referrals, and safety considerations as relevant.

Unplanned endings should still include a clear transition/safety plan within role and institutional limits.${contextLine}`;
      case "referral":
        return `**Direct answer:** Refer when needs exceed scope/competence or a different level/type of care is indicated — and make the transition clear, collaborative, and safe.

**Referral best practices**
1. **Explain reason transparently:** Center student welfare and fit of care.
2. **Involve the student:** Discuss options, preferences, barriers (cost, access, timing).
3. **Make it concrete:** Provide contact details/steps; do warm handoff when possible and consented.
4. **Clarify responsibilities:** Who follows up, interim supports, and what to do if risk increases.
5. **Document:** Rationale, discussion/consent, referral details, and follow-up plan.

For imminent risk, follow emergency protocol immediately rather than relying on routine referral.${contextLine}`;
      default:
        return `**Direct answer:** A helpful way to approach this is to clarify the question, assess context/safety, and choose a proportionate next step.

**Clinical thinking prompts**
1. **Presenting concern:** What is the core issue and goal right now?
2. **Context and factors:** Relevant stressors, supports, strengths, and risks?
3. **Safety/ethics:** Any urgent risk, confidentiality, or boundary considerations?
4. **Intervention fit:** What approach best matches the student’s needs and capacity?
5. **Next step:** Define one clear action, follow-up, or consultation/documentation need.

If you share more non-identifying context, I can help you make this more specific. I can support your reasoning, but I can’t replace supervision, policy, or direct assessment.${contextLine}`;
    }
  })();

  return body;
}

function buildAdminReply(topicName: string, ctx: ReplyContext): string {
  const q = ctx.question;
  const contextLine = q ? `\n\n**Context provided:** “${q}”` : "";

  switch (topicName) {
    case "password management":
      return `**Direct answer:** Handle password resets/sets securely by verifying identity, using strong temporary credentials, and sharing them through a secure, one-time channel.

**Recommended steps**
1. **Verify identity** using your institution’s approved process before taking action.
2. **Use a strong temporary password** (or secure reset flow) and require change on next sign-in if policy supports it.
3. **Share securely, once:** Deliver only to the intended user through an approved channel. Do not post passwords in tickets/chats/emails others can access.
4. **Confirm the right account:** Double-check name, email, ID, and role before and after the change.
5. **If compromise is suspected:** Review recent activity/audit events, follow incident procedures, and notify per policy.

**Mindwell note:** Existing passwords cannot be viewed (they’re hashed). In User Management, you can set/generate a new password and it should be copied and delivered immediately/securely.${contextLine}`;
    case "account management":
      return `**Direct answer:** Manage accounts with least privilege, accurate identity details, and careful verification before and after changes.

**Checklist**
1. **Confirm identity and purpose:** Ensure the request is authorized and you’re updating the correct user.
2. **Roles and access:** Assign only necessary permissions (student/counselor/admin). Review impact of role/status changes.
3. **Data accuracy:** Keep key details current (name, email, student/counselor identifiers and required profile info) to avoid mismatches.
4. **Status changes:** Activate/deactivate/suspend according to policy and document reasons when required.
5. **Verify outcome:** Confirm sign-in/access works as intended and no unintended access was granted.
6. **Privacy:** Do not access or share private counseling records/content beyond policy.

If you tell me the exact action (create, update, role change, deactivate/reactivate), I can give a step-by-step flow.${contextLine}`;
    case "audit & security":
      return `**Direct answer:** Use audit logs to identify unusual or unauthorized activity, then validate, contain, and document according to policy.

**How to review effectively**
1. **Scope first:** Filter by time range, actor, action type, and target account/resource.
2. **Look for anomalies:** Repeated failures, off-hours changes, unexpected role escalations, bulk actions, or sensitive setting/password events.
3. **Correlate:** Check tickets/approvals and confirm whether actions were authorized.
4. **Respond per policy:** If suspicious, preserve evidence, contain access, notify appropriate stakeholders, and document actions.
5. **Protect privacy:** Avoid exposing sensitive user data while investigating.

I can help interpret a pattern if you describe events in general terms (without secrets or private counseling data).${contextLine}`;
    case "reports & analytics":
      return `**Direct answer:** Use reports to answer a specific operational question, validate data quality, and turn insights into safe, actionable follow-up.

**Approach**
1. **Define the question and period:** What decision are you trying to make, and over what timeframe?
2. **Validate the data:** Check filters (role/status/date), completeness, duplicates, and consistency.
3. **Interpret responsibly:** Focus on trends and aggregates; avoid exposing sensitive individual/student information.
4. **Act and follow up:** Translate findings into operational steps (capacity, support, outreach, process fixes) and review impact later.

Tell me which report/metric you’re reviewing and the decision you need to make, and I can help you analyze it.${contextLine}`;
    default:
      return `**Direct answer:** I can help you handle this safely and systematically.

**General admin approach**
1. **Clarify goal and authorization:** Confirm the action is appropriate and policy-backed.
2. **Identify exact targets:** Double-check user/account IDs, names, emails, roles, and affected settings.
3. **Apply least privilege & privacy:** Only make necessary changes; do not access/share private counseling data.
4. **Execute carefully:** Make the change and record required details per policy.
5. **Verify and review:** Confirm the intended outcome and check audit/logs for sensitive actions.

Share the specific task and any constraints (without secrets/private data), and I’ll provide more precise steps.${contextLine}`;
  }
}

function detectTopic(role: AssistantRole, text: string): Topic | null {
  const topics: Topic[] = role === "counselor" ? counselorTopics : studentTopics;
  let best: Topic | null = null;
  let bestScore = 0;
  for (const topic of topics) {
    let score = 0;
    for (const kw of topic.keywords) {
      if (text.includes(kw)) score += kw.includes(" ") ? 2 : 1;
    }
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}

const studentTopics: Topic[] = [
  { name: "panic", keywords: ["panic attack", "panic", "panic attack ako", "hindi makahinga", "can't breathe", "cant breathe", "heart racing", "shaking", "kinakabahan", "nahadlok", "kulba"], followUps: [], reply: (ctx) => buildStudentReply("panic", ctx) },
  { name: "sleep", keywords: ["sleep", "insomnia", "can't sleep", "cant sleep", "nakakatulog", "makatulog", "puyat", "tulog", "bedtime", "awake at night", "dili makatulog"], followUps: [], reply: (ctx) => buildStudentReply("sleep", ctx) },
  { name: "academic stress", keywords: ["exam", "exams", "test", "tests", "study", "studying", "thesis", "deadline", "deadlines", "grades", "schoolwork", "project", "requirements", "eskwela", "aral", "klase"], followUps: [], reply: (ctx) => buildStudentReply("academic stress", ctx) },
  { name: "anxiety", keywords: ["anxiety", "anxious", "worried", "worry", "overthinking", "overthink", "nervous", "racing thoughts", "kabado", "kinakabahan", "balaka", "mabalaka"], followUps: [], reply: (ctx) => buildStudentReply("anxiety", ctx) },
  { name: "stress", keywords: ["stress", "stressed", "overwhelmed", "pressure", "burnout", "burnt out", "pagod", "kapoy", "bug-at", "too much"], followUps: [], reply: (ctx) => buildStudentReply("stress", ctx) },
  { name: "low mood", keywords: ["depressed", "depression", "low mood", "sad", "lonely", "hopeless", "empty", "numb", "unmotivated", "malungkot", "nalulungkot", "masulob-on", "walang gana", "crying"], followUps: [], reply: (ctx) => buildStudentReply("low mood", ctx) },
  { name: "relationships", keywords: ["relationship", "friend", "friends", "family", "parents", "partner", "boyfriend", "girlfriend", "breakup", "fight", "conflict", "argument", "kaibigan", "pamilya", "away"], followUps: [], reply: (ctx) => buildStudentReply("relationships", ctx) },
  { name: "loneliness", keywords: ["lonely", "loneliness", "isolated", "alone", "no friends", "left out", "nag-iisa", "walang kausap"], followUps: [], reply: (ctx) => buildStudentReply("loneliness", ctx) },
  { name: "anger", keywords: ["angry", "anger", "furious", "irritated", "frustrated", "temper", "galit", "nasuko", "suko"], followUps: [], reply: (ctx) => buildStudentReply("anger", ctx) },
  { name: "self-esteem", keywords: ["confidence", "self-esteem", "self esteem", "worthless", "not good enough", "insecure", "failure", "hate myself", "walang kwenta"], followUps: [], reply: (ctx) => buildStudentReply("self-esteem", ctx) },
  { name: "motivation", keywords: ["motivation", "motivated", "procrastinate", "procrastination", "focus", "distracted", "can't start", "cant start", "walang gana", "tinamad"], followUps: [], reply: (ctx) => buildStudentReply("motivation", ctx) },
  { name: "grief", keywords: ["grief", "grieving", "loss", "died", "death", "passed away", "funeral", "miss them", "namatayan", "nawalan"], followUps: [], reply: (ctx) => buildStudentReply("grief", ctx) },
  { name: "financial stress", keywords: ["money", "financial", "finances", "broke", "tuition", "afford", "budget", "debt", "pera", "gastos", "bayad"], followUps: [], reply: (ctx) => buildStudentReply("financial stress", ctx) },
  { name: "getting support", keywords: ["counseling", "counselling", "counselor", "counsellor", "therapy", "therapist", "talk to someone", "professional help", "humingi ng tulong"], followUps: [], reply: (ctx) => buildStudentReply("getting support", ctx) },
];

const counselorTopics: Topic[] = [
  { name: "session planning", keywords: ["prepare", "prep", "session plan", "next session", "agenda", "before session", "plan my session"], followUps: [], reply: (ctx) => buildCounselorReply("session planning", ctx) },
  { name: "intake", keywords: ["intake", "assessment", "history questions", "first meeting", "presenting concern", "what should i ask"], followUps: [], reply: (ctx) => buildCounselorReply("intake", ctx) },
  { name: "documentation", keywords: ["document", "documentation", "session note", "soap", "dap", "write a note", "chart", "record"], followUps: [], reply: (ctx) => buildCounselorReply("documentation", ctx) },
  { name: "rapport", keywords: ["rapport", "engagement", "resistant", "guarded", "alliance", "won't talk", "wont talk", "motivational interviewing"], followUps: [], reply: (ctx) => buildCounselorReply("rapport", ctx) },
  { name: "ethics", keywords: ["ethic", "ethics", "boundary", "boundaries", "confidentiality", "consent", "dual relationship", "self-disclosure"], followUps: [], reply: (ctx) => buildCounselorReply("ethics", ctx) },
  { name: "coping strategies", keywords: ["coping", "intervention", "technique", "strategy", "strategies", "grounding", "behavioral activation", "suggest"], followUps: [], reply: (ctx) => buildCounselorReply("coping strategies", ctx) },
  { name: "burnout", keywords: ["burnout", "burnt out", "self-care", "self care", "compassion fatigue", "exhausted"], followUps: [], reply: (ctx) => buildCounselorReply("burnout", ctx) },
  { name: "termination", keywords: ["termination", "terminate", "closing", "end therapy", "ending", "discharge", "goodbye"], followUps: [], reply: (ctx) => buildCounselorReply("termination", ctx) },
  { name: "referral", keywords: ["referral", "refer", "specialist", "psychiatry", "handoff", "outside service", "level of care"], followUps: [], reply: (ctx) => buildCounselorReply("referral", ctx) },
];

function detectAdminTopic(text: string): string | null {
  if (/(password|reset|credential|temporary|otp|forgot)/.test(text)) return "password management";
  if (/(user|account|student|counselor|role|status|create|deactivate|suspend|activate|permission|access)/.test(text)) return "account management";
  if (/(audit|log|security|suspicious|incident|breach|unauthorized)/.test(text)) return "audit & security";
  if (/(report|analytics|appointment|usage|metric|trend|dashboard)/.test(text)) return "reports & analytics";
  return null;
}

export function getAssistantReply(
  role: AssistantRole,
  prompt: string,
  history: AssistantMessage[] = []
): AssistantReply {
  const raw = prompt.trim();
  const text = normalise(raw);
  const prevUsers = history.filter((m) => m.role === "user");
  const lastUser = [...prevUsers].reverse()[0]?.content || "";
  const lastAssistant = [...history].reverse().find((m) => m.role === "assistant")?.content || "";
  const lastTopic = extractLastTopic(history);
  const isQuestion = /[?]|^(what|how|why|when|where|who|can|could|should|would|is|are|do|does|paano|bakit|ano|sino|kailan|saan|unsa|ngano|giunsa|asa|kinsa)\b/i.test(raw);
  const isFollowUp = isLikelyFollowUp(text, raw, history);

  let effectiveRaw = raw;
  let effectiveText = text;
  if (isFollowUp && lastUser) {
    // Resolve short/follow-up messages against recent context
    effectiveRaw = `${lastUser}\nFollow-up: ${raw}`;
    effectiveText = normalise(effectiveRaw);
  }

  const language = detectLanguage(`${lastUser} ${raw}`);
  const question = shorten(raw, 180);

  const ctx: ReplyContext = {
    role,
    raw: effectiveRaw,
    text: effectiveText,
    question,
    language,
    history,
    lastUserText: lastUser,
    lastAssistantText: lastAssistant,
    lastTopic,
    isFollowUp,
    isQuestion,
  };

  if (!text) {
    return {
      topic: "empty",
      content:
        language === "fil"
          ? "Ano ang gusto mong pag-usapan o itanong? Maaari mong ilarawan nang kaunti ang sitwasyon mo."
          : language === "ceb"
            ? "Unsa may gusto nimo hisgutan o pangutan-on? Pwede nimo isaysay gamay ang imong sitwasyon."
            : "What would you like to work through? You can share a question or tell me a little about what’s happening.",
      followUps: assistantPrompts[role].slice(0, 3),
    };
  }

  if (CRISIS_PATTERN.test(effectiveText) || CRISIS_PATTERN.test(text)) {
    if (role === "counselor") return { topic: "safety", content: counselorCrisisReply(), followUps: ["How do I ask about plan, intent, and means?", "What should I document right now?", "How can I structure a safety plan?"] };
    if (role === "admin") return { topic: "safety & privacy", content: adminCrisisReply(), followUps: ["What minimum info should be shared in escalation?", "How should I verify identity before account action?", "What audit details should I record?"] };
    return { topic: "safety", content: studentCrisisReply(language), followUps: ["Can you help me write what to say to someone I trust?", "Where can I find Help & Crisis in Mindwell?", "Can you help me make a plan for the next hour?"] };
  }

  if (INFO_PATTERN.test(text)) {
    return { topic: "about the assistant", content: infoReply(role), followUps: followUpSuggestions(role, "general", language) };
  }

  if (GREETING_PATTERN.test(text) && !isFollowUp) {
    return {
      topic: "greeting",
      content:
        role === "counselor"
          ? "Hello. I’m here to help you think through session planning, documentation, interventions, ethical questions, or safety concerns. What situation would you like to work on?"
          : role === "admin"
            ? "Hello. I can help with accounts, secure password handling, roles, reports, audit logs, and privacy/safety operations. What do you need help with?"
            : language === "fil"
              ? "Kumusta. Nandito ako para tumulong. Maaari mong ikuwento kung ano ang nararamasan mo o magtanong tungkol sa stress, tulog, pag-aaral, relasyon, at iba pa. Ano ang maitutulong ko ngayon?"
              : language === "ceb"
                ? "Kumusta. Ania ko para motabang. Pwede nimo isulti unsay imong gibati o mangutana bahin sa stress, tulog, eskwela, relasyon, ug uban pa. Unsa may akong matabangan karon?"
                : "Hello. I’m here to help. You can tell me what’s been going on or ask about stress, sleep, studies, relationships, motivation, or anything else on your mind. What would be most helpful right now?",
      followUps: assistantPrompts[role].slice(0, 3),
    };
  }

  if (THANKS_PATTERN.test(text)) {
    return {
      topic: "acknowledgement",
      content:
        language === "fil"
          ? "Walang anuman. Kung gusto mo, maaari pa tayong magpatuloy — sabihin mo lang kung alin ang hindi pa malinaw o ano ang susunod mong gustong gawin."
          : language === "ceb"
            ? "Walay sapayan. Kung gusto pa ka, padayon ta — isulti lang unsa pay dili klaro o unsay sunod nimong gusto buhaton."
            : role === "counselor"
              ? "You’re welcome. If you’d like, we can keep going — share the next part of the situation and I can help you think it through."
              : role === "admin"
                ? "You’re welcome. If you need help with the next step (accounts, passwords, roles, reports, audit, or privacy), I can walk you through it."
                : "You’re welcome. If you’d like, tell me what still feels unresolved or what you want to try next, and we can continue.",
      followUps: followUpSuggestions(role, lastTopic || "general", language),
    };
  }

  if (role === "admin") {
    const topicName = detectAdminTopic(effectiveText) || "general admin guidance";
    const content = buildAdminReply(topicName, ctx);
    return { topic: topicName, content, followUps: followUpSuggestions(role, topicName, language) };
  }

  let topic = detectTopic(role, effectiveText);
  if (!topic && isFollowUp && lastTopic) {
    const pool = role === "counselor" ? counselorTopics : studentTopics;
    topic = pool.find((t) => t.name === lastTopic) || null;
  }

  if (topic) {
    return { topic: topic.name, content: topic.reply(ctx), followUps: followUpSuggestions(role, topic.name, language) };
  }

  // General adaptive response
  if (role === "counselor") {
    return {
      topic: "general guidance",
      content: buildCounselorReply("general guidance", ctx),
      followUps: followUpSuggestions(role, "general", language),
    };
  }

  return {
    topic: "general guidance",
    content: buildStudentReply("general guidance", ctx),
    followUps: followUpSuggestions(role, "general", language),
  };
}
