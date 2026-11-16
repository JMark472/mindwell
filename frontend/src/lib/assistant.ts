export type AssistantRole = "student" | "counselor" | "admin";

export interface AssistantReply {
  content: string;
  topic: string;
}

interface Topic {
  name: string;
  keywords: string[];
  reply: string;
}

const CRISIS_PATTERN =
  /(suicid|kill myself|end my life|don'?t want to (live|be here)|self.?harm|hurt myself|cut myself|no reason to live|better off dead|want to die|take my life|overdose|unsafe at home|someone is hurting me|being abused|abusive|assault|rape|can'?t go on|tired of living|no point in living|nothing to live for|hurt (someone|others)|kill (someone|others)|student (is )?at risk|client (is )?at risk|risk of harm|risk assessment|safety plan|harm to (self|others))/;

const INFO_PATTERN =
  /^(who are you|what are you|what can you do|what do you do|your name|how do you work|are you a real (ai|person)|are you human|what are your capabilities)\??$/;

const GREETING_PATTERN =
  /^(hi|hello|hey|good (morning|afternoon|evening))( there)?[!,.? ]*$/;
const THANKS_PATTERN =
  /^(thanks|thank you|thank u|ty|that helps|appreciate it)( so much| for the help| for your help)?[!,.? ]*$/;

export const assistantPrompts: Record<AssistantRole, string[]> = {
  student: [
    "I'm overwhelmed by exams",
    "Help me stop overthinking",
    "I can't sleep at night",
    "How do I deal with a friendship problem?",
    "I feel low and unmotivated",
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
    return `Hi${name} — I'm your Mindwell AI Counseling Assistant. I can help you prepare sessions, draft objective documentation, choose interventions, think through ethical dilemmas, and plan for student safety. I can give you a structured second perspective, but I can't replace clinical judgment, supervision, or your institution's protocols.\n\nWhat would you like to work through today?`;
  }
  if (role === "admin") {
    return `Hi${name} — I'm the Mindwell AI Admin Assistant. I can help with user and account management, password reset best practices, role and access checks, reports and analytics review, audit-log triage, content oversight, and privacy/safety operations. I provide guidance only — verify actions against your institution's policies, keep credentials confidential, and never access private counseling records.\n\nWhat would you like help with?`;
  }

  return `Hi${name} — I'm the Mindwell AI Assistant. I can help you think through stress, anxiety, sleep, relationships, motivation, grief, and everyday wellbeing questions with practical steps and reflection prompts. I can't diagnose or provide emergency care, but I can help you organize what you're facing and decide what to do next.\n\nWhat's on your mind today?`;
}

function normalise(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s'?.,!-]/gu, " ").replace(/\s+/g, " ").trim();
}

function shorten(value: string, limit = 140) {
  const text = value.trim().replace(/\s+/g, " ");
  return text.length > limit ? `${text.slice(0, limit).trim()}…` : text;
}

function infoReply(role: AssistantRole) {
  if (role === "counselor") {
    return `I'm a guided support assistant built into Mindwell. Practically, I can help you with:

1. Session preparation — goals, openings, questions, and a realistic agenda.
2. Clinical thinking — case conceptualization prompts, intervention ideas, and referral considerations.
3. Documentation — objective language, DAP/SOAP structure, and what to keep out of notes.
4. Ethical and safety decisions — confidentiality, boundaries, risk response, and when to escalate.
5. Professional sustainability — workload, boundaries, supervision, and burnout prevention.

I work from general counseling and wellbeing principles. I don't have access to the student's private records, I don't make diagnoses, and I can't replace supervision, consultation, or your institution's emergency protocol. If you share the situation in general terms, I can help you reason through it.

What would be most useful to start with?`;
  }

  return `I'm a guided wellbeing assistant built into Mindwell. I can help you with:

1. Understanding what you're feeling — stress, anxiety, low mood, anger, loneliness, grief, or relationship strain.
2. Practical coping — breathing, grounding, sleep routines, study plans, communication scripts, and small next steps.
3. Thinking through decisions — sorting facts from worries, identifying what you can control, and choosing one action.
4. Preparing for support — what to say to a counselor, friend, family member, or campus service.
5. Everyday wellness — routines, motivation, self-compassion, and recovering after a difficult week.

I'm not a therapist, I don't diagnose, and I can't provide emergency care. If you are in immediate danger, open Help & Crisis or contact local emergency services.

What would you like to work on?`;
}

function studentCrisisReply() {
  return `I'm really glad you told me. What you're describing needs urgent, human support — please don't try to carry it alone.

Do this now if you may be in danger
1. If you are in immediate danger or might act on thoughts of harming yourself, call your local emergency number (911 in the Philippines), go to the nearest emergency department, or ask someone to take you there.
2. Move away from anything you could use to hurt yourself, and stay with a trusted person. Being alone with these thoughts makes them harder to manage.
3. Open the Help & Crisis page in Mindwell for crisis contacts and step-by-step guidance.
4. Contact your counselor or campus health service and say plainly: "I am not safe and I need help today." You do not need to explain everything perfectly.
5. If someone is hurting you, contact emergency services or a trusted adult who can help you get somewhere safe.

You deserve immediate support, not a lecture or a diagnosis. A safety plan can help you get through the next few hours: who you will contact, where you will go, and what you will do if the urge gets stronger. I can help you draft what to say to a counselor or a trusted person.

I'm an AI assistant, so I can't keep you safe in real time or respond to an emergency. Please reach out to a person right now — you matter, and this is too much to handle alone.`;
}

function counselorCrisisReply() {
  return `Treat this as a potential safety situation first and a documentation task second.

Immediate clinical priorities
1. Ask directly and calmly about suicidal ideation, plan, intent, access to means, and past attempts. Direct questions do not increase risk; they create permission to talk.
2. Screen for self-harm, harm to others, abuse, recent losses, substance use, agitation, and command hallucinations if relevant.
3. Assess protective factors — reasons for living, supports, responsibilities, engagement, and willingness to accept help — while remembering they do not cancel out risk.
4. Reduce access to means where possible, and involve a trusted support person with the student's knowledge when safe and appropriate.
5. Do not leave a high-risk student alone. Follow your institution's emergency protocol, arrange same-day urgent review, or escalate to emergency services if imminent risk is present.
6. Document clearly: what you asked, what the student said, your risk formulation, actions taken, people contacted, safety plan, and follow-up time. Use quotes where possible.

A brief safety-plan structure
• Warning signs the student notices.
• Internal coping steps that have helped before.
• People and places that provide distraction and connection.
• People they can ask for help.
• Professionals and crisis services.
• Steps to make the environment safer.

Also seek consultation or supervision the same day. Working with acute risk alone increases the chance of missing something and takes a heavy toll on the clinician. If you want, describe the presentation in general terms and I can help you structure the risk formulation or a safety-plan conversation.`;
}

function studentPanicReply() {
  return `A panic attack can feel terrifying, but it is a surge of anxiety symptoms rather than a sign that you are dying or losing control. The goal is not to fight the feeling harder — it is to help your body and attention settle.

What to do in the moment
1. Slow your exhale. Breathe in through your nose for about 4 seconds, then out gently for 6–8 seconds. A longer exhale signals safety to your nervous system.
2. Ground with your senses using 5-4-3-2-1: name 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 you taste. Say them silently or out loud.
3. Remind yourself: "This is a panic surge. It will pass. I am safe enough to ride it out." Avoid checking your body repeatedly, which can keep the alarm going.
4. Change the scene if you can — step outside, splash cool water on your face, or walk slowly while naming objects around you.
5. Let the wave pass instead of trying to escape it. Panic usually peaks and then falls within minutes, even though it feels longer.

Afterwards
• Write down what happened before it started: caffeine, poor sleep, a stressful thought, a crowded place, or a physical sensation.
• Practice one calming skill daily when you are already calm, so it is easier to use under stress.
• Reduce avoidance where possible. Avoiding every place where panic happened teaches your brain that those places are dangerous.
• Cut back on caffeine and energy drinks, and protect sleep — both make panic more likely.

When to get more support
If panic attacks are frequent, you start avoiding school or friends, or you feel anxious about having another attack, talk with a counselor or health professional. Panic is treatable, and you do not have to wait until it is unmanageable.

Would you like a short grounding script you can keep on your phone?`;
}

function studentExamReply() {
  return `It sounds like academic pressure is taking up a lot of space right now. Feeling overwhelmed usually means the workload in your head is bigger than the plan in front of you — not that you are incapable.

What may be happening
Exams combine high stakes, uncertainty, and often several deadlines at once. That can trigger a stress response that makes it hard to start, which then creates more anxiety. You are not lazy for feeling stuck; your nervous system is responding to overload.

A practical plan for the next few days
1. Empty your head onto one page. List every exam, paper, and requirement, then mark only what is truly due in the next 72 hours. Put everything else on a "later" list so your brain stops rehearsing it.
2. Turn each task into a physical next action. "Study biology" is too big; "review pages 12–18 and write five recall questions" is doable.
3. Use short, active study blocks. Try 25–40 minutes of practice questions, recall, or teaching the idea aloud, then 5–10 minutes away from screens. Rereading feels productive but usually does less than testing yourself.
4. Protect sleep before exams. A rested brain remembers better than a sleep-deprived one. Aim for a consistent bedtime and stop caffeine after early afternoon.
5. Lower the stakes of each session. Give yourself permission to produce a B-minus version first, then improve it.
6. Use people. Ask a classmate to explain one topic, email your instructor about an extension if you genuinely need one, or visit your campus academic support center.

If anxiety is making it hard to eat, sleep, attend class, or function, that is a sign to talk with a counselor rather than push through alone. Support is not a last resort; it is a study strategy.

Tell me which subject or deadline is weighing on you most, and I can help you turn it into a realistic plan.`;
}

function studentSleepReply() {
  return `Sleep problems are common when your mind is busy, and they can quickly make everything else feel harder. The goal is to rebuild a clear association between bed and sleep — not to force yourself to switch off.

A wind-down plan that actually works
1. Keep your wake-up time consistent, even after a poor night. A stable wake time is often more powerful than an early bedtime.
2. Create a 30–60 minute wind-down: dim lights, stop intense work, and choose something low-stimulation such as reading, stretching, or quiet music.
3. Put screens away before bed where possible. If you use your phone, lower brightness and avoid stressful content, arguments, or doom-scrolling in bed.
4. Move caffeine earlier. Caffeine can stay in your system for hours; try to stop by early afternoon. Alcohol may make you drowsy but often fragments sleep later.
5. Use the bed for sleep and rest, not studying or scrolling. If you are awake for roughly 20 minutes and becoming frustrated, get up, sit somewhere dim, and do something boring until you feel sleepy again.
6. Do a "worry dump" before bed. Write tomorrow's tasks and any repeating thought on paper so your brain does not have to keep rehearsing them.
7. Do not chase sleep. Watching the clock and calculating how many hours are left increases arousal. Turn the clock away and focus on resting.

If your mind races at night, a short body scan or slow breathing can help, but the bigger fix is usually a consistent routine and less pressure to fall asleep immediately.

Consider professional support if sleep problems last more than a few weeks, affect your functioning, or come with low mood, panic, or loud snoring and breathing pauses. Would you like a simple evening routine you can adapt?`;
}

function studentAnxietyReply() {
  return `Anxiety is your body's threat system turning on. It is trying to protect you, but it can become overactive and make ordinary situations feel dangerous. The aim is not to eliminate anxiety — it is to respond to it in a way that teaches your brain you can cope.

What can help
1. Name what is happening. "I'm having a wave of anxiety about my deadline" is more manageable than a vague sense that everything is wrong.
2. Slow the exhale. Try breathing in for 4 seconds and out for 6–8 seconds for a few minutes. Do not force it; gentle is better.
3. Ground your attention. Use 5-4-3-2-1 senses, press your feet into the floor, or hold something cold. This pulls attention out of the future and into the present.
4. Separate worry from fact. Ask: What do I know? What am I predicting? What is one thing I can control today? Write the answers down instead of arguing with yourself in your head.
5. Reduce avoidance in small steps. Avoiding everything that feels anxious brings relief now but grows the fear later. Choose one small, manageable exposure rather than a giant leap.
6. Schedule a worry window. Give yourself 15 minutes at a set time to write worries and possible next steps, then postpone rumination until that window.
7. Check the basics. Caffeine, poor sleep, skipped meals, and hours of scrolling all amplify anxiety. Sometimes the most useful intervention is a meal, water, a walk, and an earlier night.

A thought to hold onto
Anxiety is uncomfortable, but it is not a prediction of failure. You can feel anxious and still do the thing. The goal is to widen your life, not wait until you feel completely calm.

If anxiety is frequent, intense, or narrowing your daily life, a counselor can help you build a more tailored plan. Would you like help with a specific anxious situation, or with overthinking at night?`;
}

function studentLowMoodReply() {
  return `I'm sorry you're feeling this way. Low mood can make everything feel heavier, and it can make the things that would help feel almost impossible. That is part of the pattern, not evidence that you are failing.

A gentle plan
1. Start smaller than feels impressive. Pick one tiny action: open the window, drink water, shower, step outside for five minutes, or message one person. Action first, motivation second.
2. Use behavioral activation. Choose one activity that gives a sense of mastery and one that gives a sense of pleasure or connection. Keep the bar low and repeat it rather than waiting for a perfect day.
3. Stay connected to at least one safe person. You do not need to explain everything. "I've been having a rough week — can we sit together or talk for a bit?" is enough.
4. Be honest but not cruel with yourself. Notice the thought "I'm worthless" and respond as you would to a friend: "I'm struggling right now, and struggling does not make me worthless."
5. Protect the basics. Regular meals, water, daylight, movement, and a consistent sleep and wake time are not cures, but they are foundations.
6. Reduce the load where you can. Ask for an extension, reschedule one commitment, or let something be good enough for now.

When to seek more support
If low mood lasts more than two weeks, affects sleep, appetite, concentration, attendance, or relationships, or you feel hopeless most days, please talk with a counselor or health professional. If you have thoughts of harming yourself or not wanting to be here, treat that as urgent and open Help & Crisis or contact local emergency services now. You do not have to wait until things get worse to ask for help.

Would you like help drafting a small plan for today, or thinking through what to say to a counselor?`;
}

function studentRelationshipsReply() {
  return `Relationship strain can take over your head because humans are wired for connection. It makes sense that this is affecting you, even if the other person seems fine on the outside.

A way to work through it
1. Get clear on the need underneath the hurt. Are you needing reassurance, respect, honesty, space, or a change in how decisions are made? Name that before choosing what to say.
2. Separate the event from the story. What actually happened, and what are you assuming about what it means? Both matter, but they are not the same.
3. Choose a calm time, not the middle of a fight or a late-night message thread. Ask: "Can we talk for a few minutes when you're free?"
4. Use a simple, direct structure: "When ___ happened, I felt ___. What I need is ___." Avoid "you always" and "you never"; they invite defensiveness.
5. Listen for their side without immediately solving or defending. Reflect back what you heard before responding.
6. Set a boundary if the same pattern keeps hurting you. A boundary is not punishment; it is information about what you can participate in.
7. Give the conversation time. Repair usually happens over several smaller interactions, not one perfect talk.

If the relationship involves pressure, control, threats, or physical or sexual harm, safety comes first. Talk with a trusted adult, counselor, or emergency service rather than trying to manage it alone.

What would help most right now: deciding what to say, processing the hurt, or figuring out whether to set a boundary?`;
}

function studentLonelinessReply() {
  return `Loneliness is painful, and it can create a loop: the more disconnected you feel, the harder it becomes to reach out. You are not unlikeable for feeling this way — you are human and in need of connection.

Small steps that lower the barrier
1. Start with low-pressure contact. A message to one person, a comment in a group chat, or sitting near others in a shared space counts.
2. Use a simple opener instead of waiting for the perfect thing to say: "Hey, I've been quiet lately but I'd like to catch up. Are you free for a short walk or coffee?"
3. Join one structured activity where conversation is optional — a study group, club, volunteer shift, workout class, or workshop. Shared activity gives connection somewhere to happen.
4. Schedule connection rather than relying on mood. Put one social contact on your calendar this week, even if it is brief.
5. Protect against comparison. Social media shows other people's highlight reels, not their lonely Tuesday nights. Reduce scrolling when it leaves you feeling worse.
6. Be honest with someone safe. "I've been feeling isolated" can feel risky, but it gives people a chance to respond.
7. Build a relationship with yourself too — not as a replacement for others, but as a base. Rest, interests, and self-respect make reaching out less desperate.

If loneliness comes with hopelessness, panic, or a sense that you do not matter, please talk to a counselor. Isolation can make dark thoughts louder, and support can interrupt that cycle.

Would you like help drafting a message to someone, or thinking about where to meet people in your context?`;
}

function studentAngerReply() {
  return `Anger is a signal that something matters to you — a boundary was crossed, an unfairness happened, or you feel powerless. The feeling is valid; what you do with it is where choice comes in.

In the heat of the moment
1. Pause before responding. Put the phone down, step away, or say, "I need a minute before I answer." A short delay prevents a lot of repair work.
2. Cool your body first. Walk, shake out your hands, splash water on your face, or breathe out slowly for a few minutes. Reasoning is harder when arousal is high.
3. Move the energy somewhere safe — exercise, cleaning, writing the angry message without sending it.

Afterwards
4. Identify the need under the anger: respect, fairness, safety, recognition, or space. Then decide what action actually serves that need.
5. Use a direct but non-attacking script: "When ___ happened, I felt ___ because ___. I need ___." Keep it specific and about behavior, not character.
6. Repair quickly if you snapped. "I handled that badly. I'm sorry. Here's what I meant" is stronger than pretending it did not happen.
7. Notice patterns. If the same situations keep triggering you, a counselor can help you trace the trigger and practice responses.

If anger is leading to threats, intimidation, breaking things, or hurting someone, that is a sign to get professional support now. It is possible to learn safer ways to handle intensity, but it is not fair to ask the people around you to absorb harm in the meantime.

Do you want help with a specific situation, or with cooling down in the moment?`;
}

function studentSelfEsteemReply() {
  return `Confidence is not a personality trait you either have or lack. It is built through repeated evidence that you can cope, learn, and be okay even when you are imperfect. Right now, the critical voice is probably making that evidence hard to see.

What helps
1. Separate behavior from identity. "I did poorly on this task" is not "I am a failure." Failing at something is information, not a verdict on your worth.
2. Keep an evidence log. Each day, write one small thing you handled, tried, or got through — especially on days when it felt hard. Confidence grows from remembered evidence.
3. Practice self-compassion in plain language. Ask: "What would I say to a friend in this exact situation?" Then try saying it to yourself without sarcasm.
4. Take small, real risks. Choose one situation where you can practice speaking up, trying something imperfect, or asking for what you need. Start where the chance of success is reasonable.
5. Reduce comparison. Pick one or two people whose lives you compare yourself to and notice how that affects you. Curate your feed and your time around people who make you feel more like yourself.
6. Clarify your values. Ask what kind of person you want to be, not just what you want to achieve. Values give you a steadier standard than applause.
7. Seek feedback from people who are both honest and kind. Growth needs truth, but it does not need humiliation.

If the critical voice is constant, tied to body image, food, or self-harm, or leaves you feeling worthless, please talk with a counselor. You deserve support that goes beyond trying harder to like yourself.

What situation is making you doubt yourself most right now?`;
}

function studentMotivationReply() {
  return `Motivation is unreliable as a starting strategy. Most sustainable progress comes from making the next action small, clear, and hard to avoid — then letting momentum catch up.

A realistic reset
1. Pick one task, not the whole backlog. Write it as a concrete next action: "open the document and write three ugly sentences" is better than "finish the paper."
2. Use a two-minute start. Commit only to opening the file, gathering materials, or doing the first tiny step. You can stop after two minutes if you still want to.
3. Remove one source of friction. Put your phone in another room, close extra tabs, or set out what you need the night before.
4. Use short blocks. Try 25 minutes of work and 5 minutes off, or 40/10 if that suits you. During the break, move your body rather than scrolling.
5. Connect the task to a reason. Ask: Why does this matter to me, or to someone I care about? Meaning is a stronger long-term fuel than guilt.
6. Forgive the last lapse. Beating yourself up uses the same energy you need to start again. "I fell off; I'm restarting small" is more useful than a character trial.
7. Put a review on the calendar. At the end of the day, note what worked and choose the next smallest step. Do not wait to feel motivated before reviewing.

If you have been unable to function for weeks, feel numb or hopeless, or are struggling with basic self-care, this may be more than procrastination. In that case, talk with a counselor or health professional rather than trying to force productivity.

What is the one task you keep avoiding? I can help you shrink it into a first step.`;
}

function studentGriefReply() {
  return `I'm sorry for your loss. Grief is not a tidy process, and there is no correct timeline. It can come in waves — numb one moment, functional the next, then unexpectedly heavy again. That is not regression.

What may help
1. Lower expectations for a while. Grief uses attention and energy. Do the essentials and let nonessential things wait where possible.
2. Let the feeling be there in small doses. You do not have to process everything at once. A few minutes of writing, crying, praying, or remembering can be enough for one day.
3. Keep one point of connection. A person, pet, community, or routine that anchors you can make the day feel less formless.
4. Create a small ritual if it fits. A photo, a letter, a song, a walk, or a memory shared with someone who knew them can give grief somewhere to go.
5. Be gentle with "should." You may not feel the way others expect, or you may feel fine and then guilty for feeling fine. Both are common.
6. Ask for practical help. People often want to help but do not know how. "Can you bring dinner Thursday?" or "Can you sit with me for an hour?" is a legitimate request.

Consider professional support if grief is making it hard to care for yourself, lasts a long time without any movement, comes with hopelessness or thoughts of not wanting to be here, or you feel stuck in intense guilt. Support is not a sign that you are grieving wrong.

Would you like to tell me about the person, or would it help to think about one small way to get through today?`;
}

function studentStressReply() {
  return `Stress is a normal response to too many demands with too few resources. It becomes a problem when your body stays switched on and you start running on urgency, caffeine, or guilt. The goal is not to eliminate pressure — it is to reduce the load and give your nervous system moments of recovery.

A practical reset
1. Name the load on paper. List what is taking energy: deadlines, family expectations, money, relationship strain, lack of sleep. You cannot manage a fog, only a list.
2. Separate urgent from important. Choose the one or two things that truly need attention in the next 24 hours. Put everything else on a later list with a date so it stops circling in your head.
3. Lower the bar for today. Ask: what is the smallest version of this task that still counts? A messy draft, a ten-minute walk, or one honest message is better than waiting for a perfect performance.
4. Give your body a reset. A slow exhale, a short walk, stretching, water, or stepping outside for five minutes can lower arousal enough to think again.
5. Set one boundary. Say no, delay, or ask for help with one thing this week. Boundaries are not selfish; they are how you keep showing up without collapsing.
6. Use people. Tell one trusted person what is happening, even briefly. Shared stress is easier to carry than hidden stress.
7. Protect sleep and food. Stress makes both easy to neglect, and neglecting them makes stress worse. Treat them as part of the work, not a reward.

If stress is constant, affecting your health, sleep, attendance, or relationships, or you are using alcohol or other substances to cope, talk with a counselor. You do not need to wait for a breakdown to deserve support.

What is the biggest source of pressure for you right now? I can help you break it into a realistic next step.`;
}

function studentSupportReply() {
  return `Talking to a counselor can feel like a big step, especially if you are used to handling things alone. You do not need to be in crisis, have the right words, or know what you want from it. Wanting support is enough.

What counseling can look like
1. A first session is usually about understanding what is happening, what you want to change, and whether the counselor is a good fit. You can ask questions too.
2. You do not have to tell everything at once. It is okay to say, \"I'm not ready to talk about that yet.\" A good counselor will respect that.
3. Counseling is collaborative. You can say what is helping, what is not, and what you need. You are allowed to disagree.
4. Confidentiality has limits. Counselors generally explain when they may need to share information to keep you or someone else safe, or when required by law. Ask them to explain this clearly.

How to prepare
• Write down two or three things you want help with.
• Note what makes things better or worse, and how often the problem happens.
• Decide what you want to ask: cost, frequency, confidentiality, notes, or how to reach them in an emergency.
• If talking feels too hard, you can write it down or send a message first.

If the first counselor is not a good fit, that does not mean counseling cannot work. You can ask about a different approach or a different person. Finding the right support is allowed to take more than one try.

Would you like help drafting what to say in a first session, or thinking through how to ask for support from someone you trust?`;
}

function studentFinancialReply() {
  return `Financial stress is real stress. It affects sleep, concentration, relationships, and your sense of safety, and it is not a personal failing to need help with it.

A grounded next step
1. Get the numbers out of your head. Write down what is coming in, what is going out, and what is due in the next two weeks. Vagueness makes money worry feel bigger than it is.
2. Separate urgent from important. Prioritize food, shelter, transport, medicine, and academic requirements that cannot wait. Contact the people or offices involved before a deadline passes.
3. Ask about options early. Schools often have emergency funds, payment plans, scholarships, counseling support, or student affairs staff who can point you to resources. You usually have more options before a due date than after it.
4. Tell one safe person. Shame keeps financial stress invisible. A trusted friend, family member, adviser, or counselor can help you think and may know resources you do not.
5. Make one small plan for this week. A budget does not have to be perfect; it needs to be usable. Even tracking three categories can reduce the fog.
6. Protect the basics first. Do not skip meals or medication to solve a short-term money problem without talking to someone who can help.

If financial stress is affecting your safety, housing, or ability to stay in school, contact student affairs or a counselor now. You do not have to wait until the situation is a crisis.

Would you like help breaking down a specific money worry, or thinking about who to contact first?`;
}

function studentFallbackReply(prompt: string) {
  const question = shorten(prompt);

  return `Thanks for bringing that here. I want to make sure I answer the question you're actually asking: "${question}"

A useful way to work through it
1. Name the specific concern. What exactly are you trying to decide, understand, or change? Write it as one sentence rather than a cloud of worry.
2. Separate facts from assumptions. What do you know for certain? What are you predicting or imagining? What would you need to find out?
3. Identify your circle of control. List what you can influence, what you can only prepare for, and what is outside your hands. Then choose one action from the first circle.
4. Check the load. Are you trying to solve this alone, at 2 a.m., while hungry or exhausted? Those conditions make everything feel less solvable.
5. Pick one small next step you can take in the next 24 hours — a message, a question, a boundary, a plan, or a request for help.
6. Put a check-in on your calendar. Decide when you will review how it went instead of carrying it continuously.
7. Use support. A friend, counselor, adviser, or family member can often see options you cannot see from inside the stress.

If this is about a decision, tell me the options and what matters most to you, and I can help you compare them. If it is about a feeling, tell me when it started and what makes it better or worse, and we can narrow it down.

If this ever becomes a safety concern, open Help & Crisis or contact local emergency services. Would you like to give me a little more context so I can be more specific?`;
}

function counselorSessionPrepReply() {
  return `A good session plan is a flexible map, not a script. Start with what the student needs today, then choose one or two meaningful threads to follow.

A practical preparation structure
1. Review the last note before the session. Note the presenting concern, what changed, any agreed tasks, risk information, and one open question you want to return to.
2. Set a small number of goals: one relational goal (engagement, safety, repair), one clinical goal (understanding, coping, behavior change), and one practical goal (plan, referral, follow-up).
3. Plan an opening that gives the student room: "How have things been since we last met?" or "What feels most important to use our time for today?"
4. Use a brief check-in, then move toward the agenda collaboratively. Avoid spending the whole session on intake details if the student needs to be heard first.
5. Keep a risk screen ready if there were any safety concerns, and know your referral and emergency steps before the session.
6. Choose interventions that fit the student, not just the diagnosis: grounding for arousal, behavioral activation for withdrawal, thought records for repetitive worry, communication practice for relational conflict.
7. Leave time to close: summarize what you heard, name the next step, check agreement, and set the next contact. A rushed ending can undo good work.
8. After the session, write a short note while it is fresh — themes, interventions, response, risk, plan.

For teletherapy, confirm privacy, location, emergency contact, and connection quality at the start. For a first session, prioritize rapport, consent, the student's goals, and enough history to be safe over completing a comprehensive assessment.

If you share the student's general presentation and what happened last time, I can help you draft an agenda and opening questions.`;
}

function counselorIntakeReply() {
  return `A good intake balances warmth with enough structure to understand the student and plan safely. Ask open questions, follow the student's words, and do not rush to fill silence.

Core intake areas and example questions
1. Presenting concern: "What brings you in now?" "What has been happening that made you decide to talk with someone?"
2. Onset and course: "When did this start?" "Has it changed since then?" "What was going on in your life around that time?"
3. Severity and functioning: "How much is this affecting your sleep, appetite, studies, relationships, or daily routine?" "What can you still do, and what has become harder?"
4. Meaning and context: "What do you think is contributing?" "What have you already tried?" "What has helped, even a little?"
5. Risk and safety: ask directly about self-harm, suicidal thoughts, harm to others, abuse, unsafe living situations, and access to means. Explain why you are asking.
6. History: previous counseling or treatment, significant losses, trauma, family mental-health history if relevant, medical conditions, medication, and substance use.
7. Supports and strengths: "Who knows about this?" "Who helps you feel safe?" "What has gotten you through difficult times before?"
8. Identity and culture: values, faith, family expectations, language, discrimination, and how the student understands the problem.
9. Goals and expectations: "What would be different if counseling helped?" "What do you want from me?"
10. Consent and boundaries: confidentiality and its limits, session structure, contact between sessions, documentation, and emergency procedures.

Avoid turning the intake into an interrogation. Signpost transitions ("I'd like to ask a few safety questions now"), validate what you hear, and leave space for the student to ask questions. End with a brief formulation, a proposed focus, and one concrete next step.

If you tell me the setting and the student's main concern, I can tailor a shorter intake guide.`;
}

function counselorDocumentationReply() {
  return `Documentation should be brief, factual, and useful to the next clinician — not a transcript and not a defense brief. Write what happened, what you did, how the student responded, and what happens next.

A DAP structure
• Data: relevant quotes, observations, presenting concerns, changes since last session, and risk-relevant information.
• Assessment: your clinical impression and formulation, stated without overclaiming. Link it to the evidence in the session rather than using labels alone.
• Plan: interventions, agreed tasks, referrals, safety steps, and follow-up.

A SOAP structure
• Subjective: the student's report and exact language where important.
• Objective: observable behavior, mental status, and interventions used.
• Assessment: clinical reasoning and progress toward goals.
• Plan: next steps and responsibilities.

Practical rules
1. Record the minimum necessary information for continuity and safety. Do not paste unrelated sensitive details.
2. Use objective language: "Student reported," "Student appeared tearful," "Student denied current suicidal ideation." Avoid "student was manipulative" or "student is attention-seeking."
3. Document risk conversations specifically: questions asked, answers given, plan and intent, protective factors, consultation, actions taken, and follow-up.
4. Distinguish observation from inference. If you are unsure, say so.
5. Record consent, confidentiality limits, and any coordination with other services.
6. Correct errors transparently according to policy; never alter a note to make an outcome look better.
7. Keep notes within the institution's retention, access, and encryption rules. Do not store clinical details in personal notes or unapproved apps.

If you share the general arc of the session, I can help you outline a note in DAP or SOAP format.`;
}

function counselorRapportReply() {
  return `Engagement is not something you do once at the start; it is built and repaired throughout the work. When a student seems guarded, slow down and make the relationship safer before pushing for content.

What helps
1. Validate before exploring. "That sounds exhausting, and it makes sense you'd be unsure about counseling" can lower defensiveness faster than a good question.
2. Explain the process. Tell the student what you are doing and why: "I'd like to understand what's been happening, and then we can decide together what might help."
3. Use the student's language. If they say "I'm stuck," explore stuck rather than immediately replacing it with a clinical term.
4. Offer choices. "Would you rather start with what happened this week, or with what you noticed in your body?" Autonomy increases engagement.
5. Use motivational interviewing: open questions, affirmations, reflections, and summaries. Reflect ambivalence rather than arguing for change.
6. Notice ruptures. If the student seems withdrawn, annoyed, or misunderstood, name it gently: "I wonder if something I said didn't land well."
7. Avoid over-reassuring. "It'll be fine" can shut down the conversation. Acknowledge the difficulty and stay present.
8. Pace the session. Silence, a slower voice, and shorter questions can be more engaging than filling every gap.

For a student who is reluctant, focus first on what counseling can offer that is relevant to them, and keep the first goal small. For a student who is highly activated, regulate before exploring content. For a student who people-pleases, explicitly invite disagreement.

If you describe what the student is doing in sessions, I can help you think about the engagement pattern and possible responses.`;
}

function counselorEthicsReply() {
  return `Ethical decisions are usually clearer when you slow the situation down and separate the clinical question from the policy question.

A practical decision framework
1. Identify the core dilemma in one sentence. Is this about confidentiality, boundaries, consent, competence, documentation, multiple relationships, or safety?
2. Check the facts. What was said or done, by whom, when, and what do you actually know versus assume?
3. Review the relevant code and institutional policy. Informed consent, confidentiality limits, mandatory reporting, and record access are usually defined for you.
4. Consider the student's welfare and autonomy. What would protect them without unnecessarily removing their choices?
5. Consult early. Supervision or a trusted colleague is not a sign of incompetence; it is a standard safeguard.
6. Consider power and culture. A boundary that seems small to you may carry more weight for a student, especially around gifts, self-disclosure, touch, social media, or dual roles.
7. Document your reasoning, consultation, and decisions, not just the outcome.
8. If the issue is urgent safety or abuse, follow your emergency and reporting obligations immediately rather than waiting for the next supervision session.

Common boundaries to protect
• Avoid personal social-media contact and unnecessary self-disclosure.
• Do not provide services to friends, family, or people with whom you have another significant relationship.
• Keep gifts and favors within policy.
• Be clear about contact between sessions and response times.
• Do not discuss students in public or unapproved channels.
• Seek consultation before acting on a dual relationship or any exception to policy.

Tell me the general situation and what decision you are weighing, and I can help you map the ethical questions and who to consult.`;
}

function counselorCopingReply() {
  return `Match the strategy to the student's state and goal. A grounding exercise will not help a student who needs behavioral activation, and a thought record will not land while someone is flooded.

By presentation
1. High arousal or panic: slow breathing with a long exhale, 5-4-3-2-1 grounding, cold water, brief movement, and a clear "this will pass" message.
2. Withdrawal and low mood: behavioral activation. Choose one small mastery activity and one connection or pleasure activity; schedule it rather than waiting for motivation.
3. Repetitive worry: worry postponement, thought records, distinguishing productive from unproductive worry, and values-based action.
4. Sleep disruption: consistent wake time, wind-down routine, stimulus control, and a worry dump before bed.
5. Relationship conflict: communication scripts, boundary setting, perspective-taking, and repair attempts.
6. Avoidance: graded exposure, starting with a manageable step and staying until anxiety reduces rather than escaping immediately.
7. Low self-esteem: evidence logs, self-compassion practice, values clarification, and small behavioral risks.
8. Grief: validation, pacing, rituals, support, and permission to feel without a timeline.
9. Suicidal ideation: safety planning, means restriction, supports, emergency contacts, and same-day escalation when needed.

Before suggesting a strategy
• Ask what the student has already tried and what fits their culture, energy, and context.
• Explain the rationale briefly so it feels collaborative rather than prescribed.
• Choose one skill, practice it in session if possible, and anticipate barriers.
• Agree on a specific time and way to use it, and review it next session.

Do not oversell coping skills or imply that the student is failing if they do not work. Skills are tools, not tests of character.

If you tell me the student's presentation and the goal, I can suggest a short sequence of interventions.`;
}

function counselorBurnoutReply() {
  return `Burnout is not a personal weakness, and it is not solved by trying to care less. It is a signal that demands have outpaced resources for too long.

Signs worth taking seriously
• Emotional exhaustion before the week starts, cynicism or detachment toward students, reduced empathy, irritability, sleep disruption, and a sense that nothing you do matters.
• Working through breaks, carrying cases home, dreading sessions, or feeling guilty whenever you are not productive.
• Physical symptoms such as headaches, tension, stomach problems, or frequent illness.

A sustainable plan
1. Audit the load. Track your actual hours for one week, including documentation and messages. Identify what can be delegated, postponed, or handled differently.
2. Protect transitions. Build five minutes between sessions to breathe, stand, hydrate, and reset rather than moving straight from one intense conversation to the next.
3. Set contact boundaries. Be clear about response times, after-hours contact, and what is appropriate for your role. Boundaries protect the work, not just you.
4. Use supervision and peer consultation. Do not carry complex or high-risk cases in isolation.
5. Take breaks that actually restore you. A break spent answering messages is not a break. Choose something that does not require performance.
6. Address moral distress. If the problem is workload, staffing, or policies that prevent good care, naming it with colleagues or leadership matters more than another self-care workshop.
7. Get professional support for yourself. Therapy is not only for crisis; it is a reasonable resource for clinicians.
8. Reconnect with why you chose this work, but do not use meaning to override exhaustion.

If burnout is affecting your health, judgment, or ability to provide safe care, reduce your load and seek support now. A clinician who is depleted cannot be a reliable resource for students.

Would you like help thinking through a boundary, a workload conversation, or a recovery plan?`;
}

function counselorTerminationReply() {
  return `Ending well is part of the intervention. A planned ending can consolidate progress and prevent the student from experiencing it as abandonment or failure.

How to structure it
1. Name the ending early. Give enough notice to process it and plan, rather than announcing it in the final minutes.
2. Review progress together. Ask what has changed, what the student did to make that change, and what they want to keep.
3. Consolidate skills. Identify the tools that worked, when to use them, and what early warning signs suggest a need to return.
4. Create a relapse-prevention plan. Include supports, coping steps, crisis contacts, and how to re-enter services.
5. Discuss feelings about ending. Relief, sadness, anger, and indifference are all possible. Make room for them.
6. Clarify the door. Explain how the student can return, what the process is, and what to do in an emergency.
7. Arrange referrals if ongoing support is needed, and do a warm handoff where possible.
8. Document the ending, progress, remaining concerns, safety plan, and referrals.

If the ending is unplanned due to placement change, leave, or service limits, be honest about what you can and cannot control. Avoid promising continued contact that the institution cannot support. Provide a clear transition plan and confirm the student understands it.

If you tell me why the work is ending and what progress has been made, I can help you outline a closing session.`;
}

function counselorReferralReply() {
  return `Referral is a clinical intervention, not a handoff to get rid of a difficult case. The goal is a safe, collaborative transition that the student understands and can follow through with.

When to consider referral
• Needs exceed your scope, competence, or available level of care.
• Risk requires same-day or emergency assessment.
• Specialist support is indicated, such as psychiatry, substance-use treatment, medical evaluation, or specialized trauma care.
• The therapeutic relationship has ruptured beyond repair, or a dual relationship makes impartial care difficult.
• The student needs practical resources you cannot provide, such as financial or housing support.

How to do it well
1. Discuss the reason transparently and without blame. "I want you to have a type of support I can't provide here" is clearer than vague reassurance.
2. Involve the student in choosing the option where possible. Explain what the service does, what to expect, and how to contact it.
3. Make the referral concrete: name, address or link, phone number, hours, cost, and what to bring.
4. Do a warm handoff when possible, with consent. A short call or shared summary reduces the chance of the student falling through the gap.
5. Clarify who remains responsible for what during the transition, including risk and medication.
6. Follow up. Ask whether contact happened and troubleshoot barriers.
7. Document the concern, discussion, options given, consent, referral details, and follow-up plan.
8. If risk is imminent, do not rely on a routine referral. Follow your emergency protocol now.

If you describe the situation and the options available, I can help you draft how to raise the referral with the student.`;
}

function counselorFallbackReply(prompt: string) {
  const question = shorten(prompt);

  return `Here's a structured way to think about your question: "${question}"

Case conceptualization lens
1. What is the presenting problem, and what is the student's own explanation for it?
2. What predisposing, precipitating, perpetuating, and protective factors are relevant? Keep this provisional rather than reifying a diagnosis.
3. What function might the behavior serve? Avoidance, control, connection, safety, or communication are often more useful starting points than "resistance."
4. What is the student's context — culture, family, finances, discrimination, academic pressure, and access to care?
5. What are the ethical and safety considerations before choosing an intervention?

Clinical next steps
• Clarify what you already know and what is inference.
• Identify one target that matters to the student, not just to the file.
• Choose a matching intervention and explain its rationale.
• Agree on a specific next step and a way to review it.
• Consult or supervise if the case is complex, high-risk, or outside your competence.

Documentation and boundaries
• Record only what is necessary for continuity and safety.
• Keep clinical reasoning separate from speculation about character.
• Be explicit about confidentiality, contact between sessions, and limits of your role.

If you give me more context — the setting, the student's presentation, and what you are trying to decide — I can make this more concrete. I can support your thinking, but I cannot replace supervision, institutional policy, or direct clinical assessment.`;
}

const studentTopics: Topic[] = [
  {
    name: "academic stress",
    keywords: [
      "exam",
      "exams",
      "test",
      "tests",
      "study",
      "studying",
      "thesis",
      "deadline",
      "deadlines",
      "academic",
      "grades",
      "schoolwork",
      "requirements",
      "project",
      "defense",
    ],
    reply: studentExamReply(),
  },
  {
    name: "panic",
    keywords: ["panic attack", "panic", "heart racing", "can't breathe", "cant breathe", "shaking", "terrified"],
    reply: studentPanicReply(),
  },
  {
    name: "sleep",
    keywords: ["sleep", "insomnia", "bedtime", "bed", "awake at night", "can't sleep", "cant sleep", "night", "tired"],
    reply: studentSleepReply(),
  },
  {
    name: "anxiety",
    keywords: ["anxiety", "anxious", "worry", "worried", "overthinking", "overthink", "nervous", "racing thoughts", "restless"],
    reply: studentAnxietyReply(),
  },
  {
    name: "low mood",
    keywords: ["depressed", "depression", "low mood", "sad", "empty", "numb", "hopeless", "unmotivated", "no energy", "crying"],
    reply: studentLowMoodReply(),
  },
  {
    name: "relationships",
    keywords: ["relationship", "friend", "friends", "family", "parents", "partner", "boyfriend", "girlfriend", "breakup", "fight", "conflict", "argument"],
    reply: studentRelationshipsReply(),
  },
  {
    name: "loneliness",
    keywords: ["lonely", "loneliness", "isolated", "alone", "no friends", "left out", "belong"],
    reply: studentLonelinessReply(),
  },
  {
    name: "anger",
    keywords: ["angry", "anger", "furious", "rage", "irritated", "frustrated", "temper"],
    reply: studentAngerReply(),
  },
  {
    name: "self-esteem",
    keywords: ["confidence", "self-esteem", "self esteem", "worthless", "not good enough", "failure", "body image", "hate myself", "insecure"],
    reply: studentSelfEsteemReply(),
  },
  {
    name: "motivation",
    keywords: ["motivation", "motivated", "procrastinate", "procrastination", "focus", "distracted", "lazy", "can't start", "cant start"],
    reply: studentMotivationReply(),
  },
  {
    name: "stress",
    keywords: [
      "stress",
      "stressed",
      "overwhelmed",
      "pressure",
      "too much",
      "overload",
      "burnout",
      "burnt out",
      "burned out",
    ],
    reply: studentStressReply(),
  },
  {
    name: "getting support",
    keywords: [
      "counseling",
      "counselling",
      "counselor",
      "counsellor",
      "therapy",
      "therapist",
      "professional help",
      "talk to someone",
      "first session",
      "should i see",
    ],
    reply: studentSupportReply(),
  },
  {
    name: "grief",
    keywords: ["grief", "grieving", "loss of", "loved one", "died", "death", "passed away", "funeral", "miss them"],
    reply: studentGriefReply(),
  },
  {
    name: "financial stress",
    keywords: ["money", "financial", "finances", "broke", "tuition", "afford", "budget", "debt"],
    reply: studentFinancialReply(),
  },
];

const counselorTopics: Topic[] = [
  {
    name: "session planning",
    keywords: ["prepare", "prep", "plan my session", "next session", "first session", "before session", "session plan", "agenda"],
    reply: counselorSessionPrepReply(),
  },
  {
    name: "intake",
    keywords: ["intake", "assessment questions", "history questions", "first meeting questions", "what should i ask"],
    reply: counselorIntakeReply(),
  },
  {
    name: "documentation",
    keywords: ["document", "documentation", "session note", "soap", "dap", "write a note", "record", "chart"],
    reply: counselorDocumentationReply(),
  },
  {
    name: "rapport",
    keywords: ["rapport", "engagement", "resistant", "resistance", "guarded", "won't talk", "wont talk", "alliance", "motivational interviewing"],
    reply: counselorRapportReply(),
  },
  {
    name: "ethics",
    keywords: ["ethic", "ethics", "boundary", "boundaries", "confidentiality", "dual relationship", "informed consent", "self-disclosure"],
    reply: counselorEthicsReply(),
  },
  {
    name: "coping strategies",
    keywords: ["coping", "intervention", "technique", "strategy", "strategies", "suggest", "grounding", "behavioral activation"],
    reply: counselorCopingReply(),
  },
  {
    name: "burnout",
    keywords: ["burnout", "burnt out", "burned out", "exhausted", "self-care", "self care", "overwhelmed", "compassion fatigue"],
    reply: counselorBurnoutReply(),
  },
  {
    name: "termination",
    keywords: ["termination", "terminate", "closing", "end therapy", "ending", "goodbye", "discharge"],
    reply: counselorTerminationReply(),
  },
  {
    name: "referral",
    keywords: ["referral", "refer", "specialist", "psychiatry", "outside service", "handoff"],
    reply: counselorReferralReply(),
  },
];

function pickTopic(topics: Topic[], text: string): Topic | null {
  let best: Topic | null = null;
  let bestScore = 0;

  for (const topic of topics) {
    const score = topic.keywords.reduce((total, keyword) => (text.includes(keyword) ? total + 1 : total), 0);
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }

  return best;
}

/**
 * Returns a structured, role-aware reply for the AI Assistant page.
 *
 * This is a local guidance engine rather than an external model: it keeps the
 * demo usable without an API key and avoids sending sensitive student text to
 * a third party.
 */
export function getAssistantReply(role: AssistantRole, prompt: string): AssistantReply {
  const raw = prompt.trim();
  const text = normalise(raw);

  if (!text) {
    return { topic: "empty", content: "What would you like to work through? Tell me a little about what's happening." };
  }

  if (CRISIS_PATTERN.test(text)) {
    if (role === "counselor") {
      return { topic: "safety", content: counselorCrisisReply() };
    }
    if (role === "admin") {
      return {
        topic: "safety & privacy",
        content: `If this involves immediate danger to a student or anyone else, treat it as an urgent safety matter — do not handle it as a routine admin task.

Immediate steps
1. If there is imminent risk, follow your institution's emergency protocol and contact emergency services or the on-call counselor/clinical lead right away. Admins should facilitate escalation, not attempt clinical assessment.
2. Preserve privacy: share only the minimum necessary information with authorized responders. Do not expose or distribute private counseling records, notes, or sensitive messages.
3. Verify identity before taking account actions (password resets, role/status changes). Use out-of-band confirmation where policy requires.
4. Document actions factually in appropriate systems/audit trails (who, what, when, why) without adding sensitive clinical details you are not authorized to record.
5. After the situation is stabilized, review access, notifications, and audit logs for any related account or security concerns.

I can help you think through a safe operational checklist, but I cannot respond to emergencies or make clinical decisions.`,
      };
    }
    return { topic: "safety", content: studentCrisisReply() };
  }

  if (INFO_PATTERN.test(text)) {
    return { topic: "about the assistant", content: infoReply(role) };
  }

  if (GREETING_PATTERN.test(text)) {
    return {
      topic: "greeting",
      content:
        role === "counselor"
          ? "Hello. What would you like to work through — a session plan, a documentation question, a clinical dilemma, or something about your own workload?\n\nIf you give me the context, I can help you think it through step by step."
          : role === "admin"
            ? "Hello. I can help with user accounts, password resets, roles, reports, audit logs, content, or privacy/safety operations.\n\nWhat would you like to work on?"
            : "Hello. I'm here and ready to help. You can tell me what's been happening, ask a wellbeing question, or pick a topic such as stress, sleep, relationships, or motivation.\n\nWhat would feel most useful right now?",
    };
  }

  if (THANKS_PATTERN.test(text)) {
    return {
      topic: "acknowledgement",
      content:
        role === "counselor"
          ? "You're welcome. If you want, we can keep going — bring me the next piece of the situation and we can think it through together."
          : role === "admin"
            ? "You're welcome. If you need, tell me the next admin task (accounts, passwords, roles, reports, audit, or privacy) and I can help you plan it safely."
            : "You're welcome. I'm glad it was useful. If you want to keep going, tell me what part still feels unresolved, or what you'd like to try next.",
    };
  }

  if (role === "admin") {
    const t = text;
    if (/(password|reset|credential|temporary)/.test(t)) {
      return {
        topic: "password management",
        content: `Password reset/set guidance (admin)

1. Verify the requester's identity before changing credentials (use your institution's approved process).
2. Prefer generating a strong temporary password and require the user to change it after sign-in if your policy supports it.
3. Share the temporary password once through a secure channel — never post it in chat logs, tickets, or email threads that others can access.
4. Avoid reusing passwords or setting easily guessed values. Do not store or display existing passwords (they are hashed).
5. After resetting, confirm the correct account (name/email/role) was updated and review recent audit/activity if the reset was security-related.
6. If compromise is suspected, also review account status, sessions/devices per policy, and notify the user promptly.

In Mindwell, use User Management to set or generate a password; copy it immediately and deliver it securely to the intended user.`,
      };
    }
    if (/(user|account|student|counselor|role|status|create|deactivate|suspend|activate)/.test(t)) {
      return {
        topic: "account management",
        content: `User and account management guidance

1. Confirm the correct person and role before creating or changing accounts (student, counselor, admin). Apply least privilege — grant only the access needed.
2. For students, keep identity details accurate (name, email, student ID, year level, program/phone as applicable) so records and support are correctly matched.
3. For counselors, ensure their professional profile/details are complete and current; changes to roles/status can affect access to cases and scheduling.
4. Use status changes (active/inactive/suspended) according to policy and document the reason when appropriate.
5. After changes, verify the outcome: the user can sign in with the intended role and no unintended access was granted.
6. Protect privacy: admins should not access private counseling notes/content beyond what policy allows.

If you tell me the specific scenario (create, role change, deactivate, or info update), I can suggest a step-by-step checklist.`,
      };
    }
    if (/(audit|log|security|suspicious|incident)/.test(t)) {
      return {
        topic: "audit & security",
        content: `Audit log and security review tips

1. Filter by time window, actor, action, and target to narrow relevant events (logins, password resets, role/status changes, settings updates).
2. Look for anomalies: repeated failures, resets outside normal hours, unexpected role escalations, or actions on many accounts in a short period.
3. Correlate with reports/tickets before taking action; confirm whether changes were authorized.
4. Preserve evidence and follow incident-response policy if compromise is suspected (contain, notify, document).
5. Record what you reviewed and what actions you took, keeping sensitive details minimal.

I can help you interpret a pattern if you describe the events (without sharing secrets or private data).`,
      };
    }
    if (/(report|analytics|appointment|usage|metric)/.test(t)) {
      return {
        topic: "reports & analytics",
        content: `Reports and analytics guidance

1. Define the question first (utilization, appointment trends, user growth, engagement) and the time period to compare.
2. Validate data quality: check for missing/duplicate records, role/status filters, and date/timezone consistency.
3. Focus on actionable insights and trends rather than individual private details; avoid exposing sensitive student information in summaries.
4. Use findings to improve operations (capacity, outreach, content, support) and document follow-up actions.
5. Re-review after changes to confirm impact.

Tell me which report or metric you're looking at and what decision you're trying to make.`,
      };
    }
    return {
      topic: "general admin guidance",
      content: `I can help with that admin task. Here's a safe general approach:

- Clarify the goal and confirm you have authorization/policy backing for the action.
- Identify the exact account(s) or setting(s) involved (double-check names, emails, IDs, and roles).
- Apply least privilege and protect privacy — avoid accessing or sharing private counseling data.
- Make the change, then verify it worked as intended.
- Record or review relevant audit details if the action is sensitive (e.g. passwords, roles, status).

Share a bit more detail about what you're trying to do (e.g. "${shorten(raw, 120)}") and I can give more specific steps.`,
    };
  }

  const topic = pickTopic(role === "counselor" ? counselorTopics : studentTopics, text);

  if (topic) {
    return { topic: topic.name, content: topic.reply };
  }

  return {
    topic: "general guidance",
    content: role === "counselor" ? counselorFallbackReply(raw) : studentFallbackReply(raw),
  };
}
