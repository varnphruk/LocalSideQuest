import { KNOWLEDGE_PACKS } from "./knowledge-packs";

interface GenerateOptions {
  city: string;
  duration: number;
  budget: string;
  companions: string;
  activities: string[];
  notes: string;
  activityLabels: string[];
}

export function buildPrompt(opts: GenerateOptions): string {
  const { city, duration, budget, companions, activities, notes, activityLabels } = opts;
  const cityName = city.split(",")[0].trim();

  const travelerType =
    companions === "solo" ? "solo traveler" :
    companions === "couple" ? "couple" :
    companions === "family" ? "family with children" : "group of friends";

  const budgetLabel =
    budget === "budget" ? "budget" :
    budget === "luxury" ? "luxury" : "moderate";

  const interestStr = activityLabels.length ? activityLabels.join(", ") : "general sightseeing";

  // Check for knowledge pack
  const kpKey = Object.keys(KNOWLEDGE_PACKS).find(
    (k) => k.toLowerCase() === cityName.toLowerCase()
  );
  const kp = kpKey ? KNOWLEDGE_PACKS[kpKey] : null;

  let kpSection = "";
  if (kp) {
    const placeSummary = kp.places
      .slice(0, 20)
      .map(
        (p: any) =>
          `${p.name} (${p.category}) - ${p.why_go}${p.specific_dish ? " [order: " + p.specific_dish + "]" : ""}`
      )
      .join("\n");
    const tipSummary = kp.tips
      .map((t: any) => `[${t.importance}] ${t.tip}`)
      .join("\n");
    kpSection = `

PRE-RESEARCHED LOCAL DATA FOR ${cityName.toUpperCase()}:
${placeSummary}

LOCAL TIPS:
${tipSummary}

Use this data to create the itinerary. Prioritize these real places.`;
  }

  return `You are a world-class AI travel agent. Create a ${duration}-day guide for ${city}.
TRAVELER: ${travelerType}, ${budgetLabel} budget. Interests: ${interestStr}.
${notes ? "SPECIAL REQUESTS: " + notes : ""}${kpSection}

Respond ONLY with valid JSON. No markdown, no backticks, no text outside the JSON.
{
  "title":"Creative trip title",
  "summary":"3-4 sentence overview with specific highlights",
  "cityImageSearch":"${cityName} cityscape travel",
  "travelApps":[{"name":"App","description":"Why essential - be specific","category":"transport|food|language|maps|payments"}],
  "accommodations":[{"name":"Real Hotel","area":"Neighborhood + why this area","priceRange":"$XX/night","description":"Why stay here","bookingUrl":"https://www.booking.com/searchresults.html?ss=HOTEL+${encodeURIComponent(city)}","type":"budget|mid-range|luxury"}],
  "restaurants":[{"name":"Restaurant","cuisine":"Type","priceRange":"$$","description":"EXACT dish to order and why","area":"Area","mapsUrl":"https://maps.google.com/?q=NAME+${encodeURIComponent(city)}","meal":"breakfast|lunch|dinner"}],
  "adventures":[{"name":"Experience","description":"What makes it unforgettable","duration":"Xh","priceRange":"$XX","category":"tour|class|food-tour|adventure|unique","bookingUrl":"https://www.viator.com/searchResults/all?text=NAME+${encodeURIComponent(city)}","whyBook":"1 sentence"}],
  "youtubeSearches":[{"title":"Title","searchQuery":"youtube search query","category":"overview|food|tips"}],
  "dailyItineraries":[{"day":1,"title":"Day 1: Theme","activities":[{"type":"morning|lunch|afternoon|evening","title":"Place Name","time":"9:00 AM - 11:30 AM","duration":"150 min","description":"Vivid description with insider tip","location":"Address","cost":"$XX","mapsUrl":"https://maps.google.com/?q=PLACE+${encodeURIComponent(city)}","websiteUrl":"https://site.com","imageSearchQuery":"place ${cityName}"}],"tips":["Tip 1","Tip 2","Tip 3"]}],
  "proTips":["Critical tip","Cultural tip","Transport hack","Timing tip","Scam warning"]
}
RULES: ${duration} days, 4-5 activities each. ALL real places. 3 hotels, 6+ restaurants with SPECIFIC DISHES, 4+ apps, 5+ adventures, 5 pro tips. Costs USD. Group by neighborhood.`;
}
