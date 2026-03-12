/**
 * Notification generator using smart templates.
 * Produces segments, notifications (3 languages), and image prompts.
 *
 * Content strategy:
 *  - Titles: Short, punchy, emoji-prefixed, BEHAVIOR-driven (never reference story titles)
 *  - Bodies: Create curiosity & urgency, no story names, relatable to any user
 *  - CTAs: Action-oriented, 2-3 words max
 *  - Goal: Make users TAP the notification and open the app
 *
 * Character limits: title 40, body 70, cta 18
 */

const SEGMENT_DEFS = [
  {
    key: "new_users",
    name: "New users who haven't started lessons",
    logic: "user.lessons_completed == 0 AND user.days_since_signup <= 7",
    theme: "Word of the Day",
  },
  {
    key: "started_not_finished",
    name: "Users who started but didn't finish",
    logic: "user.lessons_started > 0 AND user.current_lesson_progress < 100",
    theme: "English Challenge",
  },
  {
    key: "dormant",
    name: "Dormant users (no activity 7+ days)",
    logic: "user.days_since_last_activity >= 7",
    theme: "Unlock New Topic",
  },
  {
    key: "low_practice",
    name: "Users with less than 50% practice",
    logic: "user.practice_completion_rate < 50",
    theme: "Practice Booster",
  },
  {
    key: "inactive_3d",
    name: "Users inactive for 3 days",
    logic: "user.days_since_last_activity == 3",
    theme: "Tip of the Day",
  },
  {
    key: "inactive_7d",
    name: "Users inactive for 7 days",
    logic: "user.days_since_last_activity == 7",
    theme: "Congratulations",
  },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function truncate(str, max) {
  return str.length <= max ? str : str.slice(0, max - 1) + "\u2026";
}

/* ── WORD EXTRACTION for "Word of the Day" ─────────────────────────── */

// Curated whitelist of genuine English vocabulary words found in the stories.
// Only these words can appear as "Word of the Day" — avoids Hindi transliterations.
const GOOD_VOCAB = new Set([
  // Professional / Career
  "interview", "interviews", "interviewer", "internship",
  "presentation", "presentations", "professional", "professionally",
  "opportunity", "leadership", "promotion", "nomination",
  "conference", "candidates", "experience", "preparation",
  "performance", "colleagues", "corporate", "negotiate",
  // Communication / Social
  "conversation", "conversations", "announcement", "announcements",
  "communication", "introduction", "vocabulary", "pronunciation",
  "interruptions", "expression", "articulate",
  // Emotions / States
  "confident", "confidence", "confidently", "nervous",
  "anxiety", "excited", "hesitation", "insecurity",
  "humiliation", "determination", "frustrated", "overwhelmed",
  "uncomfortable", "embarrassed", "motivated", "discouraged",
  // Actions / Concepts
  "navigate", "explore", "discover", "accomplish",
  "survive", "survival", "challenge", "challenges",
  "decision", "heartbreak", "independence", "independent",
  "homecoming", "confrontation", "realization", "appreciation",
  "transformed", "admission", "placements", "immigration",
  "confession", "commitment", "dedication",
  // Life / Places
  "restaurant", "supermarket", "supermarkets", "neighbourhood",
  "apartment", "directions", "departure", "destination",
  // General useful vocabulary
  "backpack", "suddenly", "support", "freedom",
  "celebrate", "beautiful", "important", "different",
  "understand", "surprise", "comfortable", "stranger", "strangers",
  "functional", "behavioral", "formidable", "battlefield",
  "linguistic", "healthcare", "distracted", "scholarship",
  "perseverance", "resilience", "ambitious", "courageous",
  "sentence", "fluent", "grammar", "express",
]);

function extractFeaturedWord(story) {
  // Tier 1: Extract from English subtitle in title (guaranteed English)
  const parenMatch = (story.title || "").match(/\(([^)]+)\)/);
  if (parenMatch) {
    const engWords = (parenMatch[1].match(/\b[a-zA-Z]{5,14}\b/g) || [])
      .map((w) => w.toLowerCase())
      .filter((w) => GOOD_VOCAB.has(w));
    if (engWords.length > 0) return pick(engWords);
  }

  // Tier 2: Extract from all story text, but only whitelisted vocab words
  const text = [
    story.title || "",
    story.content || "",
    story.key_learning || "",
  ].join(" ");

  const allWords = (text.match(/\b[a-zA-Z]{5,14}\b/g) || []).map((w) => w.toLowerCase());
  const unique = [...new Set(allWords)].filter((w) => GOOD_VOCAB.has(w));

  // Pick randomly from top candidates for variety
  if (unique.length > 0) return pick(unique.slice(0, 6));

  return "fluent";
}

function buildNotifications(story, segmentKey) {
  let learning = story.key_learning || "new vocabulary";
  if (learning.length > 20) learning = "English skills";

  // Extract featured vocabulary word from story content for "Word of the Day"
  const word = extractFeaturedWord(story);
  const capWord = word.charAt(0).toUpperCase() + word.slice(1);
  const lowWord = word.toLowerCase();

  const templates = {
    /* ── NEW USERS — "Word of the Day" format ──────────────────── */
    new_users: {
      english: [
        { title: `\u{1F31F} Word of the Day: ${capWord}`, body: `Do you know what '${lowWord}' means? Learn it in a fun story!`, cta: "Learn Now" },
        { title: `\u{1F4D6} Today's Word: ${capWord}`, body: `Master '${lowWord}' and boost your English vocabulary today!`, cta: "Start Lesson" },
        { title: `\u2728 New Word: ${capWord}`, body: `See how '${lowWord}' is used in real conversations. Tap to learn!`, cta: "Try Now" },
        { title: `\u{1F393} Learn '${capWord}' Today`, body: "This word will level up your English. Discover it in a story!", cta: "Learn Now" },
      ],
      hindi: [
        { title: `\u{1F31F} \u0906\u091C \u0915\u093E \u0936\u092C\u094D\u0926: ${capWord}`, body: `\u0915\u094D\u092F\u093E \u0906\u092A '${lowWord}' \u0915\u093E \u092E\u0924\u0932\u092C \u091C\u093E\u0928\u0924\u0947 \u0939\u0948\u0902? \u0915\u0939\u093E\u0928\u0940 \u092E\u0947\u0902 \u0938\u0940\u0916\u0947\u0902!`, cta: "\u0938\u0940\u0916\u0947\u0902" },
        { title: `\u{1F4D6} \u0928\u092F\u093E \u0936\u092C\u094D\u0926: ${capWord}`, body: `'${capWord}' \u0938\u0940\u0916\u0915\u0930 \u0905\u092A\u0928\u0940 vocabulary \u092C\u0922\u093C\u093E\u090F\u0902\u0964 \u0906\u091C \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902!`, cta: "\u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902" },
        { title: `\u2728 \u0906\u091C \u092F\u0947 \u0938\u0940\u0916\u0947\u0902: ${capWord}`, body: `\u0926\u0947\u0916\u093F\u090F '${lowWord}' \u0915\u0948\u0938\u0947 \u092C\u093E\u0924\u091A\u0940\u0924 \u092E\u0947\u0902 use \u0939\u094B\u0924\u093E \u0939\u0948!`, cta: "\u0905\u092D\u0940 \u0938\u0940\u0916\u0947\u0902" },
        { title: `\u{1F393} '${capWord}' \u0938\u0940\u0916\u0947\u0902 \u0906\u091C`, body: "\u092F\u0947 word \u0906\u092A\u0915\u0940 English level up \u0915\u0930\u0947\u0917\u093E\u0964 \u0915\u0939\u093E\u0928\u0940 \u092E\u0947\u0902 \u0926\u0947\u0916\u0947\u0902!", cta: "\u0938\u0940\u0916\u0947\u0902" },
      ],
      hinglish: [
        { title: `\u{1F31F} Aaj ka Word: ${capWord}`, body: `Kya tum '${lowWord}' ka matlab jaante ho? Story mein seekho!`, cta: "Seekho" },
        { title: `\u{1F4D6} Today's Word: ${capWord}`, body: `'${capWord}' seekho aur apni vocabulary badhao. Aaj shuru karo!`, cta: "Start Karo" },
        { title: `\u2728 Naya Word: ${capWord}`, body: `Dekho '${lowWord}' real conversations mein kaise use hota hai!`, cta: "Try Karo" },
        { title: `\u{1F393} '${capWord}' seekho aaj`, body: "Ye word tumhari English level up karega. Story mein seekho!", cta: "Seekho Abhi" },
      ],
    },

    /* ── STARTED BUT DIDN'T FINISH ─────────────────────────────── */
    started_not_finished: {
      english: [
        { title: "\u23F3 You left at the best part!", body: "Just a few more minutes to finish. Don't miss what's next!", cta: "Continue" },
        { title: "\u{1F525} Don't lose your progress!", body: "You're almost done! Pick up right where you left off.", cta: "Resume Now" },
        { title: "\u26A1 So close to finishing!", body: "Your lesson is 70% done. Complete it in just 2 minutes!", cta: "Complete Now" },
        { title: "\u{1F3AC} The story isn't over yet!", body: "You stopped right before the exciting part. Come back!", cta: "See What's Next" },
      ],
      hindi: [
        { title: "\u23F3 \u0938\u092C\u0938\u0947 \u0905\u091A\u094D\u091B\u093E part \u092C\u093E\u0915\u0940 \u0939\u0948!", body: "\u092C\u0938 \u0915\u0941\u091B \u092E\u093F\u0928\u091F \u0914\u0930! \u0906\u0917\u0947 \u0915\u094D\u092F\u093E \u0939\u094B\u0924\u093E \u0939\u0948 \u0926\u0947\u0916\u093F\u090F\u0964", cta: "\u091C\u093E\u0930\u0940 \u0930\u0916\u0947\u0902" },
        { title: "\u{1F525} Progress \u092E\u0924 \u0917\u0901\u0935\u093E\u0907\u090F!", body: "\u0932\u0917\u092D\u0917 \u092A\u0942\u0930\u093E \u0939\u094B \u0917\u092F\u093E! \u091C\u0939\u093E\u0901 \u091B\u094B\u0921\u093C\u093E \u0935\u0939\u0940\u0902 \u0938\u0947 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902\u0964", cta: "\u0905\u092D\u0940 \u092A\u0942\u0930\u093E \u0915\u0930\u0947\u0902" },
        { title: "\u26A1 \u092C\u0938 \u0925\u094B\u0921\u093C\u093E \u0914\u0930 \u092C\u093E\u0915\u0940!", body: "70% complete \u0939\u094B \u091A\u0941\u0915\u093E\u0964 \u092C\u0938 2 \u092E\u093F\u0928\u091F \u0914\u0930 \u0932\u0917\u0947\u0902\u0917\u0947!", cta: "Complete \u0915\u0930\u0947\u0902" },
        { title: "\u{1F3AC} \u0915\u0939\u093E\u0928\u0940 \u0905\u092D\u0940 \u0916\u0924\u094D\u092E \u0928\u0939\u0940\u0902!", body: "\u0906\u092A exciting part \u0938\u0947 \u092A\u0939\u0932\u0947 \u0930\u0941\u0915\u0947\u0964 \u0935\u093E\u092A\u0938 \u0906\u0907\u090F!", cta: "\u0906\u0917\u0947 \u0926\u0947\u0916\u0947\u0902" },
      ],
      hinglish: [
        { title: "\u23F3 Best part abhi baaki hai!", body: "Bas kuch min aur! Aage kya hota hai miss mat karo!", cta: "Continue Karo" },
        { title: "\u{1F525} Progress mat kho!", body: "Almost done! Jahaan chhoda tha waheen se shuru karo.", cta: "Resume Karo" },
        { title: "\u26A1 Bas thoda aur baaki!", body: "70% complete ho gaya. Sirf 2 min aur lagenge!", cta: "Complete Karo" },
        { title: "\u{1F3AC} Story abhi khatam nahi!", body: "Exciting part se pehle ruk gaye. Wapas aao!", cta: "Aage Dekho" },
      ],
    },

    /* ── DORMANT ────────────────────────────────────────────────── */
    dormant: {
      english: [
        { title: "\u{1F513} New lessons just dropped!", body: "Fresh content is waiting for you. Come explore what's new!", cta: "Explore Now" },
        { title: "\u{1F381} Something new for you!", body: "New stories and lessons added just for you. Check them out!", cta: "Check It Out" },
        { title: "\u{1F195} Guess what's new?", body: "Exciting new lessons are here. One tap to start learning!", cta: "Start Again" },
        { title: "\u{1F30D} The world is learning!", body: "New content dropped while you were away. Don't miss out!", cta: "Come Back" },
      ],
      hindi: [
        { title: "\u{1F513} \u0928\u090F lessons \u0906 \u0917\u090F!", body: "\u0924\u093E\u091C\u093C\u093E content \u0906\u092A\u0915\u093E \u0907\u0902\u0924\u091C\u093C\u093E\u0930 \u0915\u0930 \u0930\u0939\u093E\u0964 \u0926\u0947\u0916\u093F\u090F \u0915\u094D\u092F\u093E \u0928\u092F\u093E \u0939\u0948!", cta: "\u0905\u092D\u0940 \u0926\u0947\u0916\u0947\u0902" },
        { title: "\u{1F381} \u0915\u0941\u091B \u0928\u092F\u093E \u0939\u0948 \u0906\u092A\u0915\u0947 \u0932\u093F\u090F!", body: "\u0928\u0908 \u0915\u0939\u093E\u0928\u093F\u092F\u093E\u0901 \u0914\u0930 lessons \u091C\u0941\u0921\u093C\u0947\u0964 \u090F\u0915 \u092C\u093E\u0930 \u0926\u0947\u0916\u093F\u090F!", cta: "\u0926\u0947\u0916\u093F\u090F" },
        { title: "\u{1F195} \u0928\u092F\u093E \u0915\u094D\u092F\u093E \u0906\u092F\u093E? \u0926\u0947\u0916\u093F\u090F!", body: "\u0930\u094B\u092E\u093E\u0902\u091A\u0915 \u0928\u090F lessons \u0906\u090F\u0964 \u090F\u0915 tap \u092E\u0947\u0902 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902!", cta: "\u092B\u093F\u0930 \u0938\u0947 \u0936\u0941\u0930\u0942" },
        { title: "\u{1F30D} \u0926\u0941\u0928\u093F\u092F\u093E \u0938\u0940\u0916 \u0930\u0939\u0940 \u0939\u0948!", body: "\u0906\u092A\u0915\u0947 \u0932\u093F\u090F \u0928\u092F\u093E content \u0906\u092F\u093E\u0964 \u092E\u093F\u0938 \u092E\u0924 \u0915\u0930\u093F\u090F!", cta: "\u0935\u093E\u092A\u0938 \u0906\u0907\u090F" },
      ],
      hinglish: [
        { title: "\u{1F513} Naye lessons aa gaye!", body: "Fresh content wait kar raha. Aao explore karo kya naya hai!", cta: "Explore Karo" },
        { title: "\u{1F381} Kuch naya hai tumhare liye!", body: "Nayi stories aur lessons add hue. Ek baar check karo!", cta: "Check Karo" },
        { title: "\u{1F195} Guess karo kya naya hai?", body: "Exciting lessons abhi aaye hain. Ek tap mein shuru karo!", cta: "Dobara Shuru" },
        { title: "\u{1F30D} Duniya seekh rahi hai!", body: "Naya content aaya jab tum door the. Miss mat karo!", cta: "Wapas Aao" },
      ],
    },

    /* ── LOW PRACTICE ──────────────────────────────────────────── */
    low_practice: {
      english: [
        { title: "\u{1F9E0} Quick quiz: Can you ace it?", body: "A 2-min practice can boost your skills. Give it a try!", cta: "Take Quiz" },
        { title: "\u{1F3AF} Beat today's challenge!", body: "Your skills need a quick boost. One round will do it!", cta: "Practice Now" },
        { title: "\u{1F4A1} 1 practice = big results", body: "Top learners practice daily. A quick round is waiting!", cta: "Start Practice" },
        { title: "\u{1F4AA} How good is your English?", body: "Test yourself in 2 minutes. You might surprise yourself!", cta: "Test Now" },
      ],
      hindi: [
        { title: "\u{1F9E0} Quick quiz: \u0915\u0930 \u0938\u0915\u0924\u0947 \u0939\u094B?", body: "2 \u092E\u093F\u0928\u091F \u0915\u0940 practice \u0938\u0947 skills \u092C\u0922\u093C\u0947\u0902\u0917\u0940\u0964 Try \u0915\u0930\u0947\u0902!", cta: "Quiz \u0932\u0947\u0902" },
        { title: "\u{1F3AF} \u0906\u091C \u0915\u093E challenge \u091C\u0940\u0924\u094B!", body: "Skills \u0915\u094B boost \u091A\u093E\u0939\u093F\u090F\u0964 \u090F\u0915 round \u0915\u093E\u092B\u093C\u0940 \u0939\u0948!", cta: "\u0905\u092D\u094D\u092F\u093E\u0938 \u0915\u0930\u0947\u0902" },
        { title: "\u{1F4A1} 1 practice = \u092C\u0921\u093C\u093E result", body: "Top learners \u0930\u094B\u091C\u093C practice \u0915\u0930\u0924\u0947 \u0939\u0948\u0902\u0964 \u0906\u092A \u092D\u0940 \u0915\u0930\u0947\u0902!", cta: "\u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902" },
        { title: "\u{1F4AA} English \u0915\u093F\u0924\u0928\u0940 \u0905\u091A\u094D\u091B\u0940 \u0939\u0948?", body: "2 \u092E\u093F\u0928\u091F \u092E\u0947\u0902 test \u0915\u0930\u0947\u0902\u0964 \u0916\u0941\u0926 \u0915\u094B surprise \u0915\u0930\u094B!", cta: "Test \u0915\u0930\u0947\u0902" },
      ],
      hinglish: [
        { title: "\u{1F9E0} Quick quiz: Kar sakte ho?", body: "2 min ki practice se skills badhegi. Ek try do!", cta: "Quiz Lo" },
        { title: "\u{1F3AF} Aaj ka challenge jeeto!", body: "Skills ko boost chahiye. Bas ek round kaafi hai!", cta: "Practice Karo" },
        { title: "\u{1F4A1} 1 practice = bada result", body: "Top learners roz practice karte. Tum bhi try karo!", cta: "Shuru Karo" },
        { title: "\u{1F4AA} Tumhari English kaisi hai?", body: "2 min mein test karo. Khud ko surprise kar sakte ho!", cta: "Test Karo" },
      ],
    },

    /* ── INACTIVE 3 DAYS ──────────────────────────────────────── */
    inactive_3d: {
      english: [
        { title: "\u23F0 3 days without English!", body: "Just 5 minutes keeps your skills sharp. Come back today!", cta: "Quick Lesson" },
        { title: "\u{1F4F1} We miss you!", body: "Your progress is saved. One quick lesson is all you need!", cta: "Resume Now" },
        { title: "\u{1F44B} Don't break your streak!", body: "3 days is a long break. Jump back in with a fun lesson!", cta: "Jump Back In" },
        { title: "\u{1F552} Just 5 minutes today?", body: "A short lesson keeps the momentum going. You've got this!", cta: "Open Lesson" },
      ],
      hindi: [
        { title: "\u23F0 3 \u0926\u093F\u0928 \u092C\u093F\u0928\u093E English!", body: "5 \u092E\u093F\u0928\u091F \u0938\u0947 skills \u092C\u0928\u0940 \u0930\u0939\u0947\u0902\u0917\u0940\u0964 \u0906\u091C \u0935\u093E\u092A\u0938 \u0906\u0907\u090F!", cta: "Quick Lesson" },
        { title: "\u{1F4F1} \u0939\u092E miss \u0915\u0930 \u0930\u0939\u0947 \u0939\u0948\u0902!", body: "Progress saved \u0939\u0948\u0964 \u092C\u0938 \u090F\u0915 quick lesson \u0915\u093E\u092B\u093C\u0940 \u0939\u0948!", cta: "\u0905\u092D\u0940 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902" },
        { title: "\u{1F44B} Streak \u092E\u0924 \u0924\u094B\u0921\u093C\u093F\u090F!", body: "3 \u0926\u093F\u0928 \u092C\u0939\u0941\u0924 \u0939\u094B \u0917\u090F\u0964 \u090F\u0915 fun lesson \u0938\u0947 \u0935\u093E\u092A\u0938 \u0906\u0907\u090F!", cta: "\u0935\u093E\u092A\u0938 \u0906\u0907\u090F" },
        { title: "\u{1F552} \u0906\u091C \u092C\u0938 5 \u092E\u093F\u0928\u091F?", body: "\u090F\u0915 \u091B\u094B\u091F\u093E lesson momentum \u092C\u0928\u093E\u090F \u0930\u0916\u0947\u0917\u093E\u0964 \u0906\u092A \u0915\u0930 \u0938\u0915\u0924\u0947!", cta: "Lesson \u0916\u094B\u0932\u0947\u0902" },
      ],
      hinglish: [
        { title: "\u23F0 3 din bina English!", body: "5 min se skills sharp rahegi. Aaj wapas aao!", cta: "Quick Lesson" },
        { title: "\u{1F4F1} Hum miss kar rahe!", body: "Progress saved hai. Ek quick lesson kaafi hai!", cta: "Abhi Shuru" },
        { title: "\u{1F44B} Streak mat todo!", body: "3 din bahut hain. Ek fun lesson se wapas aao!", cta: "Wapas Aao" },
        { title: "\u{1F552} Aaj bas 5 min de do?", body: "Chhota lesson momentum banaye rakhega. You got this!", cta: "Lesson Kholo" },
      ],
    },

    /* ── INACTIVE 7 DAYS ──────────────────────────────────────── */
    inactive_7d: {
      english: [
        { title: "\u{1F3C6} Others are leveling up!", body: "It's been a week! Don't fall behind. Restart in 2 mins!", cta: "Restart Now" },
        { title: "\u{1F31F} Your spot is still saved!", body: "7 days away but your progress is safe. Pick up today!", cta: "Continue Now" },
        { title: "\u{1F389} A fresh start awaits!", body: "It's never too late to come back. Try a fun lesson!", cta: "Start Fresh" },
        { title: "\u{1F4AA} Your English misses you!", body: "One week is too long. A quick lesson gets you back!", cta: "Come Back" },
      ],
      hindi: [
        { title: "\u{1F3C6} \u092C\u093E\u0915\u0940 \u0938\u092C \u0906\u0917\u0947 \u092C\u0922\u093C \u0930\u0939\u0947!", body: "\u090F\u0915 \u0939\u092B\u093C\u094D\u0924\u093E \u0939\u094B \u0917\u092F\u093E! \u092A\u0940\u091B\u0947 \u0928 \u0930\u0939\u0947\u0902\u0964 2 min \u092E\u0947\u0902 restart!", cta: "\u092B\u093F\u0930 \u0938\u0947 \u0936\u0941\u0930\u0942" },
        { title: "\u{1F31F} \u0906\u092A\u0915\u0940 \u091C\u0917\u0939 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0939\u0948!", body: "7 \u0926\u093F\u0928 \u0926\u0942\u0930 \u0930\u0939\u0947 \u092A\u0930 progress safe \u0939\u0948\u0964 \u0906\u091C \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902!", cta: "\u091C\u093E\u0930\u0940 \u0930\u0916\u0947\u0902" },
        { title: "\u{1F389} \u0928\u0908 \u0936\u0941\u0930\u0941\u0906\u0924 \u0915\u093E \u092E\u094C\u0915\u093E!", body: "\u0935\u093E\u092A\u0938 \u0906\u0928\u0947 \u092E\u0947\u0902 \u0926\u0947\u0930 \u0928\u0939\u0940\u0902\u0964 Fun lesson \u0938\u0947 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902!", cta: "\u0928\u092F\u093E \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902" },
        { title: "\u{1F4AA} English \u0906\u092A\u0915\u094B miss \u0915\u0930 \u0930\u0939\u0940!", body: "\u090F\u0915 \u0939\u092B\u093C\u094D\u0924\u093E \u092C\u0939\u0941\u0924 \u0939\u0948\u0964 \u090F\u0915 lesson \u0938\u0947 \u0935\u093E\u092A\u0938 \u0906\u0907\u090F!", cta: "\u0935\u093E\u092A\u0938 \u0906\u0907\u090F" },
      ],
      hinglish: [
        { title: "\u{1F3C6} Baaki sab aage badh rahe!", body: "Ek hafta ho gaya! Peeche mat raho. 2 min mein restart!", cta: "Restart Karo" },
        { title: "\u{1F31F} Tumhari jagah saved hai!", body: "7 din door the par progress safe hai. Aaj shuru karo!", cta: "Continue Karo" },
        { title: "\u{1F389} Fresh start ka mauka!", body: "Wapas aane mein der nahi. Fun lesson se shuru karo!", cta: "Fresh Start" },
        { title: "\u{1F4AA} English tumhe miss kar rahi!", body: "Ek hafta bahut hai. Ek lesson se wapas aa jao!", cta: "Wapas Aao" },
      ],
    },
  };

  // Image prompts — stored as reference for external AI image generation tools.
  // NOTE: These are NOT used by the current programmatic image generator (@napi-rs/canvas).
  const imagePrompts = {
    new_users: [
      "Purple gradient banner, 'Start Your English Journey' theme, phone illustration with SpeakX branding, motivational, Gilroy font, modern flat design, 984x360",
      "Clean purple learning app banner, new user welcome, smartphone and play button illustration, 984x360",
    ],
    started_not_finished: [
      "Dark red gradient banner, 'Don't Stop Now' theme, progress checklist illustration, urgent motivational feel, Gilroy font, 984x360",
      "Crimson challenge banner showing progress, LIVE badge, checklist with target illustration, 984x360",
    ],
    dormant: [
      "Light green/mint gradient banner, 'New Lessons Unlocked' theme, lock-unlock illustration, fresh start mood, Gilroy font, 984x360",
      "Welcoming green banner, new content unlocked, nature-fresh colors, sparkle accents, 984x360",
    ],
    low_practice: [
      "Deep indigo gradient banner, 'Test Your Skills' theme, lightbulb illustration, challenge mood, Gilroy font, 984x360",
      "Dark blue quiz/challenge banner, energetic mood, lightbulb visual, bright yellow accent, 984x360",
    ],
    inactive_3d: [
      "Bright yellow gradient banner, 'Don't Break Your Streak' theme, pencil illustration, cheerful reminder, Gilroy font, 984x360",
      "Golden daily practice banner, writing/practice theme, warm encouraging mood, 984x360",
    ],
    inactive_7d: [
      "Dark brown/gold split banner, 'Welcome Back Champion' theme, trophy illustration, triumphant mood, Gilroy font, 984x360",
      "Gold achievement banner, comeback energy, trophy/rank theme, city skyline silhouette, 984x360",
    ],
  };

  const tpl = templates[segmentKey];
  if (!tpl) return [];

  const result = [];
  for (const lang of ["English", "Hindi", "Hinglish"]) {
    const langKey = lang.toLowerCase();
    const options = tpl[langKey] || tpl.english;
    const chosen = pick(options);
    result.push({
      language: lang,
      title: truncate(chosen.title, 40),
      body: truncate(chosen.body, 70),
      cta: truncate(chosen.cta, 18),
      image_prompt: pick(imagePrompts[segmentKey] || imagePrompts.new_users),
    });
  }

  return result;
}

/**
 * Generate segments + notifications for a story.
 */
export function generateForStory(story) {
  const segments = SEGMENT_DEFS.map((seg) => ({
    segment_name: seg.name,
    logic: seg.logic,
    notifications: buildNotifications(story, seg.key),
  }));

  return { segments };
}

export { SEGMENT_DEFS };
