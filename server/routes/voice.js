/**
 * routes/voice.js
 * Full single-file voice route with improved parsing using natural, chrono-node, fuse.js
 *
 * Requires: npm install natural chrono-node fuse.js
 */

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Expense = require("../models/Expense");

// Optional User model for income/budget (savings). If absent, we degrade gracefully.
let User;
try {
  User = require("../models/User");
} catch (_) {
  /* optional */
}

// categorizationService is expected to exist
const categorizationService = require("../services/categorization");

// NLP + fuzzy libs
const natural = require("natural");
const chrono = require("chrono-node");
const Fuse = require("fuse.js");

////////////////////////////////////////////////////////////////////////
// Basic tokenizer + categories (tune with your app's real categories)
const tokenizer = new natural.WordTokenizer();
const CANONICAL_CATEGORIES = categorizationService?.getAllCategories
  ? categorizationService.getAllCategories()
  : [
      "food",
      "groceries",
      "travel",
      "transport",
      "shopping",
      "entertainment",
      "bills",
      "rent",
      "utilities",
      "health",
      "education",
      "fuel",
      "gifts",
      "other",
    ];
const fuseCategories = new Fuse(
  CANONICAL_CATEGORIES.map((c) => ({ cat: c })),
  { keys: ["cat"], threshold: 0.45 }
);

////////////////////////////////////////////////////////////////////////
// Small numbers map (English + simple Hindi words)
const SMALL_NUMBER_WORDS = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
  lakh: 100000,
  crore: 10000000,
  // Hindi basics
  ek: 1,
  do: 2,
  teen: 3,
  chaar: 4,
  paanch: 5,
  chhah: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  das: 10,
  bees: 20,
  sau: 100,
  hazaar: 1000,
  laakh: 100000,
};

function wordsToNumber(words) {
  if (!words) return null;
  const cleaned = String(words)
    .toLowerCase()
    .replace(/[,\\-]/g, " ")
    .replace(/₹/g, " rupees ")
    .replace(/\b(rs\.?|rupees?|rupay|rupaye)\b/g, " ")
    .trim();

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;

  let total = 0;
  let current = 0;
  for (const t of tokens) {
    if (/^\d+(?:\.\d+)?$/.test(t)) {
      current += Number(t);
      continue;
    }
    if (SMALL_NUMBER_WORDS[t] !== undefined) {
      const val = SMALL_NUMBER_WORDS[t];
      if (val >= 100) {
        current = current === 0 ? val : current * val;
      } else {
        current += val;
      }
      continue;
    }
    // unknown token => stop parsing
    return null;
  }

  total += current;
  return total || null;
}

function parseAmountFromText(text) {
  if (!text) return null;
  const digitMatch = text.match(
    /(?:₹|rs\.?|rupees?)?\s*([0-9]{1,3}(?:[,0-9]{0,})?(?:\.[0-9]+)?)/i
  );
  if (digitMatch) {
    const raw = digitMatch[1].replace(/,/g, "");
    const n = Number(raw);
    if (!Number.isNaN(n)) return n;
  }

  // try words -> number
  const tokens = tokenizer.tokenize(text);
  for (let len = Math.min(8, tokens.length); len >= 1; len--) {
    const cand = tokens.slice(-len).join(" ");
    const n = wordsToNumber(cand);
    if (n !== null) return n;
  }
  return null;
}

function fuzzyCategory(userCategory) {
  if (!userCategory) return { category: null, score: 1 };
  const res = fuseCategories.search(userCategory);
  if (res && res.length)
    return { category: res[0].item.cat, score: res[0].score };
  return { category: userCategory, score: 1 };
}

////////////////////////////////////////////////////////////////////////
// Language detection (Devanagari + Hinglish cues)
function detectLanguage(text) {
  if (!text || !String(text).trim()) return "en";
  const t = String(text);
  if (/[\u0900-\u097F]/.test(t)) return "hi"; // Devanagari => Hindi

  const hiWords = [
    "aaj",
    "kal",
    "kitna",
    "kharch",
    "kharcha",
    "maine",
    "rupay",
    "rupaye",
    "bacha",
    "bachat",
    "mahina",
    "mahine",
    "hafta",
    "pichhle",
    "sabse",
    "bada",
    "jodo",
    "karo",
    "kya",
    "par",
    "pe",
    "ke",
    "liye",
  ];
  const lower = t.toLowerCase();
  let count = 0;
  for (const w of hiWords)
    if (new RegExp("\\b" + w + "\\b", "i").test(lower)) count++;
  return count >= 2 ? "hi" : "en";
}

////////////////////////////////////////////////////////////////////////
// Normalizers for period/which
function normPeriod(p) {
  if (!p) return "month";
  const s = String(p).toLowerCase();
  if (/(today|aaj)/.test(s)) return "today";
  if (/(yesterday|kal)/.test(s)) return "yesterday";
  if (/(week|hafta|hafte)/.test(s)) return "week";
  if (/(year|saal)/.test(s)) return "year";
  if (/(month|mahina|mahine)/.test(s)) return "month";
  return "month";
}
function normWhich(w) {
  if (!w) return "this";
  const s = String(w).toLowerCase();
  if (/(last|pichhle|pichla|pichle)/.test(s)) return "last";
  return "this";
}

////////////////////////////////////////////////////////////////////////
// Date range helper (keeps your original logic)
function getPeriodRange(period = "month", which = "this") {
  const now = new Date();
  let start, end;

  const startOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  if (period === "today") {
    const base =
      which === "last"
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        : now;
    start = startOfDay(base);
    end = endOfDay(base);
  } else if (period === "yesterday") {
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    start = startOfDay(base);
    end = endOfDay(base);
  } else if (period === "week") {
    // Monday-Sunday
    const day = now.getDay() || 7; // 1..7, Mon=1
    const thisMon = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (day - 1)
    );
    if (which === "last") thisMon.setDate(thisMon.getDate() - 7);
    start = startOfDay(thisMon);
    end = endOfDay(
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
    );
  } else if (period === "year") {
    const year = which === "last" ? now.getFullYear() - 1 : now.getFullYear();
    start = new Date(year, 0, 1);
    end = new Date(year, 11, 31, 23, 59, 59, 999);
  } else {
    // month
    const monthOffset = which === "last" ? -1 : 0;
    const base = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    start = new Date(base.getFullYear(), base.getMonth(), 1);
    end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  return { start, end };
}

////////////////////////////////////////////////////////////////////////
// Time phrase helpers (bilingual helpers)
function timePhraseEn(period, which) {
  if (period === "today") return which === "last" ? "yesterday" : "today";
  if (period === "yesterday") return "yesterday";
  return `${which} ${period}`;
}
function timePhraseHi(period, which) {
  if (period === "today") return which === "last" ? "kal" : "aaj";
  if (period === "yesterday") return "kal";
  const whichHi = which === "last" ? "pichhle" : "is";
  const pHi =
    period === "week" ? "hafte" : period === "year" ? "saal" : "mahine";
  return `${whichHi} ${pHi}`;
}
function periodHi(period) {
  return period === "day"
    ? "din"
    : period === "week"
    ? "hafte"
    : period === "year"
    ? "saal"
    : "mahine";
}
function shortDate(d) {
  const dd = new Date(d);
  return dd.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
function fmt(n) {
  try {
    return Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  } catch {
    return n;
  }
}
function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

////////////////////////////////////////////////////////////////////////
// chrono -> period/which helper
function chronoToPeriodWhich(text) {
  const results = chrono.parse(text, new Date(), { forwardDate: true });
  if (!results || !results.length) {
    if (/\b(today|aaj)\b/i.test(text))
      return { period: "today", which: "this" };
    if (/\b(yesterday|kal)\b/i.test(text))
      return { period: "yesterday", which: "this" };
    if (/\b(last|pichhle|pichla).*\b(week|hafta|hafte)\b/i.test(text))
      return { period: "week", which: "last" };
    if (/\b(this|is).*\b(week|hafta|hafte)\b/i.test(text))
      return { period: "week", which: "this" };
    if (/\b(last|pichhle).*\b(month|mahine|mahina)\b/i.test(text))
      return { period: "month", which: "last" };
    if (/\b(this|is).*\b(month|mahine|mahina)\b/i.test(text))
      return { period: "month", which: "this" };
    if (/\b(last|pichhle).*\b(year|saal)\b/i.test(text))
      return { period: "year", which: "last" };
    if (/\b(this|is).*\b(year|saal)\b/i.test(text))
      return { period: "year", which: "this" };
    return null;
  }

  const r = results[0];
  if (r.start && r.end) {
    const s = r.start.date();
    const e = r.end.date();
    const diffDays = Math.round((e - s) / (1000 * 3600 * 24)) + 1;
    if (diffDays === 1) {
      const now = new Date();
      const which =
        s.toDateString() ===
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        ).toDateString()
          ? "this"
          : "last";
      return { period: "today", which };
    }
    if (diffDays >= 6 && diffDays <= 8)
      return { period: "week", which: "this" };
    if (diffDays >= 27 && diffDays <= 31)
      return { period: "month", which: "this" };
    return { period: "month", which: "this" };
  }

  if (r.start) {
    const dt = r.start.date();
    const now = new Date();
    const daysAgo = Math.round((now - dt) / (1000 * 3600 * 24));
    if (daysAgo === 0) return { period: "today", which: "this" };
    if (daysAgo === 1) return { period: "yesterday", which: "this" };
    if (daysAgo <= 7) return { period: "week", which: "this" };
    if (daysAgo <= 31) return { period: "month", which: "this" };
    return { period: "month", which: "this" };
  }
  return null;
}

////////////////////////////////////////////////////////////////////////
// INTENT PARSING: improved, bilingual, uses chrono + fuzzy + word-numbers
function parseVoiceCommand(transcript) {
  const raw = String(transcript || "").trim();
  const lower = raw.toLowerCase();

  // -----------------------------
  // HELPERS
  // -----------------------------
  const wordToNum = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };

  // -----------------------------
  // 1) ADD EXPENSE — Strong Hindi/Hinglish patterns
  // -----------------------------
  const addHindi = lower.match(
    /(rs|₹)?\s*(\d+)\s*(?:rs|rupay|rupaye)?\s*(?:ke|ki|mein|me|par|pe)?\s*(.+?)\s*(mein|me|par|pe)?\s*(add\s*karo|add\s*kar\s*do|jod\s*do|jodo|jod|kharch\s*kar\s*do)$/i
  );
  if (addHindi) {
    const amount = parseInt(addHindi[2], 10);
    const desc = addHindi[3].trim();
    const catMatch = fuzzyCategory(desc);
    return {
      action: "add_expense",
      data: {
        amount,
        description: desc,
        category: catMatch.category,
        confidence: 1 - (catMatch.score || 0),
      },
    };
  }

  // Generic English/Hinglish add
  if (/^(add|spent|rs|₹|\d+)/i.test(lower)) {
    const amount = parseAmountFromText(lower);
    if (amount) {
      let desc = lower
        .replace(/(?:₹|rs\.?|rupees?)\s*\d+(?:[0-9,\.]*)/i, "")
        .replace(/add|spent|for|on|jod|jodo|karo|kharch/gi, "")
        .trim();
      if (!desc) desc = "misc";
      const catMatch = fuzzyCategory(desc);
      return {
        action: "add_expense",
        data: {
          amount,
          description: desc,
          category: catMatch.category,
          confidence: 1 - (catMatch.score || 0),
        },
      };
    }
  }

  // -----------------------------
  // 2) LAST X EXPENSES
  // -----------------------------
  const lastMatch = lower.match(
    /\b(last|pichhle|pichla)\s*(\d+)\s*(expense|expenses|kharche|transactions)\b/
  );
  if (lastMatch) {
    return {
      action: "last_expenses",
      data: { limit: parseInt(lastMatch[2], 10) },
    };
  }

  // last five expenses (word numbers)
  const lastWordExp = lower.match(
    /\blast\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s+(expense|expenses|kharche|transactions)\b/
  );
  if (lastWordExp) {
    return {
      action: "last_expenses",
      data: { limit: wordToNum[lastWordExp[1]] },
    };
  }

  // -----------------------------
  // 3) Aaj / Kal total kharcha
  // -----------------------------
  if (/aaj.*kitna.*(kharch|kharcha)/i.test(lower)) {
    return {
      action: "query_spending",
      data: { category: "all", period: "today", which: "this" },
    };
  }
  if (/kal.*kitna.*(kharch|kharcha)/i.test(lower)) {
    return {
      action: "query_spending",
      data: { category: "all", period: "yesterday", which: "this" },
    };
  }

  // -----------------------------
  // 4) English short "How much on travel today"
  // -----------------------------
  const shortHowMuch = lower.match(
    /how\s+much\s+(?:i\s+spend\s+)?(?:on|for)?\s*(.+?)\s+(today|yesterday|this|last)\s*(week|month|year)?/
  );
  if (shortHowMuch) {
    return {
      action: "query_spending",
      data: {
        category: shortHowMuch[1].trim(),
        period: normPeriod(shortHowMuch[3] || shortHowMuch[2]),
        which: normWhich(shortHowMuch[2]),
      },
    };
  }

  // -----------------------------
  // 5) Hindi category queries:
  //    "is mahine food par kitna kharcha"
  // -----------------------------
  const hiTimeQuery = lower.match(
    /(is|ye|pichhle|pichla|last)\s+(mahine|mahina|month|week|hafta|hafte|year|saal)\s+(.+?)\s+(par|pe)\s+kitna/i
  );
  if (hiTimeQuery) {
    const which = /(last|pichhle|pichla)/.test(hiTimeQuery[1])
      ? "last"
      : "this";
    const period = normPeriod(hiTimeQuery[2]);
    const category = hiTimeQuery[3].trim();
    return {
      action: "query_spending",
      data: { category, period, which },
    };
  }

  // -----------------------------
  // 6) "How much on groceries last week"
  // -----------------------------
  const engCategoryQuery = lower.match(
    /how\s+much\s+(?:did\s+i\s+spend\s+)?(?:on|for)\s+(.+?)\s+(this|last)\s+(week|month|year)\b/
  );
  if (engCategoryQuery) {
    return {
      action: "query_spending",
      data: {
        category: engCategoryQuery[1].trim(),
        period: normPeriod(engCategoryQuery[3]),
        which: normWhich(engCategoryQuery[2]),
      },
    };
  }

  // -----------------------------
  // 7) Biggest expense (Hindi + English)
  // -----------------------------
  if (/highest\s+(expense|expenses)|sabse\s+bada\s+kharcha/i.test(lower)) {
    const cw = chronoToPeriodWhich(lower) || { period: "month", which: "this" };
    return {
      action: "biggest_expense",
      data: cw,
    };
  }

  // -----------------------------
  // 8) Lowest expense (English + Hindi)
  // -----------------------------
  if (/lowest\s+(expense|expenses)|sabse\s+chhota\s+kharcha/i.test(lower)) {
    const cw = chronoToPeriodWhich(lower) || { period: "month", which: "this" };
    return {
      action: "lowest_expense",
      data: cw,
    };
  }

  // -----------------------------
  // 9) Both extremes: biggest + smallest
  // -----------------------------
  if (
    /(sabse\s+bada|biggest).*?(sabse\s+chhota|smallest)/i.test(lower) ||
    /(sabse\s+chhota|smallest).*?(sabse\s+bada|biggest)/i.test(lower)
  ) {
    const cw = chronoToPeriodWhich(lower) || { period: "week", which: "this" };
    return {
      action: "both_extremes",
      data: cw,
    };
  }

  // -----------------------------
  // 10) Savings / Budget progress
  // -----------------------------
  if (
    /\bkitni\s+(saving|bachat)|maine\s+kitna\s+bacha|how\s+much\s+i\s+saved|how\s+far.*goal/i.test(
      lower
    )
  ) {
    return { action: "savings", data: { period: "month", which: "this" } };
  }

  // -----------------------------
  // If everything fails
  // -----------------------------
  return { action: "unknown", data: {} };
}


////////////////////////////////////////////////////////////////////////
// ROUTE: POST /api/voice/command
router.post("/command", auth, async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript || !String(transcript).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "No transcript provided" });
    }

    const t = String(transcript).trim();
    const lang = detectLanguage(t); // 'hi' | 'en'
    const parsed = parseVoiceCommand(t);

    switch (parsed.action) {
      case "add_expense": {
        const expense = await addExpenseFromVoice(req.user._id, parsed.data);
        const msg =
          lang === "hi"
            ? `₹${fmt(expense.amount)} ${
                expense.category
              } ke liye jod diya gaya.`
            : `Added ₹${fmt(expense.amount)} for ${expense.category}.`;
        return res.json({
          success: true,
          action: "add_expense",
          expense,
          response: msg,
          lang,
        });
      }

      case "query_spending": {
        const spendingData = await querySpending(req.user._id, parsed.data);
        const msg = generateSpendingResponse(spendingData, lang);
        return res.json({
          success: true,
          action: "query_spending",
          data: spendingData,
          response: msg,
          lang,
        });
      }

      case "get_summary": {
        const summary = await getSummary(
          req.user._id,
          parsed.data?.period || "month",
          parsed.data?.which || "this"
        );
        const msg = generateSummaryResponse(summary, lang);
        return res.json({
          success: true,
          action: "get_summary",
          data: summary,
          response: msg,
          lang,
        });
      }

      case "biggest_expense": {
        const bex = await getBiggestExpense(
          req.user._id,
          parsed.data.period,
          parsed.data.which
        );
        const msg = bex
          ? lang === "hi"
            ? `${timePhraseHi(
                parsed.data.period,
                parsed.data.which
              )} aapka sabse bada kharcha ₹${fmt(bex.amount)} ${
                bex.category
              } par hua${bex.description ? ` (${bex.description})` : ""}.`
            : `Your biggest expense ${timePhraseEn(
                parsed.data.period,
                parsed.data.which
              )} is ₹${fmt(bex.amount)} on ${bex.category}${
                bex.description ? ` (${bex.description})` : ""
              }.`
          : lang === "hi"
          ? `${timePhraseHi(
              parsed.data.period,
              parsed.data.which
            )} koi kharcha nahi mila.`
          : `No expenses found ${timePhraseEn(
              parsed.data.period,
              parsed.data.which
            )}.`;
        return res.json({
          success: true,
          action: "biggest_expense",
          data: bex,
          response: msg,
          lang,
        });
      }

      case "top_categories": {
        const tc = await getTopCategories(
          req.user._id,
          parsed.data.period,
          parsed.data.which,
          parsed.data.limit || 3
        );
        const msg = tc.length
          ? lang === "hi"
            ? `${timePhraseHi(parsed.data.period, parsed.data.which)} top ${
                tc.length
              } categories: ` +
              tc
                .map(([cat, amt], i) => `${i + 1}. ${cat} ₹${fmt(amt)}`)
                .join(", ") +
              "."
            : `Top ${tc.length} categories ${timePhraseEn(
                parsed.data.period,
                parsed.data.which
              )}: ` +
              tc
                .map(([cat, amt], i) => `${i + 1}. ${cat} ₹${fmt(amt)}`)
                .join(", ") +
              "."
          : lang === "hi"
          ? `${timePhraseHi(
              parsed.data.period,
              parsed.data.which
            )} koi spending nahi mili.`
          : `No spending found ${timePhraseEn(
              parsed.data.period,
              parsed.data.which
            )}.`;
        return res.json({
          success: true,
          action: "top_categories",
          data: tc,
          response: msg,
          lang,
        });
      }

      case "savings": {
        const sv = await getSavings(
          req.user._id,
          parsed.data.period,
          parsed.data.which
        );
        const msg = sv
          ? generateSavingsResponse(sv, lang)
          : lang === "hi"
          ? `Aapki income/budget settings nahi mili. Kripya monthly income set karein.`
          : `I couldn't find your income/budget settings. Please set your monthly income.`;
        return res.json({
          success: true,
          action: "savings",
          data: sv,
          response: msg,
          lang,
        });
      }

      case "last_expenses": {
        const list = await getRecentExpenses(
          req.user._id,
          parsed.data.limit || 5
        );
        const msg = list.length
          ? lang === "hi"
            ? `Aakhri ${list.length} kharche: ` +
              list
                .map(
                  (e) =>
                    `₹${fmt(e.amount)} ${e.category} (${shortDate(e.date)})`
                )
                .join(", ") +
              "."
            : `Last ${list.length} expenses: ` +
              list
                .map(
                  (e) =>
                    `₹${fmt(e.amount)} ${e.category} (${shortDate(e.date)})`
                )
                .join(", ") +
              "."
          : lang === "hi"
          ? `Koi recent expense nahi mila.`
          : `No recent expenses found.`;
        return res.json({
          success: true,
          action: "last_expenses",
          data: list,
          response: msg,
          lang,
        });
      }

      case "compare_periods": {
        const cmp = await comparePeriods(
          req.user._id,
          parsed.data.base,
          parsed.data.vs
        );
        const msg = generateCompareResponse(cmp, lang);
        return res.json({
          success: true,
          action: "compare_periods",
          data: cmp,
          response: msg,
          lang,
        });
      }

      case "avg_spending": {
        const avg = await getAverageSpending(
          req.user._id,
          parsed.data.period || "month"
        );
        const msg =
          lang === "hi"
            ? `${periodHi(parsed.data.period)} ka aapka ausat kharcha ₹${fmt(
                avg.average
              )} hai.`
            : `Your average ${parsed.data.period} spending is ₹${fmt(
                avg.average
              )}.`;
        return res.json({
          success: true,
          action: "avg_spending",
          data: avg,
          response: msg,
          lang,
        });
      }

      default: {
        const msg =
          lang === "hi"
            ? `Mujhe sahi samajh nahi aaya. Aise bolein:
- "200 rupay khane mein add karo"
- "Aaj maine kitna kharch kiya?"
- "Kal ka kharcha kitna tha?"
- "Is mahine ka sabse bada kharcha kya hai?"
- "Is hafte top 3 categories batao"
- "Is mahine kitni savings hui?"
- "Pichhle 5 expenses dikhao"`
            : `I didn't catch that. Try:
- "Add 200 rupees for food"
- "How much did I spend today?"
- "How much yesterday?"
- "What's my biggest expense this month?"
- "Top 3 categories this week"
- "How much did I save this month?"
- "Show my last 5 expenses"`;
        return res.json({ success: false, message: msg, lang });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

////////////////////////////////////////////////////////////////////////
// CORE DB OPS (unchanged logic, integrated)
async function addExpenseFromVoice(userId, data) {
  const { amount, description } = data;
  const category =
    data.category || categorizationService.categorize(description, amount);
  const tags = categorizationService.suggestTags
    ? categorizationService.suggestTags(description)
    : [];

  const expense = new Expense({
    user: userId,
    amount,
    category,
    description,
    tags,
    date: new Date(),
  });

  await expense.save();
  return expense;
}

async function querySpending(userId, data) {
  const { category, period = "month", which = "this" } = data;
  const { start, end } = getPeriodRange(period, which);

  let rawCategory = (category || "").trim().toLowerCase();
  let useAllCategories = !rawCategory || rawCategory === "all";

  const query = { user: userId, date: { $gte: start, $lte: end } };

  if (!useAllCategories) {
    const mapped = categorizationService.categorize
      ? categorizationService.categorize(rawCategory)
      : rawCategory;
    if (mapped && mapped !== "other") {
      query.category = mapped;
    }
  }

  const expenses = await Expense.find(query).sort({ date: -1 });
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return {
    category: useAllCategories ? "all" : query.category || rawCategory,
    period,
    which,
    total,
    count: expenses.length,
    expenses: expenses.slice(0, 5),
  };
}

async function getSummary(userId, period = "month", which = "this") {
  const { start, end } = getPeriodRange(period, which);
  const expenses = await Expense.find({
    user: userId,
    date: { $gte: start, $lte: end },
  });
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const byCategory = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }

  const topCategory =
    Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0] || null;

  return {
    period,
    which,
    total,
    count: expenses.length,
    topCategory: topCategory
      ? { name: topCategory[0], amount: topCategory[1] }
      : null,
    byCategory,
  };
}

async function getBiggestExpense(userId, period = "month", which = "this") {
  const { start, end } = getPeriodRange(period, which);
  const top = await Expense.find({
    user: userId,
    date: { $gte: start, $lte: end },
  })
    .sort({ amount: -1 })
    .limit(1);
  return top[0] || null;
}

async function getTopCategories(
  userId,
  period = "month",
  which = "this",
  limit = 3
) {
  const { start, end } = getPeriodRange(period, which);
  const expenses = await Expense.find({
    user: userId,
    date: { $gte: start, $lte: end },
  });

  const byCategory = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }

  return Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

async function getSavings(userId, period = "month", which = "this") {
  const { start, end } = getPeriodRange(period, which);
  const expenses = await Expense.find({
    user: userId,
    date: { $gte: start, $lte: end },
  });
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  let monthlyIncome = null,
    monthlyBudget = null;
  if (User) {
    const user = await User.findById(userId).lean();
    monthlyIncome = user?.monthlyIncome || null;
    monthlyBudget = user?.monthlyBudget || null;
  }

  if (!monthlyIncome && !monthlyBudget) return null;

  const baseline = monthlyIncome || monthlyBudget;

  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  let factor = 1;
  if (period === "week") factor = 7 / daysInMonth;
  else if (period === "today" || period === "yesterday")
    factor = 1 / daysInMonth;
  else if (period === "year") factor = 12;

  const effectiveIncome = baseline * factor;
  const savings = effectiveIncome - totalExpenses;

  return {
    period,
    which,
    baselineType: monthlyIncome ? "income" : "budget",
    effectiveIncome,
    totalExpenses,
    savings,
  };
}

async function getRecentExpenses(userId, limit = 5) {
  return Expense.find({ user: userId }).sort({ date: -1 }).limit(limit);
}

async function comparePeriods(userId, base, vs) {
  const { start: s1, end: e1 } = getPeriodRange(base.period, base.which);
  const { start: s2, end: e2 } = getPeriodRange(vs.period, vs.which);

  const [exp1, exp2] = await Promise.all([
    Expense.find({ user: userId, date: { $gte: s1, $lte: e1 } }),
    Expense.find({ user: userId, date: { $gte: s2, $lte: e2 } }),
  ]);

  const t1 = exp1.reduce((s, e) => s + e.amount, 0);
  const t2 = exp2.reduce((s, e) => s + e.amount, 0);

  return {
    base: {
      period: base.period,
      which: base.which,
      total: t1,
      count: exp1.length,
    },
    vs: { period: vs.period, which: vs.which, total: t2, count: exp2.length },
    diff: t1 - t2,
    pct: t2 === 0 ? null : ((t1 - t2) / t2) * 100,
  };
}

async function getAverageSpending(userId, period = "month") {
  const now = new Date();

  if (period === "day") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    const exps = await Expense.find({
      user: userId,
      date: { $gte: start, $lte: end },
    });
    const total = exps.reduce((s, e) => s + e.amount, 0);
    const days = end.getDate();
    return { period, average: total / days || 0 };
  }

  if (period === "week") {
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 56
    ); // ~8 weeks
    const exps = await Expense.find({
      user: userId,
      date: { $gte: start, $lte: now },
    });
    const total = exps.reduce((s, e) => s + e.amount, 0);
    return { period, average: total / 8 || 0 };
  }

  if (period === "year") {
    const start = new Date(now.getFullYear(), 0, 1);
    const exps = await Expense.find({
      user: userId,
      date: { $gte: start, $lte: now },
    });
    const total = exps.reduce((s, e) => s + e.amount, 0);
    const months = now.getMonth() + 1;
    return { period, average: total / months || 0 };
  }

  // month (so far)
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const exps = await Expense.find({
    user: userId,
    date: { $gte: start, $lte: now },
  });
  const total = exps.reduce((s, e) => s + e.amount, 0);
  return { period, average: total || 0 };
}

////////////////////////////////////////////////////////////////////////
// RESPONSE BUILDERS (Bilingual)
function generateSpendingResponse(data, lang = "en") {
  const { category, period, which, total, count } = data;
  const readableCat =
    category === "all" ? (lang === "hi" ? "kul" : "total") : category;

  if (count === 0) {
    return lang === "hi"
      ? `${timePhraseHi(
          period,
          which
        )} ${readableCat} par koi kharcha nahi mila.`
      : `You haven't spent anything on ${readableCat} ${timePhraseEn(
          period,
          which
        )}.`;
  }

  return lang === "hi"
    ? `${timePhraseHi(period, which)} aapne ${readableCat} par ₹${fmt(
        total
      )} kharch kiye, kul ${count} transaction${count > 1 ? "s" : ""}.`
    : `You spent ₹${fmt(total)} on ${readableCat} ${timePhraseEn(
        period,
        which
      )} across ${count} transaction${count > 1 ? "s" : ""}.`;
}

function generateSummaryResponse(summary, lang = "en") {
  const { period, which, total, count, topCategory } = summary;

  const baseEn = `${cap(timePhraseEn(period, which))}, you've spent ₹${fmt(
    total
  )} across ${count} transaction${count !== 1 ? "s" : ""}.`;
  const baseHi = `${cap(timePhraseHi(period, which))}, aapne kul ₹${fmt(
    total
  )} kharch kiye, ${count} transaction${count !== 1 ? "s" : ""}.`;

  const topEn = topCategory
    ? ` Highest category: ${topCategory.name} (₹${fmt(topCategory.amount)}).`
    : "";
  const topHi = topCategory
    ? ` Sabse zyada kharcha: ${topCategory.name} (₹${fmt(topCategory.amount)}).`
    : "";

  return lang === "hi" ? baseHi + topHi : baseEn + topEn;
}

function generateSavingsResponse(sv, lang = "en") {
  const signSaved = sv.savings >= 0;

  if (lang === "hi") {
    return `${cap(timePhraseHi(sv.period, sv.which))}, aapne ₹${fmt(
      Math.abs(sv.savings)
    )} ${signSaved ? "bachaaye" : "zyada kharch kiye"}.
(Baseline ${sv.baselineType}: ₹${fmt(sv.effectiveIncome)}, Expenses: ₹${fmt(
      sv.totalExpenses
    )}.)`;
  }

  return `${cap(timePhraseEn(sv.period, sv.which))}, you ${
    signSaved ? "saved" : "overspent by"
  } ₹${fmt(Math.abs(sv.savings))}.
(Baseline ${sv.baselineType}: ₹${fmt(sv.effectiveIncome)}, Expenses: ₹${fmt(
    sv.totalExpenses
  )}.)`;
}

function generateCompareResponse(cmp, lang = "en") {
  const { base, vs, diff, pct } = cmp;

  if (lang === "hi") {
    const aHi = timePhraseHi(base.period, base.which);
    const bHi = timePhraseHi(vs.period, vs.which);
    const trend = diff === 0 ? "barabar" : diff > 0 ? "zyada" : "kam";
    const pctStr = pct === null ? "" : ` (~${Math.round(Math.abs(pct))}%).`;
    return `${cap(aHi)} (₹${fmt(base.total)}) ${bHi} (₹${fmt(
      vs.total
    )}) se ${trend} hai. Antar: ₹${fmt(Math.abs(diff))}${pctStr}`;
  }

  const a = timePhraseEn(base.period, base.which);
  const b = timePhraseEn(vs.period, vs.which);
  const trend =
    diff === 0 ? "the same as" : diff > 0 ? "higher than" : "lower than";
  const pctStr = pct === null ? "" : ` (~${Math.round(Math.abs(pct))}%).`;

  return `${cap(a)} (₹${fmt(base.total)}) is ${trend} ${b} (₹${fmt(
    vs.total
  )}). Difference: ₹${fmt(Math.abs(diff))}${pctStr}`;
}

////////////////////////////////////////////////////////////////////////
// final export
module.exports = router;
