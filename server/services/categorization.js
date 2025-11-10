const natural = require("natural");
const compromise = require("compromise");

// Category mappings with semantic understanding
const categoryMappings = {
  rent: [
    "rent",
    "apartment",
    "housing",
    "lease",
    "landlord",
    "accommodation",
    "flat",
    "house",
    "pg",
    "hostel",
  ],
  food: [
    "food",
    "restaurant",
    "meal",
    "breakfast",
    "lunch",
    "dinner",
    "grocery",
    "groceries",
    "vegetables",
    "fruits",
    "meat",
    "cafe",
    "bakery",
    "pizza",
    "burger",
    "swiggy",
    "zomato",
    "dominos",
    "mcdonald",
    "kfc",
    "dining",
  ],
  transport: [
    "transport",
    "uber",
    "ola",
    "taxi",
    "cab",
    "bus",
    "metro",
    "train",
    "fuel",
    "petrol",
    "diesel",
    "gas",
    "parking",
    "toll",
    "auto",
    "rickshaw",
    "rapido",
    "gasoline",
  ],
  utilities: [
    "electricity",
    "water",
    "gas",
    "internet",
    "wifi",
    "phone",
    "mobile",
    "broadband",
    "airtel",
    "jio",
    "vi",
    "bill",
    "recharge",
  ],
  entertainment: [
    "movie",
    "cinema",
    "netflix",
    "spotify",
    "amazon prime",
    "hotstar",
    "gaming",
    "game",
    "concert",
    "show",
    "entertainment",
    "subscription",
    "theatre",
  ],
  healthcare: [
    "hospital",
    "doctor",
    "medical",
    "medicine",
    "pharmacy",
    "clinic",
    "health",
    "emergency",
    "surgery",
    "checkup",
    "lab",
    "test",
    "dentist",
    "apollo",
    "max",
  ],
  shopping: [
    "shopping",
    "clothes",
    "jewelery",
    "shoes",
    "amazon",
    "flipkart",
    "myntra",
    "ajio",
    "mall",
    "store",
    "electronics",
    "gadget",
    "phone",
    "laptop",
  ],
  education: [
    "education",
    "school",
    "college",
    "university",
    "course",
    "book",
    "tuition",
    "fee",
    "coursera",
    "udemy",
    "study",
  ],
  travel: [
    "travel",
    "vacation",
    "holiday",
    "hotel",
    "flight",
    "booking",
    "makemytrip",
    "goibibo",
    "trip",
    "tourism",
  ],
  celebration: [
    "celebration",
    "birthday",
    "wedding",
    "anniversary",
    "party",
    "gift",
    "festival",
    "diwali",
    "holi",
    "christmas",
    "eid",
  ],
  emergency: ["emergency", "urgent", "accident", "repair", "fix", "breakdown"],
  personal: [
    "personal",
    "care",
    "salon",
    "spa",
    "grooming",
    "haircut",
    "cosmetic",
  ],
  other: ["other", "miscellaneous", "misc"],
};

class SmartCategorizationService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.TfIdf = new natural.TfIdf();

    // Build TF-IDF model
    Object.entries(categoryMappings).forEach(([category, keywords]) => {
      this.TfIdf.addDocument(keywords.join(" "));
    });
  }

  /**
   * Categorize expense using NLP and ML techniques
   */
  categorize(text, amount = 0) {
    if (!text) return "other";

    const normalizedText = text.toLowerCase().trim();
    const doc = compromise(normalizedText);

    // Extract entities and context
    const places = doc.places().out("array");
    const nouns = doc.nouns().out("array");
    const verbs = doc.verbs().out("array");

    // Tokenize and stem
    const tokens = this.tokenizer.tokenize(normalizedText);
    const stemmedTokens = tokens.map((token) => this.stemmer.stem(token));

    // Score-based categorization
    const scores = {};

    for (const [category, keywords] of Object.entries(categoryMappings)) {
      let score = 0;

      // Direct keyword matching (highest weight)
      keywords.forEach((keyword) => {
        if (normalizedText.includes(keyword)) {
          score += 10;
        }
      });

      // Stemmed token matching
      const stemmedKeywords = keywords.map((kw) => this.stemmer.stem(kw));
      stemmedTokens.forEach((token) => {
        if (stemmedKeywords.includes(token)) {
          score += 5;
        }
      });

      // Entity-based scoring
      if (
        places.length > 0 &&
        ["rent", "travel", "shopping"].includes(category)
      ) {
        score += 3;
      }

      // Amount-based heuristics
      if (category === "rent" && amount > 5000) score += 5;
      if (category === "food" && amount < 1000) score += 2;
      if (category === "utilities" && amount < 5000) score += 3;
      if (category === "emergency" && amount > 10000) score += 4;

      scores[category] = score;
    }

    // Find category with highest score
    const bestCategory = Object.entries(scores).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];

    return scores[bestCategory] > 0 ? bestCategory : "other";
  }

  /**
   * Extract category from vendor name using pattern matching
   */
  extractFromVendor(vendor) {
    if (!vendor) return null;
    return this.categorize(vendor);
  }

  /**
   * Learn from user corrections
   */
  learnFromCorrection(text, correctCategory, keywords = []) {
    if (correctCategory && categoryMappings[correctCategory]) {
      const newKeywords = [...new Set([...keywords, text.toLowerCase()])];
      categoryMappings[correctCategory].push(...newKeywords);
    }
  }

  /**
   * Get suggested tags based on text
   */
  suggestTags(text) {
    const doc = compromise(text);
    const tags = [...doc.topics().out("array"), ...doc.nouns().out("array")];
    return [...new Set(tags)].slice(0, 5);
  }
}

module.exports = new SmartCategorizationService();
