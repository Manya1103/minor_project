/* ===========================
   routes/voice.js  — PART 1/2
   =========================== */

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Expense = require("../models/Expense");
const categorizationService = require("../services/categorization");

// Optional: User model for income/budget (savings). If absent, we degrade gracefully.
let User;
try {
  User = require("../models/User");
} catch (_) {
  /* optional */
}

/* =========================================================================
   POST /api/voice/command  —  Main entrypoint (bilingual + natural Hindi)
   ========================================================================= */
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

    // NOTE: The handler functions referenced below are defined in PART 2.
    switch (parsed.action) {
      case "add_expense": {
        const expense = await addExpenseFromVoice(req.user._id, parsed.data);
        const msg =
          lang === "hi"
            ? `₹${fmt(expense.amount)} ${expense.category
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
            )} aapka sabse bada kharcha ₹${fmt(bex.amount)} ${bex.category
            } par hua${bex.description ? ` (${bex.description})` : ""}.`
            : `Your biggest expense ${timePhraseEn(
              parsed.data.period,
              parsed.data.which
            )} is ₹${fmt(bex.amount)} on ${bex.category}${bex.description ? ` (${bex.description})` : ""
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
            ? `${timePhraseHi(parsed.data.period, parsed.data.which)} top ${tc.length
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

/* =========================================================================
   LANGUAGE DETECTION — robust for Hinglish + Devanagari
   ========================================================================= */
function detectLanguage(text) {
  const dev = /[\u0900-\u097F]/.test(text); // Devanagari
  // Common Hinglish/Hindi cues (case-insensitive)
  const hiHints =
    /(aaj|kal|kitna|kharch|kharcha|maine|rupay|rupaye|bacha|saving|mahina|mahine|hafta|saal|pichhle|is|sabse|bada|jodo|karo|mein|me|par|pe)/i.test(
      text
    );
  return dev || hiHints ? "hi" : "en";
}

/* =========================================================================
   INTENT PARSING — Natural Hindi + English (no default “utilities”)
   ========================================================================= */
function parseVoiceCommand(transcript) {
  const lower = transcript.toLowerCase().trim();

  /* ✅ 1. Add Expense (Hindi + English + Hinglish) */
  const addPatterns = [
    /add\s+(?:rs\.?|rupees?)?\s*(\d+)\s+(?:for|to|in|on)\s+(.+)/i,
    /spent\s+(?:rs\.?|rupees?)?\s*(\d+)\s+(?:on|for)\s+(.+)/i,
    /(\d+)\s*(?:rs|rupees?|rupay|rupaye)?\s*(?:add\s*karo|kharch\s*kar\s*do|jod(?:o|do))\s*(?:for|on|ke\s*liye|mein|me|par|pe)?\s+(.+)/i,
    /(.+)\s+(?:ke\s*liye|mein|me|par|pe)\s*(\d+)\s*(?:rs|rupees?|rupay|rupaye)?\s*(?:add\s*karo|jodo|kharch\s*kar\s*do)?/i,
  ];
  for (const p of addPatterns) {
    const m = lower.match(p);
    if (m) {
      const amount = isNaN(m[1]) ? parseInt(m[2]) : parseInt(m[1]);
      const description = (isNaN(m[1]) ? m[1] : m[2]).trim();
      return { action: "add_expense", data: { amount, description } };
    }
  }

  /* ✅ 2. Aaj / Kal + Category Based */
  const dailyCategoryMatch = lower.match(
    /(aaj|kal)\s+(.+?)\s+(par|pe|per)\s+kitna\s+(kharch|kharcha|spend)\s+(hua|kiya)/i
  );
  if (dailyCategoryMatch) {
    return {
      action: "query_spending",
      data: {
        category: dailyCategoryMatch[2].trim(),
        period: dailyCategoryMatch[1] === "kal" ? "yesterday" : "today",
        which: "this",
      },
    };
  }

  /* ✅ 3. Aaj Kul Kharcha (No Category) */
  if (/aaj\s+(maine\s+)?kitna\s+(kharch|kharcha|spend)\s+kiya/.test(lower)) {
    return {
      action: "query_spending",
      data: { category: "all", period: "today", which: "this" },
    };
  }
  if (/kal\s+(maine\s+)?kitna\s+(kharch|spend)\s+(hua|kiya)/.test(lower)) {
    return {
      action: "query_spending",
      data: { category: "all", period: "yesterday", which: "this" },
    };
  }

  /* ✅ 4. Is Mahine / Hafte / Saal Ka Total Kharcha */
  if (
    /is\s+mahine\s+(mera\s+)?total\s+(kharcha|expense|spending)\s+kitna/.test(
      lower
    )
  ) {
    return { action: "get_summary", data: { period: "month", which: "this" } };
  }
  if (/is\s+hafte\s+kitna\s+(kharch|spend)/.test(lower)) {
    return {
      action: "query_spending",
      data: { category: "all", period: "week", which: "this" },
    };
  }
  if (/is\s+saal\s+kitna\s+(kharch|spend)/.test(lower)) {
    return {
      action: "query_spending",
      data: { category: "all", period: "year", which: "this" },
    };
  }

  /* ✅ 5. Category + Month/Week/Year */
  const catTime = lower.match(
    /(.+?)\s+(par|pe)\s+kitna\s+(kharcha|spend)\s+(?:hua|kiya)\s+(?:is|last|pichhle)?\s*(mahine|week|hafte|saal)?/i
  );
  if (catTime) {
    return {
      action: "query_spending",
      data: {
        category: catTime[1].trim(),
        period:
          catTime[4] === "haftे" || catTime[4] === "week"
            ? "week"
            : catTime[4] === "saal"
              ? "year"
              : "month",
        which: /pichhle|last/.test(lower) ? "last" : "this",
      },
    };
  }

  /* ✅ 6. Biggest Expense */
  if (/sabse\s+bada\s+kharcha|biggest\s+expense/i.test(lower)) {
    return {
      action: "biggest_expense",
      data: { period: "month", which: "this" },
    };
  }

  /* ✅ 7. Savings */
  if (/kitni\s+(saving|bachat)|maine\s+kitna\s+bacha/i.test(lower)) {
    return { action: "savings", data: { period: "month", which: "this" } };
  }

  /* ✅ 8. Last X Expenses (like "pichhle 5 expenses", "last 3 expenses") */
  const lastExpMatch = lower.match(/(?:pichhle|:last)\s+(\d+)\s+expenses?/i);
  if (lastExpMatch) {
    return {
      action: "last_expenses",
      data: { limit: parseInt(lastExpMatch[1], 10) },
    };
  }

  /* ✅ 9. English "How much did I spend on food this week?" */
  const engQuery = lower.match(
    /how\s+much\s+did\s+i\s+spend\s+(?:on\s+)?(.+?)\s+(this|last)\s+(week|month|year)/i
  );
  if (engQuery) {
    return {
      action: "query_spending",
      data: {
        category: engQuery[1].trim(),
        period: engQuery[3],
        which: engQuery[2] === "last" ? "last" : "this",
      },
    };
  }

  /* ✅ 10. If nothing matched → Unknown */
  return { action: "unknown", data: {} };
}

/* =========================================================================
   NORMALIZATION HELPERS
   ========================================================================= */
function normPeriod(p) {
  if (!p) return "month";
  p = p.toLowerCase();
  if (/(today|aaj)/.test(p)) return "today";
  if (/(yesterday|kal)/.test(p)) return "yesterday";
  if (/(week|hafta)/.test(p)) return "week";
  if (/(year|saal)/.test(p)) return "year";
  return "month"; // month | mahina | mahine
}
function normWhich(w) {
  if (!w) return "this";
  w = w.toLowerCase();
  if (/(last|pichhle)/.test(w)) return "last";
  return "this"; // this | is
}

/* =========================================================================
   DATE & PHRASE HELPERS
   ========================================================================= */
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

/* ===========================
   END OF PART 1/2
   (Next: DB ops + responses)
   =========================== */

module.exports = router; // <- temporary export to avoid linter errors in this part
// NOTE: In PART 2 we will REPLACE this export with the actual final export.

/* ===========================
   routes/voice.js  — PART 2/2
   (DB ops + response builders + final export)
   =========================== */

/* ========================================================================
   CORE DB OPS
   ======================================================================== */
async function addExpenseFromVoice(userId, data) {
  const { amount, description } = data;
  const category = categorizationService.categorize(description, amount);
  const tags = categorizationService.suggestTags(description);

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

  // 👇 If user did NOT mention any category → search ALL
  let rawCategory = (category || "").trim().toLowerCase();
  let useAllCategories = !rawCategory || rawCategory === "all";

  const query = {
    user: userId,
    date: { $gte: start, $lte: end },
  };

  // ✅ Only apply category if user clearly said something like "food", "travel", "shopping"
  if (!useAllCategories) {
    const mapped = categorizationService.categorize(rawCategory);
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

  // Simple proration from monthly baseline
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

/* ========================================================================
   RESPONSE BUILDERS (Bilingual)
   ======================================================================== */
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

  return `${cap(timePhraseEn(sv.period, sv.which))}, you ${signSaved ? "saved" : "overspent by"
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

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/* ========================================================================
   FINAL EXPORT
   ======================================================================== */
module.exports = router;
