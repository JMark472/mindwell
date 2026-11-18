export type AssistantRole = "student" | "counselor" | "admin";
export type ResponseMode = "short" | "standard" | "detailed";

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantOptions {
  mode?: ResponseMode;
  preferredLanguage?: string; // "auto" or language code/name
}

export interface AssistantReply {
  content: string;
  topic: string;
  followUps?: string[];
  detectedLanguage?: string;
  mode?: ResponseMode;
}

interface LangInfo {
  code: string;
  name: string;
}

interface ParsedInstruction {
  isControl: boolean;
  action?:
    | "shorter"
    | "longer"
    | "detailed"
    | "standard"
    | "simplify"
    | "beginner"
    | "step_by_step"
    | "summarize"
    | "translate"
    | "translate_explain"
    | "professional"
    | "both_short_long"
    | "examples";
  targetLanguage?: LangInfo;
  sourceText?: string;
}

interface ReplyContext {
  role: AssistantRole;
  raw: string;
  text: string;
  question: string;
  language: LangInfo;
  mode: ResponseMode;
  history: AssistantMessage[];
  lastUserText: string;
  lastAssistantText: string;
  isFollowUp: boolean;
  isQuestion: boolean;
}

const CRISIS_PATTERN =
  /(suicid|kill myself|end my life|don'?t want to (live|be here)|self[- ]?harm|hurt myself|cut myself|no reason to live|better off dead|want to die|take my life|overdose|unsafe at home|someone is hurting me|being abused|abusive|assault|rape|can'?t go on|tired of living|no point in living|nothing to live for|hurt (someone|others)|kill (someone|others)|student (is )?(at risk|unsafe)|client (is )?(at risk|unsafe)|risk of harm|risk assessment|safety plan|harm to (self|others)|gusto ko nang mamatay|ayoko nang mabuhay|magpakamatay|papakamatayin ko ang sarili|saktan ang sarili|gusto kong mawala|wala nang saysay|gikapoy na ko og kinabuhi|gusto na ko mamatay|dili na ko gusto mabuhi|quiero morir|me quiero morir|suicidarme)/i;

const INFO_PATTERN =
  /^(who are you|what are you|what can you do|what do you do|your name|how do you work|are you a real (ai|person)|are you human|what are your capabilities|sino ka|ano ka|ano ang kaya mong gawin|kinsa ka|unsa ka|unsa imong mahimo|quien eres|qué puedes hacer)\??$/i;

const GREETING_PATTERN =
  /^(hi|hello|hey|kumusta|kamusta|musta|maayong (buntag|hapon|gabii|adlaw)|good (morning|afternoon|evening)|hello po|hi po|hola|bonjour|konnichiwa|annyeong|ni hao|nǐ hǎo)( there| po| ka| ra)?[!,.?\s]*$/i;

const THANKS_PATTERN =
  /^(thanks|thank you|thank u|ty|salamat|daghang salamat|salamat kaayo|gracias|merci|arigatou|xie xie|that helps|appreciate it)( so much| po| kaayo| for the help| for your help)?[!,.?\s]*$/i;

const FOLLOW_UP_PATTERN =
  /^(what (should|can|do) i do(\s+(now|next|about (it|this|that)))?|so what now|what now|how\b|why\b|can you (explain|tell me) more|tell me more|give me (an )?example|example\??|another one|and then\??|unsaon nako|unsa man akong buhaton|unsay akong buhaton|ano ang dapat kong gawin|paano\??|bakit\??|pwede mo bang ipaliwanag|pwede pa ba|elaborate|go on)\b/i;

const LANGUAGES: LangInfo[] = [
  { code: "en", name: "English" },
  { code: "fil", name: "Filipino" },
  { code: "ceb", name: "Cebuano" },
  { code: "es", name: "Spanish" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ar", name: "Arabic" },
  { code: "pt", name: "Portuguese" },
  { code: "hi", name: "Hindi" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
  { code: "th", name: "Thai" },
  { code: "ru", name: "Russian" },
];

export const assistantPrompts: Record<AssistantRole, string[]> = {
  student: [
    "I'm overwhelmed by exams",
    "Nahihirapan akong makatulog",
    "Help me stop overthinking",
    "Explain stress in simple words",
    "How do I deal with a friendship problem?",
    "Translate this to Filipino: I need help coping with anxiety",
  ],
  counselor: [
    "Help me plan my next session",
    "Give me intake questions",
    "How should I document this session?",
    "Explain motivational interviewing simply",
    "How do I respond to a student at risk?",
    "Summarize key steps for a safety plan",
  ],
  admin: [
    "How do I manage student and counselor accounts?",
    "How should I handle password resets securely?",
    "Explain audit logs in simple terms",
    "What reports should I review regularly?",
    "How can I support platform safety and privacy?",
    "Give a short checklist for role changes",
  ],
};

export function assistantGreeting(role: AssistantRole, fullName?: string | null) {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  const titles = new Set(["dr", "dr.", "mr", "mr.", "ms", "ms.", "mrs", "mrs.", "prof", "prof."]);
  const firstName = parts[0] && titles.has(parts[0].toLowerCase()) ? parts[1] : parts[0];
  const name = firstName ? ` ${firstName}` : "";

  if (role === "counselor") {
    return `Hi${name} — I'm your Mindwell AI Counseling Assistant. I can help you prepare sessions, think through clinical and ethical situations, choose interventions, draft objective documentation, and plan for safety and self-care.

I can explain topics in simple or detailed ways, respond in the language you prefer (including English, Filipino, and Cebuano), and adjust my answers to be shorter or more comprehensive.

I’ll provide practical, responsible guidance, but I can’t replace your clinical judgment, supervision, direct assessment, or your institution’s protocols.

What would you like to work through today?`;
  }
  if (role === "admin") {
    return `Hi${name} — I'm the Mindwell AI Admin Assistant. I can help with user/account management, secure password handling, role/access checks, reports and analytics, audit-log review, and privacy/safety operations.

I can provide short checklists or detailed explanations, simplify complex topics, and respond in your preferred language when possible.

I provide operational guidance only — verify actions against policy, protect credentials, and never access or share private counseling records.

What would you like help with?`;
  }

  return `Hi${name} — I'm the Mindwell AI Assistant. I can help you think through stress, anxiety, sleep, studies, relationships, motivation, grief, and other everyday concerns with practical, easy-to-understand guidance.

I can respond in the language you use (including English, Filipino, and Cebuano), give short or detailed answers, and explain things step by step in simple words.

I can support you, but I can’t diagnose conditions or provide emergency/crisis care. If you may be in immediate danger, please contact local emergency services or use Help & Crisis.

What’s on your mind today?`;
}

function normalise(value: string) {
  return value
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\p{L}\p{N}\s'".!?,:;()\/-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shortenText(value: string, limit = 220) {
  const text = value.trim().replace(/\s+/g, " ");
  return text.length > limit ? `${text.slice(0, limit - 1).trim()}…` : text;
}

function detectScriptLanguage(text: string): LangInfo | null {
  if (/[\u3040-\u30ff]/.test(text)) return { code: "ja", name: "Japanese" };
  if (/[\uac00-\ud7af]/.test(text)) return { code: "ko", name: "Korean" };
  if (/[\u4e00-\u9fff]/.test(text)) return { code: "zh", name: "Chinese" };
  if (/[\u0600-\u06ff]/.test(text)) return { code: "ar", name: "Arabic" };
  if (/[\u0900-\u097f]/.test(text)) return { code: "hi", name: "Hindi" };
  if (/[\u0e00-\u0e7f]/.test(text)) return { code: "th", name: "Thai" };
  if (/[\u0400-\u04ff]/.test(text)) return { code: "ru", name: "Russian" };
  return null;
}

function detectLanguage(text: string): LangInfo {
  const t = ` ${normalise(text)} `;
  const script = detectScriptLanguage(text);
  if (script) return script;

  const score: Record<string, number> = {
    fil: 0,
    ceb: 0,
    es: 0,
    fr: 0,
    de: 0,
    pt: 0,
    vi: 0,
    id: 0,
    en: 0,
  };
  const has = (w: string) => t.includes(` ${w} `) || t.includes(w);
  const bump = (code: string, words: string[]) => {
    for (const w of words) if (has(w)) score[code] += 1;
  };

  bump("fil", [" ako ", " ikaw ", " hindi ", " paano ", " bakit ", " gusto ", " nalulungkot ", " nahihirapan ", " tulong ", " kinakabahan ", " pagod ", " problema ", " sana ", " kasi ", " yung ", " nga ", " po ", " naman ", " araw ", " ngayon ", " maaari ", " kumusta ", " kamusta ", " salamat ", " maganda ", " mabuti ", " opo "]);
  bump("ceb", [" dili ", " wala ", " unsa ", " giunsa ", " nganong ", " ngano ", " gusto ", " kapoy ", " nahadlok ", " nasuko ", " tabang ", " unya ", " kaayo ", " ra ", " nako ", " nimo ", " imo ", " karon ", " maayong ", " salamat ", " kumusta "]);
  bump("es", [" hola ", " gracias ", " por favor ", " como ", " cómo ", " qué ", " que ", " necesito ", " ayuda ", " estoy ", " tengo ", " porque ", " pero ", " puedes ", " adios ", " adiós "]);
  bump("fr", [" bonjour ", " merci ", " comment ", " je ", " vous ", " aide ", " besoin ", " pourquoi ", " avec ", " salut "]);
  bump("de", [" hallo ", " danke ", " wie ", " ich ", " nicht ", " bitte ", " hilfe ", " warum ", " gut "]);
  bump("pt", [" olá ", " ola ", " obrigado ", " como ", " você ", " voce ", " preciso ", " ajuda ", " não ", " nao "]);
  bump("vi", [" xin chào ", " xin chao ", " cảm ơn ", " cam on ", " tôi ", " toi ", " giúp ", " giup ", " không ", " khong "]);
  bump("id", [" halo ", " terima kasih ", " saya ", " kamu ", " tidak ", " bantuan ", " bagaimana ", " mengapa "]);
  bump("en", [" the ", " and ", " help ", " what ", " how ", " why ", " please ", " feel ", " need ", " hello ", " thanks "]);

  if (/[àâçéèêëîïôûùüÿœ]/i.test(text)) score.fr += 1;
  if (/[äöüß]/i.test(text)) score.de += 1;
  if (/[áéíóúñ¿¡]/i.test(text)) score.es += 1;
  if (/[ãõç]/i.test(text)) score.pt += 1;

  // Prefer Filipino for shared greetings when no strong Cebuano-only markers
  const hasCebuanoMarker = [" dili ", " wala ", " unsa ", " giunsa ", " nganong ", " ngano ", " kaayo ", " ra ", " nako ", " nimo "].some((w) => has(w));
  if (/\b(kumusta|kamusta|salamat|po)\b/i.test(text) && !hasCebuanoMarker) score.fil += 1;
  if (/\bmaayong\b/i.test(text)) score.ceb += 1;

  if (score.fil >= 2 && score.ceb >= 2) return { code: hasCebuanoMarker ? "ceb" : "fil", name: hasCebuanoMarker ? "Cebuano" : "Filipino" };
  const entries = Object.entries(score).sort((a, b) => b[1] - a[1]);
  const [bestCode, bestScore] = entries[0];
  if (bestScore >= 2) return LANGUAGES.find((l) => l.code === bestCode) || { code: "en", name: "English" };
  if (bestScore >= 1 && bestCode !== "en") return LANGUAGES.find((l) => l.code === bestCode) || { code: "en", name: "English" };
  if (/\b(kumusta|kamusta)\b/i.test(text)) return { code: "fil", name: "Filipino" };
  return { code: "en", name: "English" };
}

function findLanguageByNameOrCode(value: string): LangInfo | null {
  const v = normalise(value);
  if (!v) return null;
  const map: [RegExp, string][] = [
    [/\b(english|ingles)\b/, "en"],
    [/\b(filipino|tagalog|taglish)\b/, "fil"],
    [/\b(cebuano|bisaya|binisaya|visayan)\b/, "ceb"],
    [/\b(spanish|espanol|español)\b/, "es"],
    [/\b(chinese|mandarin|zhongwen)\b/, "zh"],
    [/\b(japanese|nihongo)\b/, "ja"],
    [/\b(korean|hangul)\b/, "ko"],
    [/\b(french|francais|français)\b/, "fr"],
    [/\b(german|deutsch)\b/, "de"],
    [/\b(arabic)\b/, "ar"],
    [/\b(portuguese|portugues)\b/, "pt"],
    [/\b(hindi)\b/, "hi"],
    [/\b(vietnamese)\b/, "vi"],
    [/\b(indonesian|bahasa)\b/, "id"],
    [/\b(thai)\b/, "th"],
    [/\b(russian)\b/, "ru"],
  ];
  for (const [re, code] of map) if (re.test(v)) return LANGUAGES.find((l) => l.code === code) || null;
  for (const l of LANGUAGES) if (v === l.code) return l;
  return null;
}

function parseInstruction(raw: string): ParsedInstruction {
  const t = normalise(raw);
  const lower = raw.toLowerCase();

  if (/\btranslate\b/.test(t) || /\bisalin\b/.test(t) || /\bhubad\b/.test(t) || /\bitranslate\b/.test(t)) {
    const langMatch = lower.match(/(?:into|to|in|sa|ng)\s+(english|filipino|tagalog|cebuano|bisaya|spanish|español|espanol|chinese|mandarin|japanese|korean|french|german|arabic|portuguese|hindi|vietnamese|indonesian|thai|russian)\b/);
    const targetLanguage = langMatch ? findLanguageByNameOrCode(langMatch[1]) || undefined : undefined;
    const quoted = raw.match(/["“]([\s\S]+?)["”]/)?.[1]?.trim();
    const colon = raw.split(/:\s*/).slice(1).join(": ").trim();
    const sourceText = quoted || (colon && colon.length > 0 ? colon : undefined);
    const both = /\btranslate and explain\b/.test(t) || /\bexplain the meaning\b/.test(t);
    return { isControl: true, action: both ? "translate_explain" : "translate", targetLanguage, sourceText };
  }

  if (/\b(make it|give me a|give a)?\s*(short(er)?|brief|concise)(\s+version|\s+answer)?\b/.test(t) || t === "shorter" || t === "summarize briefly") {
    return { isControl: true, action: "shorter" };
  }
  if (/\b(summarize|summary|sum it up|tl;dr)\b/.test(t)) {
    return { isControl: true, action: "summarize" };
  }
  if (/\b(more detailed|more detail|detailed answer|long(er)?|give me a detailed|explain (it )?more|elaborate|expand on (this|that|it))\b/.test(t)) {
    return { isControl: true, action: /\blong(er)?\b/.test(t) && !/\bdetail\b/.test(t) ? "longer" : "detailed" };
  }
  if (/\b(standard answer|normal answer|balanced answer)\b/.test(t)) {
    return { isControl: true, action: "standard" };
  }
  if (/\b(simple words|simple english|simplify|explain simply|easy to understand|make it simple)\b/.test(t)) {
    return { isControl: true, action: "simplify" };
  }
  if (/\b(like i'?m a beginner|explain like i'?m a beginner|for a beginner|eli5|teach me like a beginner)\b/.test(t)) {
    return { isControl: true, action: "beginner" };
  }
  if (/\b(step by step|step-by-step)\b/.test(t)) {
    return { isControl: true, action: "step_by_step" };
  }
  if (/\b(give (me )?(an )?example|examples|practical examples)\b/.test(t) && t.split(/\s+/).length <= 8) {
    return { isControl: true, action: "examples" };
  }
  if (/\b(make it professional|professional tone)\b/.test(t)) {
    return { isControl: true, action: "professional" };
  }
  if (/\b(both short and (long|detailed)|short and long)\b/.test(t)) {
    return { isControl: true, action: "both_short_long" };
  }

  // "respond in X" / "in X please" as language preference instruction
  const respondLang = lower.match(/(?:respond|reply|answer|explain)\s+(?:in|using)\s+([a-zA-Z\u00C0-\u024f\s/()-]+)$/i);
  if (respondLang) {
    const lang = findLanguageByNameOrCode(respondLang[1]);
    if (lang) return { isControl: true, action: "translate_explain", targetLanguage: lang };
  }

  return { isControl: false };
}

function modeFromInstruction(action?: ParsedInstruction["action"], fallback: ResponseMode = "standard"): ResponseMode {
  if (action === "shorter" || action === "summarize") return "short";
  if (action === "longer" || action === "detailed" || action === "step_by_step" || action === "examples" || action === "both_short_long") return "detailed";
  if (action === "standard" || action === "simplify" || action === "beginner" || action === "professional" || action === "translate" || action === "translate_explain") return fallback;
  return fallback;
}

function extractLastUser(history: AssistantMessage[]) {
  return [...history].reverse().find((m) => m.role === "user")?.content || "";
}
function extractLastAssistant(history: AssistantMessage[]) {
  return [...history].reverse().find((m) => m.role === "assistant")?.content || "";
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toBullets(text: string, max = 6): string[] {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const bullets = lines
    .filter((l) => /^([-*•]|\d+[.)])\s+/.test(l) || l.length < 140)
    .map((l) => l.replace(/^([-*•]|\d+[.)])\s+/, "").trim())
    .filter(Boolean);
  if (bullets.length >= 2) return bullets.slice(0, max);
  return splitSentences(text).slice(0, max).map((s) => s.replace(/^([-*•]|\d+[.)])\s+/, ""));
}

function makeShort(content: string): string {
  const text = content.replace(/\r/g, "").trim();
  const direct = text.split(/\n\n/)[0]?.trim() || splitSentences(text)[0] || text;
  const bullets = toBullets(text, 4).filter((b) => b && b !== direct);
  const out = [direct];
  if (bullets.length) out.push("", ...bullets.slice(0, 3).map((b) => `- ${b}`));
  return out.join("\n").trim();
}

function makeDetailed(content: string, ctx: ReplyContext): string {
  const text = content.trim();
  const bullets = toBullets(text, 8);
  const parts = [
    text,
    "",
    "More detail and practical guidance:",
    bullets.length ? bullets.slice(0, 5).map((b) => `- ${b}`).join("\n") : "- Consider the main concern, what you can control now, and one realistic next step.",
    "",
    "Suggested next steps:",
    "1. Clarify your main goal or concern.",
    "2. Choose one small, specific action you can do today.",
    "3. Review what worked and adjust if needed.",
  ];
  if (ctx.role === "student") {
    parts.push("", "If this concern is affecting your daily life, safety, or wellbeing for a while, reaching out to a counselor or trusted support person can help.");
  } else if (ctx.role === "counselor") {
    parts.push("", "Use your clinical judgment, supervision, and institutional policies when applying these ideas to a specific case.");
  } else {
    parts.push("", "Verify actions against your organization’s policies, privacy requirements, and security procedures.");
  }
  return parts.join("\n").trim();
}

function simplifyText(content: string): string {
  const lines = content.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const kept: string[] = [];
  for (const l of lines) {
    if (/^#{1,6}\s/.test(l)) { kept.push(l.replace(/^#{1,6}\s*/, "")); continue; }
    if (/^\*\*.*\*\*:?$/.test(l)) { kept.push(l.replace(/\*\*/g, "")); continue; }
    kept.push(l.replace(/\*\*/g, ""));
  }
  const bullets = toBullets(kept.join("\n"), 6);
  const intro = splitSentences(kept.join(" "))[0] || "Here is a simple explanation:";
  return [
    "In simple words:",
    intro,
    "",
    ...bullets.slice(0, 5).map((b, i) => `${i + 1}. ${b}`),
    "",
    "If you want, I can also give an example or explain this step by step.",
  ].join("\n");
}

function toBeginner(content: string): string {
  const simple = simplifyText(content);
  return [
    "Beginner-friendly explanation:",
    "",
    simple.replace(/^In simple words:\n?/, ""),
    "",
    "Quick example:",
    "- Think of it as solving one small part at a time instead of everything at once.",
  ].join("\n");
}

function toStepByStep(content: string, ctx: ReplyContext): string {
  const bullets = toBullets(content, 8);
  const steps = (bullets.length ? bullets : splitSentences(content).slice(0, 6)).slice(0, 7);
  return [
    "Step-by-step:",
    "",
    ...steps.map((s, i) => `Step ${i + 1}: ${s}`),
    "",
    ctx.role === "student"
      ? "Tip: Start with Step 1 today, even if you can only do it for a few minutes."
      : ctx.role === "counselor"
        ? "Tip: Apply these steps flexibly, using clinical judgment and relevant protocols."
        : "Tip: Verify each step against policy and document actions when appropriate.",
  ].join("\n");
}

function toProfessional(content: string): string {
  return content
    .replace(/\bcan't\b/gi, "cannot")
    .replace(/\bdon't\b/gi, "do not")
    .replace(/\bI'm\b/g, "I am")
    .replace(/\bit's\b/gi, "it is")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function withBothLengths(content: string, ctx: ReplyContext): string {
  const short = makeShort(content);
  const detailed = makeDetailed(content, ctx);
  return `Short answer:\n${short}\n\nDetailed answer:\n${detailed}`;
}

function wrapForLanguage(text: string, target: LangInfo): string {
  if (target.code === "en") return text;
  if (target.code === "fil") return `Sagot (Filipino):\n\n${text}\n\n(Maaari mo akong sabihan kung gusto mo itong mas maikli, mas detalyado, o isalin sa ibang wika.)`;
  if (target.code === "ceb") return `Tubag (Cebuano):\n\n${text}\n\n(Pwede ko nimo paingon kung gusto nimo kini mas mubo, mas detalyado, o hubaron sa laing pinulongan.)`;
  if (target.code === "es") return `Respuesta (Español):\n\n${text}\n\n(Puedes pedirme una versión más corta, más detallada o una traducción a otro idioma.)`;
  return `Response (${target.name} requested):\n\n${text}\n\nNote: I can fully and reliably adapt responses in English, Filipino, and Cebuano in this assistant. For ${target.name}, I’ve provided the clearest helpful explanation I can. If you need a precise translation of specific text, share it and I’ll do my best to assist clearly.`;
}

function translateSimple(text: string, target: LangInfo): string {
  const src = text.trim();
  if (!src) return "Please provide the text you want to translate.";
  if (target.code === "en") return src; // assume understandable; real detection of source text could be added

  // Basic phrase-level support for en->fil/ceb for common assistant phrases and short texts
  const enFil: [RegExp, string][] = [
    [/\bi need help\b/gi, "Kailangan ko ng tulong"],
    [/\bi am stressed\b/gi, "Ako ay stressed"],
    [/\bi feel anxious\b/gi, "Nakakaramdam ako ng pagkabalisa"],
    [/\bi can't sleep\b/gi, "Hindi ako makatulog"],
    [/\bhow are you\b/gi, "Kumusta ka"],
    [/\bthank you\b/gi, "Salamat"],
    [/\byou are not alone\b/gi, "Hindi ka nag-iisa"],
    [/\btake a deep breath\b/gi, "Huminga nang malalim"],
    [/\bone step at a time\b/gi, "Isa-isang hakbang"],
  ];
  const enCeb: [RegExp, string][] = [
    [/\bi need help\b/gi, "Nanginahanglan ko og tabang"],
    [/\bi am stressed\b/gi, "Stress kaayo ko"],
    [/\bi feel anxious\b/gi, "Nabati ko og kabalaka"],
    [/\bi can't sleep\b/gi, "Dili ko makatulog"],
    [/\bhow are you\b/gi, "Kumusta ka"],
    [/\bthank you\b/gi, "Salamat"],
    [/\byou are not alone\b/gi, "Dili ka nag-inusara"],
    [/\btake a deep breath\b/gi, "Ginhawa og lawom"],
    [/\bone step at a time\b/gi, "Usa ka lakang sa usa ka higayon"],
  ];
  if (target.code === "fil") {
    let out = src;
    for (const [re, rep] of enFil) out = out.replace(re, rep);
    if (out !== src) return `Filipino translation (best effort):\n${out}`;
    return `Filipino translation (best effort):\n\n${src}\n\nNote: For precise, nuanced translation of longer or complex text, a dedicated translation service is recommended. I can still explain the meaning clearly in Filipino/English if you’d like.`;
  }
  if (target.code === "ceb") {
    let out = src;
    for (const [re, rep] of enCeb) out = out.replace(re, rep);
    if (out !== src) return `Cebuano translation (best effort):\n${out}`;
    return `Cebuano translation (best effort):\n\n${src}\n\nNote: For precise, nuanced translation of longer or complex text, a dedicated translation service is recommended. I can still explain the meaning clearly in Cebuano/English if you’d like.`;
  }
  if (target.code === "es") {
    const map: [RegExp, string][] = [[/\bi need help\b/gi, "Necesito ayuda"], [/\bthank you\b/gi, "Gracias"], [/\bhow are you\b/gi, "¿Cómo estás?"], [/\bi can't sleep\b/gi, "No puedo dormir"]];
    let out = src; for (const [re, rep] of map) out = out.replace(re, rep);
    if (out !== src) return `Spanish translation (best effort):\n${out}`;
  }

  return `Translation request\n\nOriginal text:\n${src}\n\nTarget language: ${target.name}\n\nI can reliably generate and adapt guidance in English, Filipino, and Cebuano. For ${target.name}, I don’t have a dedicated real-time translation service configured here, so I can’t guarantee a fully accurate translation of arbitrary text. If helpful, I can:\n- Explain the meaning in simple English\n- Provide a short summary\n- Rephrase it more clearly\n\nTell me which option you prefer.`;
}

function applyMode(content: string, ctx: ReplyContext, action?: ParsedInstruction["action"]): string {
  if (action === "both_short_long") return withBothLengths(content, ctx);
  if (action === "summarize" || ctx.mode === "short") return makeShort(content);
  if (action === "simplify") return simplifyText(content);
  if (action === "beginner") return toBeginner(content);
  if (action === "step_by_step") return toStepByStep(content, ctx);
  if (action === "professional") return toProfessional(content);
  if (ctx.mode === "detailed" || action === "detailed" || action === "longer" || action === "examples") return makeDetailed(content, ctx);
  return content.trim();
}

function buildStudentContent(topic: string, ctx: ReplyContext): string {
  const q = ctx.question ? `About what you shared: “${ctx.question}”\n\n` : "";
  const base = (() => {
    switch (topic) {
      case "academic stress":
        return `Direct answer: School pressure can feel overwhelming when tasks pile up, but breaking things into small steps can make it manageable.

Why this happens:
- Deadlines, uncertainty, and high expectations can increase stress and make it hard to start.

What can help:
1. List what’s due and prioritize the next 24–72 hours.
2. Turn big tasks into small, specific actions (for example, “review 5 pages”).
3. Work in short focused blocks with short breaks.
4. Protect basics like sleep, food, and hydration.
5. Ask for help or clarification early if needed.

Next step:
- Choose one small task you can start today for 10–20 minutes.`;
      case "sleep":
        return `Direct answer: Trouble sleeping is common when your mind or body feels stressed. A steady routine usually helps more than forcing sleep.

What can help:
1. Keep a consistent wake-up time.
2. Create a 30–60 minute wind-down routine before bed.
3. If you’re awake and frustrated, get up briefly and do something calm, then return when sleepy.
4. Limit caffeine late in the day and reduce screen time before bed.
5. Write down worries or tomorrow’s tasks to clear your mind.

Next step:
- Pick one change to try tonight, such as a consistent wake time or a short wind-down routine.`;
      case "anxiety":
      case "stress":
        return `Direct answer: Anxiety and stress are natural responses to pressure, but you can take steps to calm your body and focus on what you can control.

What can help:
1. Name what you’re feeling and what triggered it.
2. Slow your breathing (longer exhale) and try grounding (notice what you can see, feel, hear).
3. Separate facts from worries.
4. Break the situation into one small, doable action.
5. Reach out to someone you trust or a counselor if it feels heavy.

Next step:
- Ask: “What is one helpful thing I can do in the next 20 minutes?”`;
      case "panic":
        return `Direct answer: Panic can feel intense, but it usually peaks and passes. Focus on helping your body settle.

What can help now:
1. Breathe slowly: inhale gently, exhale longer.
2. Use grounding (5 things you see, 4 feel, 3 hear, 2 smell, 1 taste).
3. Remind yourself: “This feels uncomfortable, but it can pass.”
4. Move to a calmer space if possible.

Important:
- If symptoms feel new, severe, or you’re unsure if it’s a medical emergency (e.g. chest pain, fainting, trouble breathing), seek urgent medical care.`;
      case "low mood":
        return `Direct answer: When you feel low or unmotivated, small and gentle steps matter more than trying to fix everything at once.

What can help:
1. Start with one basic task (water, food, shower, short walk).
2. Do one small activity for care and one for progress.
3. Reach out to someone safe, even with a short message.
4. Be kind to yourself and notice harsh self-talk.
5. Seek support from a counselor/health professional if low mood lasts or affects daily life.

If you have thoughts of self-harm or not wanting to be here, please contact emergency services or use Help & Crisis immediately.`;
      case "relationships":
        return `Direct answer: Relationship problems are easier to handle when you focus on clear communication, respect, and safety.

What can help:
1. Identify what happened, how you felt, and what you need.
2. Choose a calm time to talk.
3. Use “I” statements: “When ___ happened, I felt ___, and I need ___.”
4. Listen and set boundaries when needed.

Important:
- If there is abuse, threats, or you feel unsafe, prioritize safety and seek trusted support/services.`;
      case "motivation":
        return `Direct answer: Motivation often comes after starting. Make the first step very small.

What can help:
1. Pick one task only.
2. Start with 2–10 minutes.
3. Remove distractions and prepare what you need.
4. Use short focus blocks and breaks.
5. Restart gently if you get stuck.

Next step:
- Do the smallest possible version of the task now.`;
      default:
        return `Direct answer: I can help you think this through. A good start is to clarify the main concern and choose one realistic next step.

What can help:
1. Identify the main issue right now.
2. Separate facts from worries or assumptions.
3. Focus on what you can control today.
4. Consider who or what can support you.
5. Choose one small action for the next 24 hours.

Next step:
- Tell me a bit more about your situation, and I can give more specific guidance.`;
    }
  })();

  if (ctx.language.code === "fil") {
    return `${q}Naiintindihan ko ang sitwasyon mo. Narito ang malinaw at praktikal na gabay:\n\n${base}\n\nKung gusto mo, puwede kong gawing mas maikli, mas detalyado, o step-by-step ang sagot na ito.`;
  }
  if (ctx.language.code === "ceb") {
    return `${q}Nasabtan nako ang imong sitwasyon. Ania ang klaro ug praktikal nga tambag:\n\n${base}\n\nKung gusto ka, mahimo nako kining himoong mas mubo, mas detalyado, o step-by-step.`;
  }
  return `${q}${base}`;
}

function buildCounselorContent(topic: string, ctx: ReplyContext): string {
  const q = ctx.question ? `Context provided: “${ctx.question}”\n\n` : "";
  switch (topic) {
    case "session planning":
      return `${q}Direct answer: Plan a flexible, student-centered session with clear priorities and safety awareness.

Key steps:
1. Briefly review prior notes, goals, risks, and follow-up tasks.
2. Open collaboratively: ask what feels most important today.
3. Screen for urgent concerns and adjust priorities if needed.
4. Choose 1–2 interventions matched to the student’s needs and capacity.
5. Close with a summary, agreed next steps, and follow-up plan.

Documentation: note concerns, interventions, response, risk considerations, and plan objectively.`;
    case "intake":
      return `${q}Direct answer: A good intake balances rapport, safety, and structured understanding.

Useful areas:
1. Presenting concern and goals.
2. Onset, course, and impact on daily functioning.
3. Strengths, supports, and coping strategies.
4. Risk/safety (self-harm, harm to others, abuse/unsafe situations) as appropriate.
5. Relevant history and expectations of support.
6. Confidentiality, consent, and next steps.

Use clear, empathic questions and follow institutional protocols.`;
    case "documentation":
      return `${q}Direct answer: Keep documentation clear, objective, and useful for continuity and safety.

Suggested structure (DAP/SOAP):
1. Data/Subjective & Objective: key reports, observations, relevant quotes.
2. Assessment: clinical impression linked to evidence (separate from speculation).
3. Plan: interventions, referrals, tasks, follow-up, and risk/safety actions.

Record only necessary information and follow privacy/documentation policies.`;
    default:
      return `${q}Direct answer: Clarify the concern, consider context and safety, and choose a proportionate next step.

Clinical thinking prompts:
1. What is the main concern and goal right now?
2. What relevant context, strengths, and risks are present?
3. Are there safety, ethical, or policy considerations?
4. What intervention or action best fits the student’s needs?
5. What follow-up, consultation, or documentation is needed?

Use your clinical judgment, supervision, and institutional protocols for case-specific decisions.`;
  }
}

function buildAdminContent(topic: string, ctx: ReplyContext): string {
  const q = ctx.question ? `Context provided: “${ctx.question}”\n\n` : "";
  switch (topic) {
    case "password management":
      return `${q}Direct answer: Handle password resets securely by verifying identity, using strong temporary credentials, and sharing them through a secure channel.

Checklist:
1. Verify the requester’s identity using approved procedures.
2. Confirm the correct account (name, email, ID, role).
3. Set/generate a strong temporary password (existing passwords cannot be viewed because they are hashed).
4. Share it securely and only with the intended user; avoid insecure channels.
5. Require/password-reset-on-next-login if policy supports it.
6. Review audit/activity logs if compromise is suspected.

Protect privacy and document actions according to policy.`;
    case "account management":
      return `${q}Direct answer: Manage accounts using least privilege, accurate identity data, and careful verification.

Checklist:
1. Confirm authorization and the correct user/account.
2. Assign the minimum necessary role and access.
3. Keep required profile details accurate (including student/counselor identifiers where applicable).
4. Apply status changes (active/inactive/etc.) according to policy.
5. Verify the outcome and review relevant audit logs.

Do not access or share private counseling records.`;
    case "audit & security":
      return `${q}Direct answer: Review audit logs to detect unusual activity, validate it, and respond according to policy.

How to review:
1. Filter by time, actor, action, and target.
2. Look for anomalies (repeated failures, unexpected role changes, off-hours sensitive actions).
3. Correlate with approved requests/tickets.
4. Contain and escalate suspicious activity per incident procedures.
5. Document findings while protecting sensitive data.`;
    case "reports & analytics":
      return `${q}Direct answer: Use reports to answer a specific question, validate data quality, and take safe, actionable follow-up steps.

Approach:
1. Define the metric, timeframe, and decision needed.
2. Check filters and data completeness/consistency.
3. Focus on trends and aggregates; avoid exposing sensitive individual information.
4. Turn insights into operational actions and review outcomes later.`;
    default:
      return `${q}Direct answer: Handle admin tasks systematically with verification, least privilege, and privacy in mind.

General steps:
1. Clarify the goal and confirm authorization/policy.
2. Identify the correct users/resources.
3. Make the minimum necessary change.
4. Verify the result.
5. Document and review logs when appropriate.

Share the specific task (without secrets or private counseling data) for more precise steps.`;
  }
}

function detectTopic(role: AssistantRole, text: string): string {
  const t = text;
  if (role === "admin") {
    if (/(password|reset|credential|temporary)/.test(t)) return "password management";
    if (/(account|user|student|counselor|role|status|permission|access|create|deactivate|activate)/.test(t)) return "account management";
    if (/(audit|log|security|suspicious|incident|unauthorized)/.test(t)) return "audit & security";
    if (/(report|analytics|metric|trend|dashboard|appointment|usage)/.test(t)) return "reports & analytics";
    return "admin guidance";
  }
  if (role === "counselor") {
    if (/(session plan|prepare|next session|agenda)/.test(t)) return "session planning";
    if (/(intake|assessment|presenting concern|history)/.test(t)) return "intake";
    if (/(document|documentation|soap|dap|note|chart)/.test(t)) return "documentation";
    if (/(risk|safety|suicid|self-harm|harm)/.test(t)) return "safety";
    return "counseling guidance";
  }
  if (/(panic|can't breathe|heart racing|panic attack)/.test(t)) return "panic";
  if (/(sleep|insomnia|can't sleep|cant sleep|tulog|makatulog|puyat)/.test(t)) return "sleep";
  if (/(exam|study|deadline|school|grades|assignment|thesis|aral|klase)/.test(t)) return "academic stress";
  if (/(anxious|anxiety|worry|overthink|kabado|kinakabahan|balisa)/.test(t)) return "anxiety";
  if (/(stress|overwhelmed|pressure|burnout|pagod|kapoy)/.test(t)) return "stress";
  if (/(sad|depress|low mood|hopeless|unmotivated|malungkot|lungkot)/.test(t)) return "low mood";
  if (/(friend|family|relationship|partner|breakup|conflict|away)/.test(t)) return "relationships";
  if (/(motivat|procrastinat|focus|distract)/.test(t)) return "motivation";
  return "general support";
}

function crisisReply(role: AssistantRole, lang: LangInfo): string {
  if (role === "counselor") {
    return `Treat this as a potential safety situation first.

Immediate priorities:
1. Assess risk directly and calmly (ideation, intent, plan, means, timeframe, past attempts, harm to others, abuse/unsafe situation).
2. Follow your institution’s emergency/risk protocol and do not leave imminent risk unmanaged.
3. Collaborate on immediate safety steps and involve appropriate supports per policy/consent.
4. Document clearly: what was asked/reported, risk formulation, actions taken, consultation, and follow-up.
5. Seek supervision/consultation promptly.

I can help you structure questions, a safety plan, or documentation in general terms, but I cannot replace direct assessment or emergency protocols.`;
  }
  if (role === "admin") {
    return `If anyone may be in immediate danger, treat this as an urgent safety matter.

Immediate steps:
1. Escalate now per your institution’s emergency protocol (emergency services/on-call clinical lead). Admins should facilitate escalation, not provide clinical assessment.
2. Share only the minimum necessary information with authorized responders.
3. Protect privacy: do not access or distribute private counseling records.
4. Verify identity before any account actions and document operational steps factually.

I can help with a safe operational checklist, but I cannot respond to emergencies.`;
  }
  const intro = lang.code === "fil"
    ? "Salamat sa pagsabi nito. Mukhang kailangan mo ng agarang tulong mula sa isang tao ngayon."
    : lang.code === "ceb"
      ? "Salamat sa pagsulti niini. Murag kinahanglan nimo og dali nga tabang gikan sa tawo karon."
      : "I’m really glad you told me. What you’re describing needs urgent, human support right now.";
  return `${intro}

What to do now:
1. If you may act on thoughts of harming yourself or someone else, contact your local emergency number, go to the nearest emergency department, or ask someone you trust to stay with you and help you get immediate care.
2. Try not to stay alone and move away from anything you could use to hurt yourself.
3. Reach a trusted person, counselor, or support service and clearly say you need help now.
4. Use **Help & Crisis** in Mindwell for crisis contacts and guidance.

I’m an AI assistant and I can’t provide emergency care in real time, but you deserve immediate help from a real person.`;
}

function followUpsFor(role: AssistantRole, topic: string, lang: LangInfo): string[] {
  if (role === "admin") return ["Give me a short checklist", "What should I verify first?", "How do I handle this securely?"];
  if (role === "counselor") return ["Can you give an example?", "What questions should I ask?", "Make this more detailed"];
  if (lang.code === "fil") return ["Puwede mo bang gawing mas simple?", "Puwede mo bang gawing step-by-step?", "Puwede mo bang gawing mas maikli?"];
  if (lang.code === "ceb") return ["Pwede nimo himoong mas simple?", "Pwede nimo himoong step-by-step?", "Pwede nimo himoong mas mubo?"];
  if (/sleep/.test(topic)) return ["Make this a simple nightly routine", "Give me a short answer", "Explain this step by step"];
  if (/anxiety|stress|panic|academic/.test(topic)) return ["What can I do in the next 10 minutes?", "Explain in simple words", "Give me a detailed plan"];
  return ["Make this shorter", "Explain in simple words", "Give me a detailed answer"];
}

export function getAssistantReply(
  role: AssistantRole,
  prompt: string,
  history: AssistantMessage[] = [],
  options: AssistantOptions = {}
): AssistantReply {
  const raw = (prompt || "").trim();
  const normal = normalise(raw);
  const lastUser = extractLastUser(history);
  const lastAssistant = extractLastAssistant(history);
  const instruction = parseInstruction(raw);
  const detected = detectLanguage(`${lastUser}\n${raw}`);
  const pref = options.preferredLanguage && options.preferredLanguage !== "auto" ? findLanguageByNameOrCode(options.preferredLanguage) : null;
  const lang = pref || detected;
  const baseMode: ResponseMode = options.mode || "standard";

  const ctx: ReplyContext = {
    role,
    raw,
    text: normal,
    question: shortenText(raw, 200),
    language: lang,
    mode: modeFromInstruction(instruction.action, baseMode),
    history,
    lastUserText: lastUser,
    lastAssistantText: lastAssistant,
    isFollowUp: FOLLOW_UP_PATTERN.test(normal) || (history.some((m) => m.role === "user") && normal.split(/\s+/).length <= 5),
    isQuestion: /[?]|^(what|how|why|when|where|who|can|could|should|would|is|are|do|does|paano|bakit|ano|sino|unsa|ngano|giunsa)\b/i.test(raw),
  };

  if (!normal) {
    const content = lang.code === "fil"
      ? "Puwede mong itanong ang kahit ano o ibahagi ang sitwasyon mo. Maaari rin kitang tulungan sa pagsasalin, pagpapasimple ng paliwanag, o pagbibigay ng maikli o detalyadong sagot."
      : lang.code === "ceb"
        ? "Pwede ka mangutana o magpaambit sa imong sitwasyon. Makatabang sab ko sa paghubad, pagpasimple sa pasabot, o paghatag og mubo o detalyado nga tubag."
        : "You can ask a question or share what’s on your mind. I can also translate, simplify explanations, or give short/standard/detailed answers.";
    return { topic: "empty", content, followUps: assistantPrompts[role].slice(0, 3), detectedLanguage: lang.code, mode: ctx.mode };
  }

  if (CRISIS_PATTERN.test(normal)) {
    return { topic: "safety", content: crisisReply(role, lang), followUps: followUpsFor(role, "safety", lang), detectedLanguage: lang.code, mode: ctx.mode };
  }

  // Control instructions that transform previous response
  if (instruction.isControl && lastAssistant) {
    if (instruction.action === "translate" || instruction.action === "translate_explain") {
      const target = instruction.targetLanguage || (lang.code !== "en" ? lang : { code: "en", name: "English" });
      const source = instruction.sourceText || lastAssistant;
      let content = translateSimple(source, target);
      if (instruction.action === "translate_explain") {
        content += `\n\nExplanation (simple):\n${makeShort(simplifyText(source))}`;
      }
      return { topic: "translation", content, followUps: ["Make it shorter", "Explain in simple words", "Translate to another language"], detectedLanguage: lang.code, mode: ctx.mode };
    }
    let transformed = lastAssistant;
    if (instruction.action === "both_short_long") transformed = withBothLengths(lastAssistant, ctx);
    else if (instruction.action === "shorter" || instruction.action === "summarize") transformed = makeShort(lastAssistant);
    else if (instruction.action === "detailed" || instruction.action === "longer") transformed = makeDetailed(lastAssistant, ctx);
    else if (instruction.action === "simplify") transformed = simplifyText(lastAssistant);
    else if (instruction.action === "beginner") transformed = toBeginner(lastAssistant);
    else if (instruction.action === "step_by_step") transformed = toStepByStep(lastAssistant, ctx);
    else if (instruction.action === "professional") transformed = toProfessional(lastAssistant);
    else if (instruction.action === "examples") transformed = makeDetailed(lastAssistant + "\n\nExample: Apply this by starting with one small, specific action in your situation today.", ctx);
    else if (instruction.action === "standard") transformed = lastAssistant;
    return { topic: "response adjustment", content: transformed, followUps: ["Make it shorter", "Explain in simple words", "Give another example"], detectedLanguage: lang.code, mode: ctx.mode };
  }

  // Standalone translation request
  if (instruction.isControl && (instruction.action === "translate" || instruction.action === "translate_explain")) {
    const target = instruction.targetLanguage || { code: "en", name: "English" };
    const source = instruction.sourceText || raw.replace(/^(please\s+)?translate.*?(into|to|in)\s+[a-zA-Z\u00C0-\u024f\s/()-]+[:\-]?\s*/i, "").trim() || lastUser || "";
    let content = source
      ? translateSimple(source, target)
      : `Please tell me: (1) the text you want to translate, and (2) the target language. Example: “Translate to Cebuano: I am doing my best even though things are difficult.”`;
    if (instruction.action === "translate_explain" && source) content += `\n\nExplanation (simple):\n${makeShort(simplifyText(source))}`;
    return { topic: "translation", content, followUps: ["Translate to Filipino", "Translate to English", "Explain in simple words"], detectedLanguage: lang.code, mode: ctx.mode };
  }

  if (INFO_PATTERN.test(normal)) {
    const info = role === "admin"
      ? `I’m the Mindwell AI Admin Assistant. I can help with accounts, roles, secure password handling, reports, audit review, and privacy/safety operations. I can also explain things in simple or detailed ways, summarize, and respond in your preferred language when possible. I don’t access private counseling records and I can’t replace your organization’s policies.`
      : role === "counselor"
        ? `I’m the Mindwell AI Counseling Assistant. I can help with session preparation, intake/documentation guidance, coping strategies, communication, and ethical/safety thinking. I can adjust answers to be short, standard, or detailed, explain simply, and respond in your preferred language when possible. I don’t replace clinical judgment, supervision, or direct assessment.`
        : `I’m the Mindwell AI Assistant. I can help you understand concerns, think through options, and find practical next steps for everyday wellbeing, studies, stress, sleep, relationships, and more. I can give short or detailed answers, explain in simple words, and respond in the language you use when possible. I don’t diagnose conditions or provide emergency care.`;
    return { topic: "about", content: applyMode(info, ctx, instruction.action), followUps: followUpsFor(role, "about", lang), detectedLanguage: lang.code, mode: ctx.mode };
  }

  if (GREETING_PATTERN.test(normal) && !ctx.isFollowUp) {
    const greet = lang.code === "fil"
      ? "Kumusta! Nandito ako para tumulong. Maaari kang magtanong, magbahagi ng sitwasyon, humingi ng maikli o detalyadong paliwanag, o magpa-translate. Ano ang maitutulong ko sa’yo ngayon?"
      : lang.code === "ceb"
        ? "Kumusta! Ania ko para motabang. Pwede ka mangutana, magpaambit sa imong sitwasyon, mangayo og mubo o detalyado nga pasabot, o magpahubad. Unsa may akong matabangan nimo karon?"
        : "Hello! I’m here to help. You can ask a question, share a situation, request a short or detailed explanation, or ask for a translation. What would you like help with today?";
    return { topic: "greeting", content: greet, followUps: assistantPrompts[role].slice(0, 3), detectedLanguage: lang.code, mode: ctx.mode };
  }

  if (THANKS_PATTERN.test(normal)) {
    const msg = lang.code === "fil"
      ? "Walang anuman! Kung gusto mo, maaari pa kitang tulungan — magtanong ka lang ulit o sabihin kung gusto mo itong mas maikli, mas detalyado, o isalin."
      : lang.code === "ceb"
        ? "Walay sapayan! Kung gusto pa ka, makatabang pa ko — pangutana lang balik o isulti kung gusto nimo kining mas mubo, mas detalyado, o hubaron."
        : "You’re welcome! If you’d like, I can keep helping — ask a follow-up, or tell me to make the answer shorter, more detailed, simpler, or translated.";
    return { topic: "acknowledgement", content: msg, followUps: followUpsFor(role, "general", lang), detectedLanguage: lang.code, mode: ctx.mode };
  }

  // Resolve effective query for follow-ups
  let effective = raw;
  if (ctx.isFollowUp && lastUser && !instruction.isControl) {
    effective = `${lastUser}\nFollow-up: ${raw}`;
  }
  const topic = detectTopic(role, normalise(effective));

  let content: string;
  if (role === "admin") content = buildAdminContent(topic, ctx);
  else if (role === "counselor") content = buildCounselorContent(topic, ctx);
  else content = buildStudentContent(topic, ctx);

  // Apply explicit instruction transforms on fresh content too (e.g. "explain stress in simple words")
  content = applyMode(content, ctx, instruction.action);

  if (instruction.action === "translate_explain" && instruction.targetLanguage) {
    content = wrapForLanguage(content, instruction.targetLanguage);
  }

  return {
    topic,
    content,
    followUps: followUpsFor(role, topic, lang),
    detectedLanguage: lang.code,
    mode: ctx.mode,
  };
}
