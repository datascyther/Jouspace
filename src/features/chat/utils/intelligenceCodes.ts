/**
 * Intelligence Code Generator
 *
 * Analyzes user messages to generate personalized, relevant intelligence codes
 * that appear while the AI is thinking. These codes feel genuine, minimal,
 * generous, kind, and humble - reflecting the user's intent and emotions.
 */

export interface IntelligenceCode {
  code: string;
  description: string;
}

/**
 * Intelligence code templates organized by user intent/emotion
 */
const CODE_TEMPLATES: Record<string, IntelligenceCode[]> = {
  // Anxiety & Stress
  anxiety: [
    { code: 'CALM_03', description: 'Finding peace within' },
    { code: 'BREATHE_47', description: 'Centering your breath' },
    { code: 'SAFE_12', description: 'You are safe here' },
    { code: 'GROUND_89', description: 'Rooting in the present' },
    { code: 'WAVE_21', description: 'Riding the waves gently' },
  ],

  // Depression & Sadness
  depression: [
    { code: 'LIGHT_15', description: 'A gentle spark remains' },
    { code: 'HOPE_08', description: 'Tomorrow holds possibility' },
    { code: 'CARE_34', description: 'You matter deeply' },
    { code: 'REST_56', description: 'It is okay to rest' },
    { code: 'RISE_67', description: 'In your own time' },
  ],

  // Overwhelm & Burnout
  overwhelm: [
    { code: 'PACE_29', description: 'Slowing down together' },
    { code: 'SPACE_41', description: 'Making room for you' },
    { code: 'FOCUS_73', description: 'One moment at a time' },
    { code: 'BREATHE_92', description: 'Returning to center' },
    { code: 'RESET_16', description: 'A fresh perspective' },
  ],

  // Self-Discovery & Growth
  growth: [
    { code: 'BLOOM_45', description: 'Unfolding at your pace' },
    { code: 'LEARN_23', description: 'Every step is progress' },
    { code: 'GROW_67', description: 'You are evolving' },
    { code: 'DISCOVER_51', description: 'Exploring within' },
    { code: 'BECOME_89', description: 'Your journey continues' },
  ],

  // Gratitude & Joy
  gratitude: [
    { code: 'GIFT_19', description: 'Appreciating the moment' },
    { code: 'SHINE_34', description: 'Your light radiates' },
    { code: 'JOY_57', description: 'Celebrating with you' },
    { code: 'THANK_72', description: 'Honoring what matters' },
    { code: 'BRIGHT_88', description: 'Embracing the good' },
  ],

  // Relationship & Connection
  relationship: [
    { code: 'CONNECT_22', description: 'Building bridges' },
    { code: 'HEAR_46', description: 'Listening with care' },
    { code: 'UNDERSTAND_63', description: 'Seeing your perspective' },
    { code: 'TRUST_81', description: 'Fostering safety' },
    { code: 'BOND_95', description: 'Strengthening ties' },
  ],

  // Decision Making
  decision: [
    { code: 'CLARITY_18', description: 'Finding your way' },
    { code: 'CHOOSE_39', description: 'Trusting your heart' },
    { code: 'PATH_54', description: 'Your path is yours' },
    { code: 'TRUST_77', description: 'Believing in yourself' },
    { code: 'STEP_93', description: 'Moving forward gently' },
  ],

  // Sleep & Rest
  sleep: [
    { code: 'REST_14', description: 'Embracing stillness' },
    { code: 'DREAM_37', description: 'Peaceful nights ahead' },
    { code: 'SLEEP_52', description: 'Letting go gently' },
    { code: 'QUIET_68', description: 'Finding tranquility' },
    { code: 'RENEW_84', description: 'Morning will come' },
  ],

  // General Wellness
  wellness: [
    { code: 'BALANCE_26', description: 'Harmony within' },
    { code: 'CARE_41', description: 'Nurturing yourself' },
    { code: 'FLOW_58', description: 'Natural rhythm' },
    { code: 'PEACE_73', description: 'Inner calm' },
    { code: 'WHOLE_91', description: 'You are complete' },
  ],

  // Support & Encouragement
  support: [
    { code: 'WITH_17', description: 'I am here with you' },
    { code: 'STAND_33', description: 'Standing beside you' },
    { code: 'HEAR_49', description: 'Your voice matters' },
    { code: 'LIFT_65', description: 'Elevating your spirit' },
    { code: 'CARRY_82', description: 'Sharing the weight' },
  ],

  // Curiosity & Learning
  curiosity: [
    { code: 'WONDER_21', description: 'Exploring possibilities' },
    { code: 'ASK_44', description: 'Questions are welcome' },
    { code: 'SEEK_59', description: 'Seeking understanding' },
    { code: 'FIND_76', description: 'Discovering together' },
    { code: 'LEARN_94', description: 'Growing through curiosity' },
  ],

  // Anger & Frustration
  anger: [
    { code: 'COOL_19', description: 'Cooling the heat' },
    { code: 'RELEASE_36', description: 'Letting it flow' },
    { code: 'CALM_53', description: 'Finding stillness' },
    { code: 'UNDERSTAND_71', description: 'Understanding the fire' },
    { code: 'TRANSFORM_88', description: 'Channeling energy' },
  ],

  // Fear & Worry
  fear: [
    { code: 'BRAVE_24', description: 'Courage within you' },
    { code: 'FACE_42', description: 'Facing together' },
    { code: 'SAFE_61', description: 'You are protected' },
    { code: 'TRUST_78', description: 'Trusting the process' },
    { code: 'BEYOND_96', description: 'Moving through fear' },
  ],

  // Loneliness
  loneliness: [
    { code: 'CONNECT_20', description: 'You are not alone' },
    { code: 'PRESENCE_38', description: 'Feeling connected' },
    { code: 'BELONG_55', description: 'You belong here' },
    { code: 'COMPANY_72', description: 'Company in spirit' },
    { code: 'TOGETHER_89', description: 'Walking with you' },
  ],

  // Motivation & Goals
  motivation: [
    { code: 'MOVE_23', description: 'Taking the first step' },
    { code: 'DREAM_45', description: 'Chasing what matters' },
    { code: 'ACT_61', description: 'Turning intent to action' },
    { code: 'REACH_79', description: 'Stretching toward goals' },
    { code: 'ACHIEVE_95', description: 'Your potential awaits' },
  ],

  // Mindfulness & Presence
  mindfulness: [
    { code: 'NOW_18', description: 'This moment matters' },
    { code: 'HERE_35', description: 'Right where you are' },
    { code: 'BREATHE_52', description: 'One breath at a time' },
    { code: 'NOTICE_69', description: 'Observing gently' },
    { code: 'BE_86', description: 'Simply being' },
  ],

  // Forgiveness
  forgiveness: [
    { code: 'LET_22', description: 'Letting go gently' },
    { code: 'HEAL_41', description: 'Healing hearts' },
    { code: 'FORGIVE_58', description: 'Forgiving yourself' },
    { code: 'RELEASE_75', description: 'Releasing the weight' },
    { code: 'PEACE_92', description: 'Finding peace' },
  ],

  // Creativity & Expression
  creativity: [
    { code: 'CREATE_25', description: 'Expressing your truth' },
    { code: 'IMAGINE_43', description: 'Dreaming freely' },
    { code: 'MAKE_60', description: 'Bringing ideas to life' },
    { code: 'ART_77', description: 'Your unique expression' },
    { code: 'FLOW_94', description: 'Creative energy flowing' },
  ],

  // Confidence & Self-Worth
  confidence: [
    { code: 'BELIEVE_27', description: 'Believing in yourself' },
    { code: 'STRONG_44', description: 'Your inner strength' },
    { code: 'WORTH_61', description: 'You are worthy' },
    { code: 'STAND_78', description: 'Standing tall' },
    { code: 'SHINE_95', description: 'Your authentic self' },
  ],

  // Change & Transition
  change: [
    { code: 'ADAPT_21', description: 'Embracing change' },
    { code: 'FLOW_39', description: 'Going with the flow' },
    { code: 'NEW_56', description: 'New beginnings' },
    { code: 'GROW_73', description: 'Growing through change' },
    { code: 'BECOME_90', description: 'Becoming more you' },
  ],

  // Default / General
  general: [
    { code: 'LISTEN_19', description: 'Hearing you fully' },
    { code: 'UNDERSTAND_34', description: 'Understanding deeply' },
    { code: 'CARE_51', description: 'Caring about you' },
    { code: 'SUPPORT_68', description: 'Here to support' },
    { code: 'CONNECT_85', description: 'Connecting with meaning' },
  ],
};

/**
 * Keywords associated with each intent category
 */
const KEYWORD_MAP: Record<string, string[]> = {
  anxiety: ['anxious', 'anxiety', 'nervous', 'worried', 'panic', 'scared', 'fear', 'tense', 'uneasy'],
  depression: ['depressed', 'sad', 'down', 'hopeless', 'empty', 'numb', 'low', 'unhappy', 'blue'],
  overwhelm: ['overwhelmed', 'too much', 'cant handle', 'stressed', 'burnout', 'exhausted', 'tired', 'busy'],
  growth: ['grow', 'improve', 'better', 'develop', 'learn', 'progress', 'change', 'evolve', 'become'],
  gratitude: ['grateful', 'thankful', 'appreciate', 'blessed', 'happy', 'joy', 'celebrate', 'good'],
  relationship: ['relationship', 'partner', 'friend', 'family', 'love', 'connect', 'communication', 'trust'],
  decision: ['decide', 'decision', 'choose', 'choice', 'should i', 'what to do', 'unsure', 'confused'],
  sleep: ['sleep', 'insomnia', 'tired', 'rest', 'night', 'dream', 'awake', 'cant sleep'],
  wellness: ['wellness', 'health', 'well-being', 'balance', 'self-care', 'routine', 'healthy'],
  support: ['help', 'support', 'need', 'alone', 'struggling', 'hard', 'difficult', 'challenge'],
  curiosity: ['curious', 'wonder', 'question', 'learn', 'understand', 'explore', 'discover', 'know'],
  anger: ['angry', 'mad', 'furious', 'frustrated', 'irritated', 'upset', 'rage', 'annoyed'],
  fear: ['afraid', 'fear', 'scared', 'terrified', 'phobia', 'worry', 'concern', 'dread'],
  loneliness: ['lonely', 'alone', 'isolated', 'no one', 'disconnect', 'solitude', 'empty'],
  motivation: ['motivate', 'motivation', 'goal', 'inspire', 'drive', 'push', 'encourage', 'ambition'],
  mindfulness: ['mindful', 'meditate', 'present', 'now', 'aware', 'conscious', 'focus', 'breathe'],
  forgiveness: ['forgive', 'forgiveness', 'let go', 'release', 'sorry', 'apologize', 'accept'],
  creativity: ['creative', 'create', 'art', 'express', 'imagine', 'invent', 'design', 'make'],
  confidence: ['confident', 'confidence', 'believe', 'worth', 'capable', 'strong', 'empowered'],
  change: ['change', 'transition', 'new', 'different', 'shift', 'transform', 'adapt', 'adjust'],
};

/**
 * Analyzes user message to determine intent and returns appropriate intelligence code
 */
export function generateIntelligenceCode(userMessage: string): IntelligenceCode {
  const lowerMessage = userMessage.toLowerCase();

  // Find matching intent based on keywords
  let matchedIntent = 'general';
  let maxMatches = 0;

  for (const [intent, keywords] of Object.entries(KEYWORD_MAP)) {
    const matches = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      matchedIntent = intent;
    }
  }

  // Get codes for matched intent
  const codes = CODE_TEMPLATES[matchedIntent] || CODE_TEMPLATES.general;

  // Select random code from the matched category
  const randomIndex = Math.floor(Math.random() * codes.length);
  return codes[randomIndex];
}

/**
 * Generates a sequence of intelligence codes for extended thinking periods
 */
export function generateIntelligenceCodeSequence(userMessage: string, count: number = 3): IntelligenceCode[] {
  const codes: IntelligenceCode[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < count; i++) {
    let code: IntelligenceCode;
    let attempts = 0;

    do {
      code = generateIntelligenceCode(userMessage);
      attempts++;
    } while (seen.has(code.code) && attempts < 10);

    if (!seen.has(code.code)) {
      seen.add(code.code);
      codes.push(code);
    }
  }

  return codes;
}
