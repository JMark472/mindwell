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

interface TopicInfo {
  key: string;
  title: string;
  aliases: RegExp;
  meaning: string;
  signs: string[];
  factors: string[];
  impact: string[];
  manage: string[];
  seekHelp: string[];
  exampleTip?: string;
}

const CRISIS_PATTERN =
  /(suicid|kill myself|end my life|want to die|take my life|don'?t want to (live|be here)|better off dead|no reason to live|no point in living|tired of living|can'?t go on|self[- ]?harm|hurt myself|cut myself|overdose|poison myself|jump off|hang myself|unsafe at home|someone is hurting me|being abused|abusive|assault|rape|molest|threat(en)?|immediate danger|in danger right now|hurt (someone|others)|kill (someone|others)|harm (someone|others)|violent thoughts|weapon|gusto ko nang mamatay|ayoko nang mabuhay|magpakamatay|papakamatayin ko ang sarili|saktan ang sarili|gusto kong mawala|wala nang saysay|gikapoy na ko og kinabuhi|gusto na ko mamatay|dili na ko gusto mabuhi|gusto ko magpakamatay|binabugbog ako|inaabuso ako|giabuso ko|quiero morir|me quiero morir|suicidarme|hacerme da(?:ñ|n)o)/i;

const INFO_PATTERN =
  /^(who are you|what are you|what can you do|what do you do|your name|how do you work|are you a real (ai|person)|are you human|what are your capabilities|sino ka|ano ka|ano ang kaya mong gawin|kinsa ka|unsa ka|unsa imong mahimo)\??$/i;

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

const MENTAL_HEALTH_TOPICS: TopicInfo[] = [
  {
    key: "mental_health_awareness",
    title: "Mental health awareness",
    aliases: /\bmental health( awareness)?\b|emotional health awareness|psychological health/i,
    meaning: "Mental health is the state of our emotional, psychological, and social well-being. It affects how we think, feel, handle stress, relate to others, and make choices.",
    signs: ["Feeling persistently overwhelmed, sad, anxious, or irritable", "Changes in sleep, appetite, or energy", "Difficulty coping with daily responsibilities", "Withdrawing from people or activities", "Trouble concentrating or making decisions"],
    factors: ["Life stress, loss, or trauma", "Academic, work, or financial pressure", "Family or relationship difficulties", "Biological factors and health conditions", "Lack of support, rest, or healthy coping skills"],
    impact: ["Can affect mood, focus, motivation, and relationships", "May make school, work, and daily tasks feel harder", "Can influence physical health habits like sleep and eating", "May reduce confidence and sense of well-being over time"],
    manage: ["Learn about mental health and notice early changes", "Practice healthy routines: sleep, nutrition, movement, and breaks", "Stay connected with supportive people", "Use coping skills like relaxation, problem-solving, and self-compassion", "Seek help early from a trusted person or professional"],
    seekHelp: ["When emotional difficulties last, worsen, or interfere with daily life", "When you feel unable to cope on your own", "When there are thoughts of self-harm, harm to others, or feeling unsafe"],
    exampleTip: "Checking in with yourself regularly can help you notice what you need before stress builds up.",
  },
  {
    key: "emotional_wellbeing",
    title: "Emotional well-being",
    aliases: /emotional well[- ]?being|emotional wellness|well[- ]?being|wellbeing/i,
    meaning: "Emotional well-being means being able to understand, express, and manage emotions in healthy ways while coping with life’s ups and downs.",
    signs: ["Feeling generally balanced or able to recover after stress", "Difficulty naming or expressing feelings", "Frequent mood swings or feeling emotionally drained", "Feeling satisfied or dissatisfied with daily life and relationships"],
    factors: ["Supportive relationships and sense of belonging", "Stress levels, rest, and self-care habits", "Life changes, challenges, and coping skills", "Personal values, meaning, and self-acceptance"],
    impact: ["Influences resilience, motivation, and decision-making", "Affects relationships and communication", "Shapes how you respond to stress and setbacks", "Supports or limits overall quality of life"],
    manage: ["Acknowledge feelings without judging yourself", "Build routines that support rest, connection, and enjoyment", "Practice mindfulness, journaling, or talking with someone you trust", "Set realistic goals and boundaries", "Ask for support when emotions feel hard to manage"],
    seekHelp: ["If emotional distress is frequent, intense, or affecting daily functioning", "If you feel stuck, numb, or unable to enjoy things for a while", "If you need guidance from a counselor or mental health professional"],
  },
  {
    key: "stress",
    title: "Stress and stress management",
    aliases: /\bstress(ed|ful)?\b|overwhelm(ed|ing)?|pressure|stressor/i,
    meaning: "Stress is the body and mind’s response to demands or challenges. Some stress can motivate us, but too much or ongoing stress can feel overwhelming.",
    signs: ["Feeling tense, worried, irritable, or overwhelmed", "Headaches, muscle tension, fatigue, or stomach upset", "Trouble sleeping or concentrating", "Racing thoughts or feeling rushed", "Avoiding tasks or feeling unable to cope"],
    factors: ["Academic deadlines, exams, or workload", "Family, financial, or relationship pressures", "Major life changes or uncertainty", "Lack of rest, support, or time for recovery", "Trying to handle too many responsibilities at once"],
    impact: ["Can affect focus, memory, and performance", "May strain relationships and mood", "Can disrupt sleep, appetite, and energy", "Long-term stress may affect physical and emotional health"],
    manage: ["Identify main stressors and what you can control", "Break tasks into smaller, manageable steps", "Use relaxation techniques (slow breathing, stretching, short breaks)", "Keep healthy routines for sleep, meals, and movement", "Reach out for support and set realistic expectations"],
    seekHelp: ["If stress feels constant or unmanageable", "If it affects sleep, mood, health, school, or relationships", "If you feel burned out, hopeless, or unable to function as usual"],
  },
  {
    key: "anxiety",
    title: "Anxiety and anxiety-related concerns",
    aliases: /\banxious\b|\banxiety\b|worried|worrying|panic|nervous|on edge|kabado|kinakabahan|balisa|kabalaka/i,
    meaning: "Anxiety is a feeling of worry, fear, or nervousness. It is a normal response to uncertainty, but it can become difficult when it is frequent, intense, or hard to control.",
    signs: ["Excessive worry or expecting the worst", "Restlessness, tension, or feeling on edge", "Racing thoughts or difficulty concentrating", "Rapid heartbeat, sweating, trembling, or upset stomach", "Avoiding situations that trigger worry"],
    factors: ["Stressful or uncertain situations", "Past experiences or learned worry patterns", "Perfectionism or fear of failure", "Lack of sleep, caffeine, or health concerns", "Major changes or high-pressure environments"],
    impact: ["Can interfere with focus, decisions, and daily tasks", "May affect sleep, appetite, and energy", "Can lead to avoidance of school, social, or personal activities", "May reduce confidence and sense of calm over time"],
    manage: ["Practice grounding (notice what you see, hear, feel) and slow breathing", "Challenge overwhelming thoughts by focusing on facts and manageable steps", "Limit avoidance by taking small, safe steps", "Maintain routines, rest, and supportive connections", "Use calming activities like journaling, walking, or mindfulness"],
    seekHelp: ["If anxiety is persistent, intense, or hard to control", "If it significantly affects school, work, relationships, or daily life", "If you experience panic-like symptoms that feel alarming or recurring"],
    exampleTip: "Try a slow breathing pattern: inhale gently, exhale a little longer, and repeat for a minute.",
  },
  {
    key: "depression",
    title: "Depression and depressive symptoms",
    aliases: /\bdepress(ed|ion|ive)?\b|low mood|hopeless|empty|numb|malungkot|walang gana/i,
    meaning: "Depression involves persistent feelings of sadness, emptiness, or loss of interest that can affect thoughts, energy, and daily functioning. Feeling sad sometimes is normal, but ongoing symptoms deserve care.",
    signs: ["Persistent sadness, emptiness, or hopelessness", "Loss of interest or pleasure in usual activities", "Low energy, fatigue, or feeling slowed down", "Changes in sleep or appetite", "Difficulty concentrating or feeling worthless", "Withdrawing from others"],
    factors: ["Stressful life events, loss, or trauma", "Ongoing pressure, isolation, or relationship difficulties", "Biological, psychological, and social factors", "Past mental health concerns or family history", "Lack of support or unmet needs"],
    impact: ["Can make daily tasks, school, or work feel very difficult", "May affect motivation, relationships, and self-care", "Can disrupt sleep, appetite, and concentration", "May reduce hope and sense of connection"],
    manage: ["Start with small, gentle steps (basic care, simple routines)", "Stay connected with supportive people when possible", "Engage in manageable activities that provide comfort or meaning", "Practice self-compassion and challenge harsh self-talk", "Reach out for professional support for assessment and guidance"],
    seekHelp: ["If low mood or loss of interest lasts more than a couple of weeks or worsens", "If it interferes with daily life, school, or relationships", "If you have thoughts of self-harm, suicide, or not wanting to be alive (seek immediate help)"],
  },
  {
    key: "emotional_regulation",
    title: "Emotional regulation",
    aliases: /emotional regulation|manage (my )?emotions|control (my )?emotions|mood swings|overreact/i,
    meaning: "Emotional regulation is the ability to notice, understand, and respond to emotions in healthy and balanced ways, even when feelings are strong.",
    signs: ["Feeling emotions intensely or having sudden mood shifts", "Reacting quickly and regretting it later", "Difficulty calming down after being upset", "Suppressing feelings or feeling overwhelmed by them", "Trouble expressing needs clearly"],
    factors: ["Stress, fatigue, or lack of coping tools", "Past experiences and learned patterns", "Environment, relationships, and triggers", "Mental health concerns or ongoing pressure"],
    impact: ["Can affect communication and relationships", "May influence decisions and conflict handling", "Can increase stress or misunderstandings", "May affect confidence and self-control over time"],
    manage: ["Pause and name the emotion before reacting", "Use calming strategies (breathing, grounding, taking a break)", "Identify triggers and plan helpful responses", "Express feelings respectfully using clear statements", "Build supportive routines and coping skills"],
    seekHelp: ["If emotions feel out of control or lead to harm/conflict often", "If intense reactions affect relationships, school, or safety", "If a counselor can help you learn tailored strategies"],
  },
  {
    key: "burnout",
    title: "Burnout and academic pressure",
    aliases: /burnout|burnt out|academic pressure|school pressure|exam anxiety|exams|overworked|drained/i,
    meaning: "Burnout is a state of emotional, mental, and physical exhaustion caused by prolonged stress or pressure, often related to school, work, or heavy responsibilities.",
    signs: ["Feeling exhausted, drained, or unmotivated", "Cynicism, irritability, or feeling detached", "Reduced performance or difficulty concentrating", "Feeling overwhelmed by tasks that used to be manageable", "Trouble resting or recovering even after breaks"],
    factors: ["Heavy workload, deadlines, or high expectations", "Lack of rest, balance, or support", "Perfectionism and fear of failure", "Limited control over demands or schedules", "Ongoing stress without enough recovery time"],
    impact: ["Can reduce motivation, focus, and academic performance", "May affect mood, sleep, and physical health", "Can strain relationships and self-esteem", "May lead to withdrawal or feeling stuck"],
    manage: ["Set realistic goals and prioritize essential tasks", "Break work into smaller steps and take regular breaks", "Create boundaries and a manageable routine", "Seek support from teachers, counselors, friends, or family", "Protect rest, nutrition, and activities that restore energy"],
    seekHelp: ["If exhaustion and stress persist despite rest", "If burnout affects your health, mood, or ability to function", "If you feel hopeless, overwhelmed, or need structured support"],
  },
  {
    key: "self_esteem",
    title: "Self-esteem and self-confidence",
    aliases: /self[- ]?esteem|self[- ]?confidence|self[- ]?worth|insecure|not good enough|hate myself/i,
    meaning: "Self-esteem is how you view and value yourself. Healthy self-esteem involves realistic self-acceptance, recognizing strengths, and treating yourself with respect.",
    signs: ["Frequent self-criticism or comparing yourself to others", "Feeling not good enough or fearing judgment", "Difficulty accepting compliments or acknowledging strengths", "Avoiding challenges due to fear of failure", "People-pleasing or struggling to set boundaries"],
    factors: ["Past experiences, feedback, or criticism", "Social comparison and pressure", "Academic or personal setbacks", "Relationships and environment", "Perfectionism and unrealistic expectations"],
    impact: ["Can affect confidence, motivation, and choices", "May influence relationships and communication", "Can increase anxiety, stress, or avoidance", "May limit willingness to try new things or seek help"],
    manage: ["Practice balanced self-talk and self-compassion", "Notice personal strengths and small achievements", "Set achievable goals and celebrate progress", "Limit unhealthy comparisons, including on social media", "Surround yourself with supportive and respectful people"],
    seekHelp: ["If low self-esteem is persistent and affects daily life", "If it contributes to anxiety, depression, or self-harm thoughts", "If you want guidance building confidence and coping skills"],
  },
  {
    key: "loneliness",
    title: "Loneliness and social isolation",
    aliases: /lonely|loneliness|isolat(ed|ion)|no one understands|nobody understands|alone|left out/i,
    meaning: "Loneliness is the feeling of being disconnected or not understood, even when others are around. Social isolation involves having limited social contact or support.",
    signs: ["Feeling alone, unseen, or misunderstood", "Wanting connection but struggling to reach out", "Withdrawing from social activities", "Feeling empty, sad, or anxious in social situations", "Difficulty trusting or opening up to others"],
    factors: ["Life transitions, conflict, or loss", "Shyness, social anxiety, or low confidence", "Bullying, exclusion, or relationship difficulties", "Heavy workload or limited opportunities to connect", "Differences in interests, culture, or experiences"],
    impact: ["Can affect mood, motivation, and self-esteem", "May increase stress, sadness, or anxiety", "Can reduce sense of belonging and support", "May make challenges feel harder to manage alone"],
    manage: ["Start with small, safe steps to connect (message, join an activity)", "Reach out to trusted people and share how you feel", "Engage in communities or interests that feel welcoming", "Practice self-compassion and balanced thoughts about social experiences", "Consider counseling or support groups for connection and skills"],
    seekHelp: ["If loneliness feels persistent or overwhelming", "If it leads to withdrawal, hopelessness, or low mood", "If you need support building connections or coping with isolation"],
  },
  {
    key: "grief",
    title: "Grief and loss",
    aliases: /grief|grieving|loss|bereave(d|ment)|mourning|passed away|death of/i,
    meaning: "Grief is a natural response to loss, such as the death of a loved one, the end of a relationship, or other significant changes. Everyone grieves differently and there is no single ‘right’ way.",
    signs: ["Sadness, longing, or shock", "Anger, guilt, confusion, or numbness", "Changes in sleep, appetite, or energy", "Difficulty concentrating or accepting the loss", "Waves of emotion that come and go"],
    factors: ["Death or serious illness of someone close", "Breakups, separation, or friendship loss", "Major life changes or lost opportunities", "Personal meaning of the loss and available support", "Past experiences and coping resources"],
    impact: ["Can affect emotions, thoughts, and daily routines", "May change relationships and sense of stability", "Can make it hard to focus or feel motivated", "May come in waves over time, even after adjustment"],
    manage: ["Allow yourself to feel and express emotions at your own pace", "Maintain basic routines and gentle self-care", "Seek comfort from supportive people or communities", "Honor memories or meaning in ways that feel right to you", "Be patient with yourself; healing takes time"],
    seekHelp: ["If grief feels unbearable or does not ease over time", "If it severely affects daily functioning or health", "If you feel hopeless, isolated, or need professional support"],
  },
  {
    key: "relationships",
    title: "Relationship challenges",
    aliases: /relationship|friendship|friends|family conflict|breakup|partner|peer pressure|bullying|conflict|argument/i,
    meaning: "Relationship challenges involve difficulties in how people connect, communicate, or treat each other. Healthy relationships are based on respect, safety, and clear communication.",
    signs: ["Frequent misunderstandings, arguments, or tension", "Feeling unheard, disrespected, or pressured", "Difficulty setting or respecting boundaries", "Withdrawal, avoidance, or fear of conflict", "Stress or sadness related to interactions with others"],
    factors: ["Communication differences or unmet expectations", "Stress, life changes, or past experiences", "Peer pressure, bullying, or power imbalances", "Lack of trust, respect, or boundaries", "Family or social dynamics"],
    impact: ["Can affect mood, confidence, and sense of safety", "May increase stress, loneliness, or conflict", "Can influence school, work, and daily well-being", "Healthy changes can improve support and connection"],
    manage: ["Communicate clearly using respectful ‘I’ statements", "Listen actively and choose calm times to talk", "Set and respect boundaries", "Seek compromise when safe and appropriate", "Reach out for support from trusted people or counselors"],
    seekHelp: ["If there is bullying, abuse, threats, or you feel unsafe", "If conflict is ongoing and affecting your well-being", "If you need help with boundaries, communication, or safety planning"],
  },
  {
    key: "sleep",
    title: "Sleep and mental well-being",
    aliases: /sleep|insomnia|can't sleep|cant sleep|trouble sleeping|tulog|makatulog|puyat/i,
    meaning: "Sleep is essential for emotional balance, focus, and overall health. Sleep difficulties can affect mood and coping, and stress or mental health concerns can also affect sleep.",
    signs: ["Difficulty falling or staying asleep", "Waking up feeling unrefreshed", "Daytime fatigue, irritability, or low focus", "Racing thoughts at bedtime", "Changes in sleep schedule or habits"],
    factors: ["Stress, worry, or irregular routines", "Screen use, caffeine, or environment", "Academic pressure or lifestyle changes", "Physical health issues or discomfort", "Anxiety, low mood, or other mental health concerns"],
    impact: ["Can affect mood, memory, and concentration", "May increase stress and emotional sensitivity", "Can reduce energy and motivation", "May make it harder to cope with daily challenges"],
    manage: ["Keep a consistent sleep and wake schedule when possible", "Create a calming wind-down routine before bed", "Limit caffeine and screens close to bedtime", "Use relaxation techniques if worries keep you awake", "If unable to sleep, do a calm activity and return to bed when sleepy"],
    seekHelp: ["If sleep problems persist or worsen over time", "If lack of sleep significantly affects daily life, mood, or health", "If sleep issues occur with ongoing anxiety, low mood, or distress"],
  },
  {
    key: "coping",
    title: "Healthy coping mechanisms",
    aliases: /coping|cope|healthy habits|deal with (stress|problems|emotions)/i,
    meaning: "Healthy coping mechanisms are helpful ways to manage stress, emotions, and challenges without causing harm to yourself or others.",
    signs: ["Using strategies that help you feel calmer or more in control", "Relying on avoidance, withdrawal, or harmful habits when stressed", "Feeling unsure how to handle difficult emotions", "Recovering after setbacks with support and self-care"],
    factors: ["Personal experiences and learned skills", "Support systems and environment", "Level of stress and available resources", "Beliefs about emotions and asking for help"],
    impact: ["Healthy coping can improve resilience and well-being", "Unhelpful coping may increase stress or problems over time", "Coping skills affect relationships and daily functioning", "Building skills can make challenges feel more manageable"],
    manage: ["Identify feelings and triggers", "Use problem-solving for things you can change", "Practice relaxation, mindfulness, or physical activity", "Connect with supportive people and take breaks", "Seek professional guidance to learn tailored coping strategies"],
    seekHelp: ["If coping feels difficult or relies on harmful behaviors", "If stress or emotions interfere with daily life", "If you want support developing healthier strategies"],
  },
  {
    key: "mindfulness",
    title: "Mindfulness and relaxation",
    aliases: /mindful(ness)?|relax(ation|ing)?|breathing exercise|grounding|meditat(e|ion)/i,
    meaning: "Mindfulness is paying attention to the present moment with openness and without harsh judgment. Relaxation practices help calm the body and mind.",
    signs: ["Feeling more aware of thoughts, feelings, and sensations", "Difficulty staying present due to worry or distraction", "Physical tension or restlessness", "Benefits such as feeling calmer or more focused after practice"],
    factors: ["Stress levels and daily routines", "Practice and familiarity with techniques", "Environment and available time", "Personal preferences and needs"],
    impact: ["Can support emotional regulation and stress management", "May improve focus, calm, and self-awareness", "Can help with sleep and coping when practiced regularly", "Not a cure-all, but a helpful supportive skill"],
    manage: ["Try slow breathing: inhale gently, exhale longer", "Use grounding: notice 5 things you see, 4 feel, 3 hear, 2 smell, 1 taste", "Practice short mindful pauses during the day", "Do gentle stretching or calming activities", "Be patient—skills improve with regular practice"],
    seekHelp: ["If stress, anxiety, or distress remains difficult despite self-help", "If mindfulness brings up overwhelming feelings", "If you need guidance from a counselor or professional"],
  },
  {
    key: "personal_development",
    title: "Personal development",
    aliases: /personal development|self[- ]?improvement|growth|build confidence|better habits/i,
    meaning: "Personal development is the process of building skills, habits, and self-understanding to support your goals, well-being, and relationships.",
    signs: ["Interest in learning, growth, or positive change", "Feeling stuck or unsure about goals", "Making progress through small consistent steps", "Struggling with motivation or confidence"],
    factors: ["Goals, values, and motivation", "Support, opportunities, and resources", "Habits, mindset, and past experiences", "Stress, time, and life circumstances"],
    impact: ["Can improve confidence, resilience, and direction", "Supports healthy habits and decision-making", "May enhance relationships and academic/personal success", "Progress is often gradual and non-linear"],
    manage: ["Set realistic, meaningful goals", "Break goals into small achievable steps", "Reflect on strengths and learn from setbacks", "Build supportive routines and seek feedback", "Celebrate progress and practice self-compassion"],
    seekHelp: ["If you feel stuck, overwhelmed, or unsure where to start", "If emotional concerns are affecting growth and motivation", "If coaching/counseling support would be helpful"],
  },
  {
    key: "psychological_wellbeing",
    title: "Psychological well-being",
    aliases: /psychological well[- ]?being|mental wellness|psychological health/i,
    meaning: "Psychological well-being includes positive mental functioning such as self-acceptance, purpose, personal growth, healthy relationships, and the ability to manage life’s challenges.",
    signs: ["Sense of purpose, autonomy, or personal growth", "Ability to cope with stress and adapt", "Healthy relationships and self-acceptance", "Feeling stuck, disconnected, or lacking meaning at times"],
    factors: ["Supportive relationships and environment", "Life experiences, values, and goals", "Coping skills and self-care", "Mental and physical health factors"],
    impact: ["Influences resilience, satisfaction, and functioning", "Affects how challenges and emotions are managed", "Supports motivation and healthy relationships", "Can fluctuate over time with life circumstances"],
    manage: ["Nurture supportive connections and meaningful activities", "Practice self-care, reflection, and balanced thinking", "Set goals aligned with your values", "Develop coping and problem-solving skills", "Seek help when challenges affect well-being"],
    seekHelp: ["If distress or difficulties persist and limit daily functioning", "If you feel unable to cope or find meaning/support", "If professional guidance could support recovery and growth"],
  },
  {
    key: "stigma",
    title: "Mental health stigma and awareness",
    aliases: /stigma|ashamed to seek help|embarrassed|judged for mental health/i,
    meaning: "Mental health stigma involves negative beliefs, stereotypes, or discrimination about mental health concerns. Awareness helps promote understanding, compassion, and support.",
    signs: ["Feeling ashamed or afraid to talk about mental health", "Hiding struggles or avoiding help due to judgment", "Believing myths like ‘mental health problems are a weakness’", "Hearing or experiencing dismissive comments"],
    factors: ["Cultural beliefs, misinformation, or lack of awareness", "Past negative experiences or fear of judgment", "Social attitudes and stereotypes", "Limited access to supportive conversations"],
    impact: ["Can delay seeking help and increase isolation", "May worsen distress and self-criticism", "Can affect relationships, confidence, and recovery", "Reducing stigma supports healthier communities"],
    manage: ["Learn accurate, compassionate information about mental health", "Talk with trusted, supportive people", "Challenge myths and practice respectful language", "Support others without judgment", "Remember that seeking help is a sign of strength and care"],
    seekHelp: ["If stigma or fear is preventing you from getting support", "If you feel isolated, judged, or distressed", "If a counselor or trusted professional can provide safe guidance"],
  },
  {
    key: "seeking_help",
    title: "Seeking professional mental health support",
    aliases: /seek(ing)? (professional )?(help|support)|talk to (a )?(counselor|therapist|psychologist|psychiatrist)|need counseling|book (a )?session|human support/i,
    meaning: "Seeking professional mental health support means reaching out to trained professionals (such as counselors, psychologists, or psychiatrists) for guidance, assessment, or care tailored to your needs.",
    signs: ["Feeling unsure where to start or who to talk to", "Struggling despite self-help efforts", "Wanting a safe space to discuss concerns", "Needing support for ongoing or intense difficulties"],
    factors: ["Severity and duration of concerns", "Impact on daily life, safety, and relationships", "Personal preferences and available services", "Support systems and access to care"],
    impact: ["Can provide understanding, coping strategies, and appropriate care", "May improve well-being, functioning, and support", "Early help can prevent concerns from becoming harder to manage", "Different people may benefit from different types of support"],
    manage: ["Identify what you’re experiencing and what kind of help you want", "Reach out to a trusted person or campus counseling services", "In MindWell, you can book a counseling session or message a counselor for support", "Prepare questions or goals for your session if helpful", "In urgent situations, contact emergency services or crisis support immediately"],
    seekHelp: ["If concerns persist, worsen, or interfere with daily life", "If you feel unsafe or at risk of harm (seek immediate help)", "If you simply feel you would benefit from talking to a professional"],
  },
];

export const assistantPrompts: Record<AssistantRole, string[]> = {
  student: [
    "I'm feeling stressed because of my studies",
    "I feel like nobody understands me",
    "Explain anxiety in simple words",
    "How can I cope with burnout?",
    "What should I do if I feel lonely?",
    "Explain my mood check-in and when to seek help",
  ],
  counselor: [
    "Help me plan my next session",
    "Give me intake questions for academic stress",
    "How should I document a session objectively?",
    "How do I respond to a student who may be at risk?",
    "Explain motivational interviewing simply",
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
    return `Hi${name} — I'm your Mindwell AI Counseling Assistant. I can help you prepare sessions, think through student concerns, review coping strategies, organize intake/documentation ideas, and consider safety-focused next steps.

I can explain topics in short, standard, or detailed ways; respond in the language you prefer when possible (including English, Filipino, and Cebuano); and simplify or translate explanations.

I provide supportive, responsible guidance only. I can’t replace your clinical judgment, supervision, direct assessment, diagnosis, or your institution’s protocols. What would you like to work through today?`;
  }
  if (role === "admin") {
    return `Hi${name} — I'm the Mindwell AI Admin Assistant. I can help with account and role management, secure password handling, reports and analytics, audit-log review, and privacy/safety operations.

I can provide short checklists or detailed explanations, simplify complex topics, and respond in your preferred language when possible.

I provide operational guidance only — verify actions against policy, protect credentials, and never access or share private counseling records. What would you like help with?`;
  }

  return `Hi${name} — I'm the Mindwell AI Assistant. I can help you understand mental health topics, talk through everyday emotional concerns, and share practical, responsible coping ideas for stress, anxiety, low mood, sleep, relationships, school pressure, and more.

I can respond in the language you use when possible (including English, Filipino, and Cebuano), and I can give short, standard, or detailed explanations in simple words.

I’m here to support you, but I’m not a replacement for a licensed mental health professional or emergency services, and I can’t diagnose conditions. If you may be in immediate danger, please contact local emergency services or use Help & Crisis in MindWell. What’s on your mind today?`;
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
  const chars = Array.from(text);
  return chars.length > limit ? `${chars.slice(0, limit - 1).join("").trim()}…` : text;
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

  const score: Record<string, number> = { fil: 0, ceb: 0, es: 0, fr: 0, de: 0, pt: 0, vi: 0, id: 0, en: 0 };
  const has = (w: string) => t.includes(` ${w} `) || t.includes(w);
  const bump = (code: string, words: string[]) => {
    for (const w of words) if (has(w)) score[code] += 1;
  };

  bump("fil", [" ako ", " ikaw ", " hindi ", " paano ", " bakit ", " gusto ", " nalulungkot ", " nahihirapan ", " tulong ", " kinakabahan ", " pagod ", " problema ", " sana ", " kasi ", " yung ", " nga ", " po ", " naman ", " araw ", " ngayon ", " maaari ", " kumusta ", " kamusta ", " salamat ", " maganda ", " mabuti ", " opo ", " lungkot "]);
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
    "3. Review what helped and adjust if needed.",
  ];
  if (ctx.role === "student") {
    parts.push("", "If this concern is affecting your daily life, safety, or wellbeing for a while, reaching out to a counselor or trusted support person can help. Coping strategies can be helpful, but different people may need different forms of support.");
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
    "- Think of it as taking one small, manageable step at a time instead of solving everything at once.",
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
  return `Response (${target.name} requested):\n\n${text}\n\nNote: I can reliably adapt responses in English, Filipino, and Cebuano in this assistant. For ${target.name}, I’ve provided the clearest helpful explanation I can. If you need a precise translation of specific text, share it and I’ll do my best to assist clearly.`;
}

function translateSimple(text: string, target: LangInfo): string {
  const src = text.trim();
  if (!src) return "Please provide the text you want to translate.";
  if (target.code === "en") return src;

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
    [/\bi feel lonely\b/gi, "Nakakaramdam ako ng kalungkutan"],
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
    [/\bi feel lonely\b/gi, "Mingawon ko"],
  ];
  if (target.code === "fil") {
    let out = src;
    for (const [re, rep] of enFil) out = out.replace(re, rep);
    if (out !== src) return `Filipino translation (best effort):\n${out}`;
    return `Filipino translation (best effort):\n\n${src}\n\nNote: For precise, nuanced translation of longer or complex text, a dedicated translation service may be needed. I can still explain the meaning clearly in Filipino or English if you’d like.`;
  }
  if (target.code === "ceb") {
    let out = src;
    for (const [re, rep] of enCeb) out = out.replace(re, rep);
    if (out !== src) return `Cebuano translation (best effort):\n${out}`;
    return `Cebuano translation (best effort):\n\n${src}\n\nNote: For precise, nuanced translation of longer or complex text, a dedicated translation service may be needed. I can still explain the meaning clearly in Cebuano or English if you’d like.`;
  }
  if (target.code === "es") {
    const map: [RegExp, string][] = [
      [/\bi need help\b/gi, "Necesito ayuda"],
      [/\bthank you\b/gi, "Gracias"],
      [/\bhow are you\b/gi, "¿Cómo estás?"],
      [/\bi can't sleep\b/gi, "No puedo dormir"],
      [/\byou are not alone\b/gi, "No estás solo/a"],
    ];
    let out = src;
    for (const [re, rep] of map) out = out.replace(re, rep);
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

function detectTopicInfo(text: string): TopicInfo | null {
  return MENTAL_HEALTH_TOPICS.find((t) => t.aliases.test(text)) ?? null;
}

function detectStudentExperience(text: string): string | null {
  if (/no(body| one) understands|nobody understands|walang nakakaintindi|walay kasabot/i.test(text)) return "misunderstood";
  if (/emotionally exhausted|drained|pagod na pagod|kapoy na kaayo/i.test(text)) return "exhausted";
  if (/anxious about (my )?future|worried about (my )?future|kinakabahan sa kinabukasan/i.test(text)) return "future";
  if (/lonely even when|surrounded by people|alone in a crowd/i.test(text)) return "lonely_crowd";
  if (/don't know how to handle|di ko alam paano|wala ko kabalo unsaon/i.test(text)) return "overwhelmed";
  if (/exam anxiety|takot sa exam|kabado sa exam/i.test(text)) return "exam";
  if (/family expectations|pressure from family|parents expect/i.test(text)) return "family";
  if (/peer pressure/i.test(text)) return "peer";
  if (/bully|bullied|bullying/i.test(text)) return "bullying";
  if (/fear of failure|afraid to fail|takot magkamali/i.test(text)) return "failure";
  if (/loss of motivation|no motivation|walang gana|walay gana/i.test(text)) return "motivation_loss";
  if (/adjust(ing|ment)? to college|new (school|college)|homesick/i.test(text)) return "adjustment";
  if (/time management|can't manage my time|hirap sa oras/i.test(text)) return "time";
  return null;
}

function empatheticOpening(experience: string | null): string {
  switch (experience) {
    case "misunderstood":
      return "I’m really sorry you’re feeling that way. Feeling misunderstood can be painful, and your feelings are valid.";
    case "exhausted":
      return "It sounds like you’ve been carrying a lot. Feeling emotionally exhausted is a real and understandable response to ongoing pressure.";
    case "future":
      return "Feeling anxious about the future is understandable, especially when things feel uncertain. You don’t have to figure everything out at once.";
    case "lonely_crowd":
      return "Feeling lonely even when you’re around others can be really hard. It makes sense to want deeper understanding and connection.";
    case "overwhelmed":
      return "It’s okay to feel unsure about how to handle things right now. When problems pile up, it can be hard to know where to start.";
    case "exam":
      return "Exam anxiety is very common, and it can feel intense. Your concern makes sense, especially when you care about doing well.";
    case "family":
      return "Family expectations can bring a lot of pressure. It’s understandable to feel stressed when you’re trying to meet others’ hopes while taking care of yourself.";
    case "peer":
      return "Peer pressure can be difficult to deal with. It’s okay to prioritize your values, comfort, and well-being.";
    case "bullying":
      return "I’m really sorry you’re experiencing this. Bullying is not your fault, and you deserve to feel safe and respected.";
    case "failure":
      return "Fear of failure is something many students experience. It’s understandable, and it doesn’t define your worth or potential.";
    case "motivation_loss":
      return "Losing motivation can happen when you’re stressed, tired, or overwhelmed. It doesn’t mean you’re lazy or incapable.";
    case "adjustment":
      return "Adjusting to a new environment like college can take time. Feeling unsettled or homesick is a normal part of that transition.";
    case "time":
      return "Managing time can feel challenging when there’s a lot to juggle. You’re not alone in finding this difficult.";
    default:
      return "Thank you for sharing this with me. What you’re feeling matters, and it’s okay to take things one step at a time.";
  }
}

function studentCounselorConnectionNote() {
  return "If you’d like human support, you can book a counseling session or message a counselor in MindWell. For urgent concerns or if you feel unsafe, please use the Help & Crisis page or contact local emergency services right away.";
}

function buildTopicResponse(topic: TopicInfo, mode: ResponseMode, role: AssistantRole): string {
  const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n");
  if (mode === "short") {
    return [
      `${topic.title}`,
      "",
      `What it means: ${topic.meaning}`,
      "",
      "Key things to know:",
      `- Common signs: ${topic.signs.slice(0, 2).join("; ")}.`,
      `- Helpful ways to cope: ${topic.manage.slice(0, 2).join("; ")}.`,
      `- When to seek help: ${topic.seekHelp[0]}`,
      "",
      "This is general information, not a diagnosis. Different people may need different forms of support.",
    ].join("\n");
  }
  if (mode === "detailed") {
    return [
      `${topic.title}`,
      "",
      `What it means:\n${topic.meaning}`,
      "",
      `Common signs and experiences:\n${list(topic.signs)}`,
      "",
      `Possible contributing factors:\n${list(topic.factors)}`,
      "",
      `How it may affect everyday life:\n${list(topic.impact)}`,
      "",
      `Healthy ways to manage it:\n${list(topic.manage)}`,
      "",
      `When professional support may be necessary:\n${list(topic.seekHelp)}`,
      topic.exampleTip ? `\nExample/practical tip:\n- ${topic.exampleTip}` : "",
      "",
      role === "student"
        ? "If this is affecting you, consider talking with a trusted person or booking/message a counselor in MindWell for personalized support."
        : role === "counselor"
          ? "Use professional judgment, direct assessment, and institutional protocols when supporting students with these concerns."
          : "Use this as general awareness information and follow your organization’s policies for support and referrals.",
      "",
      "Note: This is general, evidence-informed information and not a personal diagnosis or treatment plan.",
    ].join("\n");
  }
  // standard
  return [
    `${topic.title}`,
    "",
    `What it means: ${topic.meaning}`,
    "",
    `Common signs and experiences:\n${list(topic.signs.slice(0, 4))}`,
    "",
    `Possible contributing factors:\n${list(topic.factors.slice(0, 4))}`,
    "",
    `How it may affect everyday life:\n${list(topic.impact.slice(0, 3))}`,
    "",
    `Healthy ways to manage it:\n${list(topic.manage.slice(0, 4))}`,
    "",
    `When professional support may be necessary:\n${list(topic.seekHelp.slice(0, 3))}`,
    "",
    "This is general information, not a diagnosis. Coping strategies can help, but different people may need different forms of support.",
  ].join("\n");
}

function buildMoodAssessmentReply(raw: string): string | null {
  const t = normalise(raw);
  const asksMood = /(mood|check[- ]?in|checkin|how am i doing|my feelings today)/.test(t);
  const asksAssessment = /(assessment|questionnaire|screen(ing)?|test result|score|result)/.test(t);
  if (!asksMood && !asksAssessment) return null;

  if (asksAssessment) {
    return [
      "About assessments and screening results",
      "",
      "I can help you understand assessment or screening information in a general and responsible way, but I can’t see or invent your personal scores from this chat.",
      "",
      "Important points:",
      "- Screening tools and questionnaires are meant for reflection and guidance, not for a professional diagnosis.",
      "- Results should be interpreted using the tool’s actual, validated scoring rules and context.",
      "- A single response, mood entry, or message is not enough to identify a mental health condition.",
      "- If results suggest significant distress or affect your daily life, consider speaking with a qualified counselor or mental health professional.",
      "",
      "In MindWell:",
      "- The student assessment page provides a self-reflection wellbeing questionnaire. Treat its results as informational support, not a medical or psychological diagnosis.",
      "- If you need help understanding what a result means for you, you can discuss it with a counselor by booking a session or sending a message.",
      "",
      "If you’re in immediate danger or thinking about harming yourself or others, please contact local emergency services or use Help & Crisis right away.",
    ].join("\n");
  }

  return [
    "About mood check-ins in MindWell",
    "",
    "I can help you understand mood check-ins in general, but I can’t access or invent your private check-in data from this chat.",
    "",
    "How mood check-ins work (based on MindWell features):",
    "- You can record how you feel using a mood scale (1 = Very Low to 5 = Great), and you may add notes for context.",
    "- Your recent entries and trends can help you notice patterns over time (for example, changes in mood across days).",
    "- Sharing a check-in with a counselor is your choice and depends on your consent/privacy settings. If shared, a counselor may send advice on that entry.",
    "- I should not infer a mental health condition from a single mood entry or message.",
    "",
    "How to reflect on your mood responsibly:",
    "- Look for patterns over time rather than focusing on one day alone.",
    "- Notice possible influences (sleep, stress, school pressure, relationships, health).",
    "- Consider small supportive steps (rest, routines, coping skills, talking to someone you trust).",
    "- If low mood, stress, or anxiety is frequent, worsening, or affecting daily life, reaching out to a counselor or qualified professional can help.",
    "",
    "You can review your entries in Mood Check-In or Mood History. If you want, tell me how you’ve been feeling lately (in your own words), and I can offer supportive, practical suggestions.",
  ].join("\n");
}

function buildStudentResponse(topic: string, topicInfo: TopicInfo | null, ctx: ReplyContext): string {
  const q = ctx.question ? `About what you shared: “${shortenText(ctx.raw, 180)}”\n\n` : "";
  const exp = detectStudentExperience(ctx.text);
  const opening = ctx.role === "student" ? `${empatheticOpening(exp)}\n\n` : "";

  if (topicInfo) {
    const body = buildTopicResponse(topicInfo, ctx.mode, ctx.role);
    return `${q}${opening}${body}\n\n${studentCounselorConnectionNote()}`;
  }

  // non-catalog but important student cases
  if (exp === "bullying") {
    return `${q}${opening}You deserve safety and respect. If you feel safe to do so, consider:\n- Reaching out to a trusted person (friend, family member, teacher, or counselor).\n- Documenting what happened (when, where, who was involved).\n- Using available support or reporting channels at your school.\n- Setting boundaries and avoiding being alone in situations that feel unsafe when possible.\n\nIf there are threats, violence, or you feel in immediate danger, seek emergency help right away. You can also book a counseling session or message a counselor in MindWell for support.`;
  }

  switch (topic) {
    case "academic stress":
      return `${q}${opening}School pressure can feel overwhelming, but small steps can make it more manageable.\n\nWhat can help:\n- List what’s due and prioritize the next 24–72 hours.\n- Break big tasks into small, specific actions (for example, “review 5 pages”).\n- Study in short focused blocks with breaks.\n- Protect basics like sleep, meals, and hydration.\n- Ask for clarification or support early when you can.\n\nTry this next: choose one small task you can start today for 10–20 minutes. ${studentCounselorConnectionNote()}`;
    case "sleep":
      return `${q}${opening}Trouble sleeping is common when your mind is busy or stressed. A steady routine often helps more than forcing sleep.\n\nWhat can help:\n- Keep a consistent wake-up time when possible.\n- Build a calming 30–60 minute wind-down routine.\n- Limit caffeine late in the day and reduce screen time before bed.\n- Write down worries or tomorrow’s tasks to clear your mind.\n- If you’re awake and frustrated, do something calm briefly, then return to bed when sleepy.\n\nIf sleep problems continue or affect your daily life, consider talking with a counselor or health professional.`;
    case "anxiety":
    case "stress":
      return `${q}${opening}Stress and anxiety are natural responses, but they can feel heavy when they build up.\n\nWhat can help right now:\n- Name what you’re feeling and what may be contributing to it.\n- Try slow breathing (longer exhale) or grounding (notice what you can see, feel, hear).\n- Separate facts from “what if” worries.\n- Focus on one small, doable action.\n- Take a short break and reach out to someone you trust.\n\nCoping strategies can help, but different people may need different forms of support. ${studentCounselorConnectionNote()}`;
    case "panic":
      return `${q}${opening}Panic can feel very intense, but it often rises and then passes.\n\nWhat can help now:\n- Breathe slowly: inhale gently, exhale longer.\n- Use grounding (5 things you see, 4 feel, 3 hear, 2 smell, 1 taste).\n- Remind yourself: “This feels uncomfortable, but it can pass.”\n- Move to a calmer or safer space if possible.\n\nImportant: if symptoms feel new, severe, or you’re unsure if it’s a medical emergency (e.g. chest pain, fainting, trouble breathing), seek urgent medical care.`;
    case "low mood":
      return `${q}${opening}When you feel low, small and gentle steps can matter more than trying to fix everything at once.\n\nWhat can help:\n- Start with basic care (water, food, rest, or a short walk).\n- Do one small activity for comfort and one for progress.\n- Reach out to someone safe, even with a short message.\n- Be kind to yourself and notice harsh self-talk.\n\nIf low mood lasts, worsens, or affects daily life, speaking with a counselor or mental health professional can help. ${studentCounselorConnectionNote()}`;
    case "relationships":
      return `${q}${opening}Relationship challenges can affect how safe and supported you feel.\n\nWhat can help:\n- Identify what happened, how you felt, and what you need.\n- Choose a calm time to talk when possible.\n- Use “I” statements (for example: “When ___ happened, I felt ___, and I need ___”).\n- Set boundaries when needed and seek support from trusted people.\n\nIf there is abuse, threats, bullying, or you feel unsafe, prioritize safety and seek trusted support or emergency help. ${studentCounselorConnectionNote()}`;
    case "motivation":
      return `${q}${opening}Motivation often comes after starting, especially when you’re tired or stressed.\n\nWhat can help:\n- Pick one task only.\n- Start with 2–10 minutes.\n- Remove distractions and prepare what you need.\n- Use short focus blocks and breaks.\n- Restart gently if you get stuck.\n\nTry this next: do the smallest possible version of the task now.`;
    default:
      return `${q}${opening}I’m here to listen and help you think through this.\n\nA helpful way to start:\n- Identify the main concern right now.\n- Notice how it’s affecting your thoughts, feelings, or daily life.\n- Focus on what you can control today.\n- Choose one small, realistic next step.\n- Consider reaching out to someone you trust or a counselor for support.\n\nIf you’d like, tell me a bit more (only what you feel comfortable sharing), and I can give more specific guidance. ${studentCounselorConnectionNote()}`;
  }
}

function buildCounselorContent(topic: string, ctx: ReplyContext): string {
  const q = ctx.question ? `Context provided: “${shortenText(ctx.raw, 180)}”\n\n` : "";
  const topicInfo = detectTopicInfo(ctx.text);
  if (topicInfo && /what is|explain|meaning|signs|cope|manage|help/i.test(ctx.text)) {
    return `${q}${buildTopicResponse(topicInfo, ctx.mode, "counselor")}`;
  }
  switch (topic) {
    case "session planning":
      return `${q}Direct answer: Plan a flexible, student-centered session with clear priorities and safety awareness.\n\nKey steps:\n1. Briefly review prior notes, goals, risks, and follow-up tasks.\n2. Open collaboratively: ask what feels most important today.\n3. Screen for urgent concerns and adjust priorities if needed.\n4. Choose 1–2 interventions matched to the student’s needs and capacity.\n5. Close with a summary, agreed next steps, and follow-up plan.\n\nDocumentation: note concerns, interventions, response, risk considerations, and plan objectively.`;
    case "intake":
      return `${q}Direct answer: A good intake balances rapport, safety, and structured understanding.\n\nUseful areas:\n1. Presenting concern and goals.\n2. Onset, course, and impact on daily functioning.\n3. Strengths, supports, and coping strategies.\n4. Risk/safety (self-harm, harm to others, abuse/unsafe situations) as appropriate.\n5. Relevant history and expectations of support.\n6. Confidentiality, consent, and next steps.\n\nUse clear, empathic questions and follow institutional protocols.`;
    case "documentation":
      return `${q}Direct answer: Keep documentation clear, objective, and useful for continuity and safety.\n\nSuggested structure (DAP/SOAP):\n1. Data/Subjective & Objective: key reports, observations, relevant quotes.\n2. Assessment: clinical impression linked to evidence (separate from speculation).\n3. Plan: interventions, referrals, tasks, follow-up, and risk/safety actions.\n\nRecord only necessary information and follow privacy/documentation policies.`;
    case "safety":
      return `${q}Direct answer: Treat potential safety concerns promptly, calmly, and according to protocol.\n\nKey actions:\n1. Assess risk directly (ideation, intent, plan, means, timeframe, protective factors, harm to others, abuse/unsafe environment).\n2. Follow institutional emergency/risk procedures and consult/supervise as required.\n3. Collaborate on immediate safety steps and appropriate supports (within policy/consent and safeguarding obligations).\n4. Document concerns, risk formulation, actions taken, and follow-up clearly.\n\nI can help structure questions or plans, but I cannot replace direct assessment or emergency protocols.`;
    default:
      return `${q}Direct answer: Clarify the concern, consider context and safety, and choose a proportionate next step.\n\nClinical thinking prompts:\n1. What is the main concern and goal right now?\n2. What relevant context, strengths, and risks are present?\n3. Are there safety, ethical, or policy considerations?\n4. What intervention or action best fits the student’s needs?\n5. What follow-up, consultation, or documentation is needed?\n\nUse your clinical judgment, supervision, and institutional protocols for case-specific decisions.`;
  }
}

function buildAdminContent(topic: string, ctx: ReplyContext): string {
  const q = ctx.question ? `Context provided: “${shortenText(ctx.raw, 180)}”\n\n` : "";
  switch (topic) {
    case "password management":
      return `${q}Direct answer: Handle password resets securely by verifying identity, using strong temporary credentials, and sharing them through a secure channel.\n\nChecklist:\n1. Verify the requester’s identity using approved procedures.\n2. Confirm the correct account (name, email, ID, role).\n3. Set/generate a strong temporary password (existing passwords cannot be viewed because they are hashed).\n4. Share it securely and only with the intended user; avoid insecure channels.\n5. Require password change on next login if policy supports it.\n6. Review audit/activity logs if compromise is suspected.\n\nProtect privacy and document actions according to policy.`;
    case "account management":
      return `${q}Direct answer: Manage accounts using least privilege, accurate identity data, and careful verification.\n\nChecklist:\n1. Confirm authorization and the correct user/account.\n2. Assign the minimum necessary role and access.\n3. Keep required profile details accurate (including student/counselor identifiers where applicable).\n4. Apply status changes according to policy.\n5. Verify the outcome and review relevant audit logs.\n\nDo not access or share private counseling records.`;
    case "audit & security":
      return `${q}Direct answer: Review audit logs to detect unusual activity, validate it, and respond according to policy.\n\nHow to review:\n1. Filter by time, actor, action, and target.\n2. Look for anomalies (repeated failures, unexpected role changes, off-hours sensitive actions).\n3. Correlate with approved requests/tickets.\n4. Contain and escalate suspicious activity per incident procedures.\n5. Document findings while protecting sensitive data.`;
    case "reports & analytics":
      return `${q}Direct answer: Use reports to answer a specific question, validate data quality, and take safe, actionable follow-up steps.\n\nApproach:\n1. Define the metric, timeframe, and decision needed.\n2. Check filters and data completeness/consistency.\n3. Focus on trends and aggregates; avoid exposing sensitive individual information.\n4. Turn insights into operational actions and review outcomes later.`;
    default:
      return `${q}Direct answer: Handle admin tasks systematically with verification, least privilege, and privacy in mind.\n\nGeneral steps:\n1. Clarify the goal and confirm authorization/policy.\n2. Identify the correct users/resources.\n3. Make the minimum necessary change.\n4. Verify the result.\n5. Document and review logs when appropriate.\n\nShare the specific task (without secrets or private counseling data) for more precise steps.`;
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
    if (/(risk|safety|suicid|self-harm|harm|abuse|unsafe)/.test(t)) return "safety";
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
1. Assess risk directly and calmly (ideation, intent, plan, means, timeframe, past attempts, protective factors, harm to others, abuse/unsafe situation).
2. Follow your institution’s emergency/risk protocol and do not leave imminent risk unmanaged.
3. Collaborate on immediate safety steps and involve appropriate supports per policy, consent, and safeguarding obligations.
4. Document clearly: what was reported, risk formulation, actions taken, consultation, and follow-up.
5. Seek supervision/consultation promptly.

I can help you structure questions, a safety plan, or documentation in general terms, but I cannot replace direct assessment, emergency response, or clinical judgment.`;
  }
  if (role === "admin") {
    return `If anyone may be in immediate danger, treat this as an urgent safety matter.

Immediate steps:
1. Escalate now per your institution’s emergency protocol (local emergency services/on-call clinical lead). Admins should facilitate escalation, not provide clinical assessment.
2. Share only the minimum necessary information with authorized responders.
3. Protect privacy: do not access or distribute private counseling records.
4. Verify identity before any account actions and document operational steps factually.

I can help with a safe operational checklist, but I cannot respond to emergencies or guarantee anyone’s safety.`;
  }

  const intro = lang.code === "fil"
    ? "Salamat sa pagsabi nito. Seryoso ang nararamdaman mo, at mahalagang makakuha ka ng tulong mula sa isang tao ngayon."
    : lang.code === "ceb"
      ? "Salamat sa pagsulti niini. Seryoso ang imong gibati, ug importante nga makakuha ka og tabang gikan sa usa ka tawo karon."
      : "I’m really glad you told me. I’m concerned about your safety, and you deserve immediate support from a real person right now.";

  return `${intro}

What to do now:
1. If you may act on thoughts of harming yourself or someone else, or if you are in immediate danger, contact your local emergency services now, go to the nearest emergency department, or ask someone you trust to stay with you and help you get urgent care.
2. Try not to stay alone and, if you can, move away from anything you could use to hurt yourself or others.
3. Reach out to a trusted person, counselor, or crisis support service and clearly say you need help now.
4. In MindWell, open Help & Crisis for support contacts and guidance. If you are in the Philippines, you can also contact the NCMH Crisis Hotline (1553) or local emergency services (911) if available in your area.

I’m an AI assistant and I can’t provide emergency care, monitor you, or guarantee your safety—but your life and wellbeing matter, and getting human help right now is important.`;
}

function followUpsFor(role: AssistantRole, topic: string, lang: LangInfo): string[] {
  if (role === "admin") return ["Give me a short checklist", "What should I verify first?", "How do I handle this securely?"];
  if (role === "counselor") return ["Can you give an example?", "What questions should I ask?", "Make this more detailed"];
  if (lang.code === "fil") return ["Puwede mo bang gawing mas simple?", "Puwede mo bang gawing step-by-step?", "Puwede bang mas detalyado?"];
  if (lang.code === "ceb") return ["Pwede nimo himoong mas simple?", "Pwede nimo himoong step-by-step?", "Pwede bang mas detalyado?"];
  if (/sleep/.test(topic)) return ["Make this a simple nightly routine", "Give me a short answer", "When should I seek help?"];
  if (/anxiety|stress|panic|academic|burnout/.test(topic)) return ["What can I do in the next 10 minutes?", "Explain in simple words", "When should I talk to a counselor?"];
  if (/depress|low mood|lonel|grief|relationship|self-esteem|stigma/.test(topic)) return ["How can I cope right now?", "Explain in simple words", "How can a counselor help?"];
  if (/mood|assessment|screen/.test(topic)) return ["Explain this in simple words", "What patterns should I look for?", "When should I seek professional support?"];
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
      ? "Puwede mong ibahagi ang nararamdaman mo o magtanong tungkol sa mental health, stress, pag-aaral, relasyon, o coping strategies. Maaari rin kitang tulungan sa maikli, standard, o detalyadong paliwanag."
      : lang.code === "ceb"
        ? "Pwede ka magpaambit sa imong gibati o mangutana bahin sa mental health, stress, pag-eskwela, relasyon, o coping strategies. Makatabang sab ko og mubo, standard, o detalyado nga pasabot."
        : "You can share what’s on your mind or ask about mental health, stress, school concerns, relationships, or coping strategies. I can also give short, standard, or detailed explanations.";
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
    else if (instruction.action === "examples") transformed = makeDetailed(lastAssistant + "\n\nExample: Try applying one small, specific step to your situation today and notice what feels manageable.", ctx);
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
      ? "I’m the Mindwell AI Admin Assistant. I can help with accounts, roles, secure password handling, reports, audit review, and privacy/safety operations. I can explain things in simple or detailed ways, summarize, and respond in your preferred language when possible. I don’t access private counseling records and I can’t replace your organization’s policies."
      : role === "counselor"
        ? "I’m the Mindwell AI Counseling Assistant. I can help with session preparation, mental health topic explanations, intake/documentation guidance, coping strategies, communication, and safety-focused thinking. I can adjust answers to be short, standard, or detailed, explain simply, and respond in your preferred language when possible. I don’t replace clinical judgment, supervision, direct assessment, or diagnosis."
        : "I’m the Mindwell AI Assistant. I can help you understand mental health topics, talk through emotional concerns, and learn practical, responsible coping strategies. I can explain things in simple words, give short or detailed answers, and respond in the language you use when possible (including English, Filipino, and Cebuano). I’m not a replacement for a licensed mental health professional or emergency services, and I can’t diagnose conditions.";
    return { topic: "about", content: applyMode(info, ctx, instruction.action), followUps: followUpsFor(role, "about", lang), detectedLanguage: lang.code, mode: ctx.mode };
  }

  if (GREETING_PATTERN.test(normal) && !ctx.isFollowUp) {
    const greet = lang.code === "fil"
      ? "Kumusta! Nandito ako para makinig at tumulong. Puwede kang magbahagi ng nararamdaman mo o magtanong tungkol sa mental health, stress, pag-aaral, relasyon, at coping strategies. Ano ang maitutulong ko sa’yo ngayon?"
      : lang.code === "ceb"
        ? "Kumusta! Ania ko para maminaw ug motabang. Pwede ka magpaambit sa imong gibati o mangutana bahin sa mental health, stress, pag-eskwela, relasyon, ug coping strategies. Unsa may akong matabangan nimo karon?"
        : "Hello! I’m here to listen and help. You can share what you’re feeling or ask about mental health, stress, studies, relationships, and coping strategies. What would you like to talk about today?";
    return { topic: "greeting", content: greet, followUps: assistantPrompts[role].slice(0, 3), detectedLanguage: lang.code, mode: ctx.mode };
  }

  if (THANKS_PATTERN.test(normal)) {
    const msg = lang.code === "fil"
      ? "Walang anuman. Kung gusto mo, puwede pa kitang tulungan—magtanong ka lang ulit o sabihin kung gusto mo itong mas maikli, mas detalyado, o mas simple."
      : lang.code === "ceb"
        ? "Walay sapayan. Kung gusto pa ka, makatabang pa ko—pangutana lang balik o isulti kung gusto nimo kining mas mubo, mas detalyado, o mas simple."
        : "You’re welcome. If you’d like, I can keep helping—ask a follow-up, or tell me to make the answer shorter, more detailed, simpler, or translated.";
    return { topic: "acknowledgement", content: msg, followUps: followUpsFor(role, "general", lang), detectedLanguage: lang.code, mode: ctx.mode };
  }

  // Responsible mood/assessment explanation
  if (role === "student") {
    const screening = buildMoodAssessmentReply(effectiveText(raw, ctx));
    if (screening) {
      return { topic: "mood and screening", content: applyMode(screening, ctx, instruction.action), followUps: followUpsFor(role, "mood and screening", lang), detectedLanguage: lang.code, mode: ctx.mode };
    }
  }

  // Resolve effective query for follow-ups
  let effective = raw;
  if (ctx.isFollowUp && lastUser && !instruction.isControl) {
    effective = `${lastUser}\nFollow-up: ${raw}`;
  }
  const effNorm = normalise(effective);

  // Topic knowledge (all roles can ask for explanations; student gets supportive framing)
  const topicInfo = detectTopicInfo(effNorm) || detectTopicInfo(normal);
  if (topicInfo && role !== "admin") {
    let content: string;
    if (role === "student") {
      content = buildStudentResponse(topicInfo.key, topicInfo, { ...ctx, question: shortenText(effective, 200) });
    } else {
      content = `${ctx.question ? `Context provided: “${shortenText(ctx.raw, 180)}”\n\n` : ""}${buildTopicResponse(topicInfo, ctx.mode, role)}`;
    }
    content = applyMode(content, ctx, instruction.action);
    if (instruction.action === "translate_explain" && instruction.targetLanguage) content = wrapForLanguage(content, instruction.targetLanguage);
    return { topic: topicInfo.title, content, followUps: followUpsFor(role, topicInfo.key, lang), detectedLanguage: lang.code, mode: ctx.mode };
  }

  const topic = detectTopic(role, effNorm);

  let content: string;
  if (role === "admin") content = buildAdminContent(topic, ctx);
  else if (role === "counselor") content = buildCounselorContent(topic, ctx);
  else content = buildStudentResponse(topic, null, { ...ctx, question: shortenText(effective, 200), text: effNorm });

  content = applyMode(content, ctx, instruction.action);
  if (instruction.action === "translate_explain" && instruction.targetLanguage) content = wrapForLanguage(content, instruction.targetLanguage);

  return {
    topic,
    content,
    followUps: followUpsFor(role, topic, lang),
    detectedLanguage: lang.code,
    mode: ctx.mode,
  };
}

function effectiveText(raw: string, ctx: ReplyContext): string {
  if (ctx.isFollowUp && ctx.lastUserText && !parseInstruction(raw).isControl) {
    return `${ctx.lastUserText}\n${raw}`;
  }
  return raw;
}
