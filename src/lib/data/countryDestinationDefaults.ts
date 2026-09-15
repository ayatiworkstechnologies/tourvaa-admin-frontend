import { CountryDestinationInfo } from "../types/countryDestination";

function toF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

// ─── 1. INDIA ────────────────────────────────────────────────────────────────
const INDIA_DEFAULT: CountryDestinationInfo = {
  country_id: 3,
  country_name: "India",
  country_slug: "india",
  country_code: "IN",
  tagline: "A Land of Timeless Heritage, Sacred Rivers & Vibrant Cultures",
  hero_title: "India Destination Guide",
  hero_subtitle: "From the snow-dusted Himalayas and majestic Rajasthani palaces to the serene Kerala backwaters and sacred banks of Varanasi.",
  hero_image: "/images/hero-1.jpg",
  overview_narrative:
    "India is an intoxicating sensory kaleidoscope where ancient traditions effortlessly intertwine with bustling modern life. Home to one of the world's oldest continuous civilisations, the subcontinent spans towering Himalayan peaks, sun-baked Thar desert dunes, tranquil tropical backwaters, and vibrant royal cities. Every region boasts its own distinct language, culinary wonders, classical music, and architectural treasures. Whether you are gazing at the marble majesty of the Taj Mahal at sunrise, tracking wild Bengal tigers through Ranthambore, or cruising serene lagoons on a traditional Keralan houseboat, India offers an unforgettable and transformative travel experience.",
  quick_facts: {
    capital: "New Delhi",
    currency: "Indian Rupee (INR ₹)",
    languages: "Hindi, English & 22 scheduled regional languages",
    timezone: "IST (UTC+5:30)",
    ideal_duration: "10 - 21 Days",
    plug_types: "Plug Type C, D, M (230V / 50Hz)",
    dialing_code: "+91",
    driving_side: "Left",
  },
  why_visit: {
    title: "Why Visit India?",
    subtitle: "From world-wonder monuments to sacred rituals and rare wildlife, discover what makes India a life-changing journey.",
    reasons: [
      {
        id: "w1",
        title: "The Golden Triangle & Architectural Wonders",
        description: "Be awestruck by the Taj Mahal in Agra, the sandstone Amber Fort in Jaipur, and the historic monuments of Old and New Delhi.",
        badge: "UNESCO World Wonders",
        image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "w2",
        title: "Sacred Spirituality & Ancient Ceremonies",
        description: "Witness the spellbinding evening Ganga Aarti ceremonies in Varanasi and Rishikesh, where prayer lamps float along the holy river.",
        badge: "Cultural Depth",
        image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "w3",
        title: "Rare Wildlife & Tiger Safaris",
        description: "Embark on exhilarating 4x4 jeep safaris through national parks like Ranthambore, Bandhavgarh, and Kanha to encounter Royal Bengal tigers in their natural habitat.",
        badge: "Untamed Nature",
        image: "https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "w4",
        title: "Kerala's Backwaters & Ayurvedic Rejuvenation",
        description: "Unwind aboard thatched rice barges as you glide through palm-fringed canals, complemented by traditional healing Ayurvedic therapies.",
        badge: "Tropical Serenity",
        image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "w5",
        title: "Celebrated Regional Gastronomy",
        description: "Delight in complex culinary traditions, from slow-cooked Awadhi biryanis and smoky tandoori grills to coastal coconut curries and fragrant street delicacies.",
        badge: "Culinary Odyssey",
        image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "w6",
        title: "Dazzling Festivals of Light & Colour",
        description: "Experience the infectious joy of Holi with powdered dyes or the warm brilliance of Diwali clay oil lamps lighting up palaces and riverbanks.",
        badge: "Living Traditions",
        image: "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  best_time_to_visit: {
    summary:
      "India's vast geography creates varying climate zones, but generally the cooler, dry months between October and March offer the most pleasant weather nationwide for sightseeing and wildlife safaris.",
    peak_season: {
      label: "Peak / High Season",
      months: "October - March",
      weather: "Warm, sunny, crisp days and cool evenings across Rajasthan, Central & South India; crisp alpine snow in the north.",
      description:
        "The ideal window for first-time visitors. Comfortable daytime temperatures make exploring palaces, temples, and outdoor markets effortless. National parks are fully open and festivals like Diwali and Pushkar Camel Fair take place.",
      crowds: "High",
      price_level: "High",
    },
    shoulder_season: {
      label: "Shoulder Season",
      months: "April & September",
      weather: "Warm to hot in the plains, clear and pleasant in Himalayan foothill retreats like Shimla and Ladakh.",
      description:
        "April offers exceptional tiger-spotting conditions in national parks as animals congregate around diminishing waterholes. September marks the end of the monsoon with dramatically green landscapes and fewer tourists.",
      crowds: "Moderate",
      price_level: "Moderate",
    },
    low_season: {
      label: "Green / Low Season",
      months: "May - August",
      weather: "Hot pre-monsoon temperatures in May, followed by southwest monsoon rains from June across the country.",
      description:
        "Monsoon showers rejuvenate waterfalls and countryside across Kerala, Goa, and Madhya Pradesh. Ideal for wellness retreats, budget travellers seeking low hotel rates, and high-altitude Ladakh trips which enjoy dry sunny skies.",
      crowds: "Low",
      price_level: "Value / Low",
    },
  },
  monsoon_info: {
    headline: "Monsoon & Climate Patterns Across India",
    monsoon_overview:
      "India's climate is famously sculpted by the Southwest Monsoon, sweeping in from the Arabian Sea in early June through Kerala and advancing northward across the subcontinent by mid-July before tapering off in September.",
    rainfall_schedule:
      "Monsoon rains typically arrive as dramatic, cooling afternoon cloudbursts rather than continuous day-long deluge. Travel is entirely feasible with proper planning, especially for cultural journeys, Ayurvedic treatments, and visiting rain-shadow regions.",
    cyclone_or_extreme_note:
      "While the plains experience humid monsoon conditions, high-altitude Ladakh and Spiti in the far north lie behind Himalayan rain-shadows and enjoy their driest, sunniest season between June and August.",
    regional_variations: [
      {
        region: "North & Rajasthan (Golden Triangle)",
        climate_note: "Hot dry spring in April-May; moderate monsoon rains in July-August; crisp pleasant winters from November to February.",
      },
      {
        region: "South & Kerala",
        climate_note: "Tropical warmth year-round. Experiences primary southwest monsoon (June-Aug) and softer retreating northeast showers (Oct-Nov).",
      },
      {
        region: "Himalayas & Ladakh",
        climate_note: "Summer (June-Sept) is peak season for Ladakh passes and trekking. Winters (Dec-Feb) bring heavy snow and sub-zero temperatures.",
      },
      {
        region: "East & Northeast",
        climate_note: "Higher rainfall zones; lush tea gardens in Darjeeling and Assam flourish from spring through late autumn.",
      },
    ],
  },
  temperature_info: {
    headline: "Year-Round Temperature & Rainfall Guide",
    climate_overview:
      "Representative average temperatures for Delhi and Central North India. Use the table below to plan your preferred travel window.",
    monthly_weather: [
      { month: "Jan", full_month: "January", avg_high_c: 21, avg_low_c: 7, avg_high_f: toF(21), avg_low_f: toF(7), rainfall_days: 2, recommendation: "Peak", highlight: "Pleasant sunny days, crisp cool evenings" },
      { month: "Feb", full_month: "February", avg_high_c: 24, avg_low_c: 10, avg_high_f: toF(24), avg_low_f: toF(10), rainfall_days: 2, recommendation: "Peak", highlight: "Prime sightseeing & wildlife safari weather" },
      { month: "Mar", full_month: "March", avg_high_c: 30, avg_low_c: 15, avg_high_f: toF(30), avg_low_f: toF(15), rainfall_days: 2, recommendation: "Peak", highlight: "Warm spring days & vibrant Holi celebrations" },
      { month: "Apr", full_month: "April", avg_high_c: 36, avg_low_c: 21, avg_high_f: toF(36), avg_low_f: toF(21), rainfall_days: 1, recommendation: "Shoulder", highlight: "Top month for tiger spotting at waterholes" },
      { month: "May", full_month: "May", avg_high_c: 40, avg_low_c: 26, avg_high_f: toF(40), avg_low_f: toF(26), rainfall_days: 2, recommendation: "Monsoon / Low", highlight: "Hot in plains; excellent for Himalayan retreats" },
      { month: "Jun", full_month: "June", avg_high_c: 39, avg_low_c: 28, avg_high_f: toF(39), avg_low_f: toF(28), rainfall_days: 5, recommendation: "Monsoon / Low", highlight: "Monsoon breaks in South; Ladakh season opens" },
      { month: "Jul", full_month: "July", avg_high_c: 35, avg_low_c: 27, avg_high_f: toF(35), avg_low_f: toF(27), rainfall_days: 12, recommendation: "Monsoon / Low", highlight: "Lush green countryside & lower tour pricing" },
      { month: "Aug", full_month: "August", avg_high_c: 34, avg_low_c: 26, avg_high_f: toF(34), avg_low_f: toF(26), rainfall_days: 13, recommendation: "Monsoon / Low", highlight: "Ayurvedic wellness peak season in Kerala" },
      { month: "Sep", full_month: "September", avg_high_c: 34, avg_low_c: 25, avg_high_f: toF(34), avg_low_f: toF(25), rainfall_days: 6, recommendation: "Shoulder", highlight: "Monsoon recedes; refreshing green landscapes" },
      { month: "Oct", full_month: "October", avg_high_c: 33, avg_low_c: 19, avg_high_f: toF(33), avg_low_f: toF(19), rainfall_days: 1, recommendation: "Peak", highlight: "Comfortable air; Diwali & festival season opens" },
      { month: "Nov", full_month: "November", avg_high_c: 28, avg_low_c: 13, avg_high_f: toF(28), avg_low_f: toF(13), rainfall_days: 1, recommendation: "Peak", highlight: "Perfect climate across north, central & south" },
      { month: "Dec", full_month: "December", avg_high_c: 23, avg_low_c: 8, avg_high_f: toF(23), avg_low_f: toF(8), rainfall_days: 1, recommendation: "Peak", highlight: "Clear skies; festive holiday season travel" },
    ],
  },
  best_places_to_visit: {
    headline: "Iconic Places to Visit in India",
    subtitle: "From grand royal palaces and timeless riverbanks to wildlife sanctuaries and coastal sanctuaries.",
    places: [
      {
        name: "Agra & The Taj Mahal",
        tag: "World Wonder",
        image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
        description: "The crown jewel of Mughal architecture, Shah Jahan's ivory-white mausoleum on the Yamuna River represents the world's most famous monument to love.",
        highlights: ["Taj Mahal at Sunrise", "Agra Fort", "Fatehpur Sikri"],
        best_for: "History & Architecture",
      },
      {
        name: "Jaipur (The Pink City)",
        tag: "Royal Rajasthan",
        image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
        description: "A fairy-tale realm of majestic sandstone fortresses, honeycomb-facaded palaces, bustling jewel bazaars, and astronomical observatories.",
        highlights: ["Amber Fort elephant/jeep ascent", "Hawa Mahal (Palace of Winds)", "City Palace"],
        best_for: "Heritage, Palaces & Shopping",
      },
      {
        name: "Varanasi & The River Ganges",
        tag: "Spiritual Epicenter",
        image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80",
        description: "One of the oldest continuously inhabited cities on Earth. Take a sunrise rowing boat past ancient bathing ghats and witness mesmerising fire ceremonies.",
        highlights: ["Dawn boat ride on the Ganges", "Evening Ganga Aarti ceremony", "Sarnath Deer Park"],
        best_for: "Culture, Spirituality & Photography",
      },
      {
        name: "Kerala Backwaters & Kochi",
        tag: "God's Own Country",
        image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
        description: "Tranquil palm-fringed lagoons, organic spice plantations, colonial Portuguese churches, and leisurely overnight cruises on traditional houseboats.",
        highlights: ["Alleppey Houseboat Cruise", "Fort Kochi Chinese Fishing Nets", "Munnar Tea Plantations"],
        best_for: "Relaxation, Wellness & Scenery",
      },
      {
        name: "Ranthambore National Park",
        tag: "Tiger Safari Sanctuary",
        image: "https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80",
        description: "A former royal hunting ground where ancient stone battlements rise above deciduous forests inhabited by Royal Bengal tigers, leopards, and crocodiles.",
        highlights: ["Open-top 4x4 Tiger Safaris", "10th-Century Ranthambore Fort", "Padam Lake birdlife"],
        best_for: "Wildlife Photography & Safaris",
      },
      {
        name: "Delhi (Old & New)",
        tag: "Historic Capital",
        image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
        description: "A pulsating metropolis bridging the grand Mughal alleys of Old Delhi with the broad, leafy avenues and monumental government architecture of New Delhi.",
        highlights: ["Humayun's Tomb", "Qutub Minar", "Chandni Chowk rickshaw ride"],
        best_for: "Culinary Tours & World Heritage",
      },
    ],
  },
  travel_info: {
    visas_and_passports:
      "Most international travellers require an Indian Visa or electronic Travel Authorisation (e-Visa), which must be applied for online at least 4–7 days prior to arrival. Passports must have at least six months validity from the date of arrival and two blank pages.",
    money_and_tipping:
      "The local currency is the Indian Rupee (INR ₹). ATMs are ubiquitous in cities and major towns. Visa and Mastercard are widely accepted in hotels and upscale restaurants, but carrying small cash notes is essential for markets, rickshaws, and tipping. Tipping is customary in tourism (approx. 500-1000 INR/day for private drivers and tour guides).",
    health_and_vaccinations:
      "Consult your physician at least 6 weeks before travel. Routine vaccinations (Hepatitis A, Tetanus, Typhoid) are recommended. Drink only sealed bottled water or filtered water, avoid ice at street stalls, and consider probiotics for dietary adjustments.",
    local_customs_and_culture:
      "Modest attire is appreciated, especially when entering temples, mosques, and gurdwaras (cover shoulders and knees; remove footwear at the entrance). A respectful 'Namaste' with hands folded together is the traditional greeting.",
    getting_around_and_transport:
      "Tourvaa tours provide vetted private air-conditioned transport and executive coaches between destinations. For long hops, high-speed Vande Bharat express trains and domestic flights offer efficient comfort.",
    packing_essentials:
      "Lightweight breathable cotton or linen clothing, comfortable slip-on walking shoes for temple visits, a warm fleece/jacket for desert or winter mornings, sunglasses, sunscreen, hand sanitiser, and a universal power adapter.",
    emergency_numbers: "National Emergency Helpline: 112 | Tourist Helpline: 1363",
  },
};

// ─── 2. NEW ZEALAND ──────────────────────────────────────────────────────────
const NEW_ZEALAND_DEFAULT: CountryDestinationInfo = {
  country_id: 4,
  country_name: "New Zealand",
  country_slug: "new-zealand",
  country_code: "NZ",
  tagline: "A Dramatic Realm of Fjords, Glaciers & Māori Living Heritage",
  hero_title: "New Zealand Destination Guide",
  hero_subtitle: "Immerse yourself in pristine alpine wilderness, glacial fjords, geothermal wonders, and renowned adventure across the North and South Islands.",
  hero_image: "/images/destination-alpine.jpg",
  overview_narrative:
    "Known to the indigenous Māori as Aotearoa ('Land of the Long White Cloud'), New Zealand is a world-renowned adventure and natural wonderland. Encompassing two major islands of contrasting majesty, the North Island dazzles with smoking geothermal springs, lush subtropical coastlines, and rich indigenous Māori culture. Across the Cook Strait, the South Island rises in dramatic alpine splendour, showcasing snow-capped Southern Alps peaks, jewel-toned glacial lakes, ancient rainforests, and awe-inspiring fjords like Milford Sound. Renowned for supreme safety, warm Kiwi hospitality, and clean air, New Zealand is the ultimate bucket-list road trip destination.",
  quick_facts: {
    capital: "Wellington",
    currency: "New Zealand Dollar (NZD $)",
    languages: "English, Māori (Te Reo), NZ Sign Language",
    timezone: "NZST (UTC+12) / NZDT (UTC+13 Daylight Saving)",
    ideal_duration: "14 - 24 Days",
    plug_types: "Plug Type I (230V / 50Hz)",
    dialing_code: "+64",
    driving_side: "Left",
  },
  why_visit: {
    title: "Why Visit New Zealand?",
    subtitle: "Pristine landscapes, legendary Māori traditions, and world-class road trip adventures await.",
    reasons: [
      {
        id: "nz1",
        title: "Glacial Fjords & Fiordland National Park",
        description: "Cruise beneath vertical granite cliffs and thundering waterfalls in Milford Sound and Doubtful Sound, acclaimed by Rudyard Kipling as the eighth wonder of the world.",
        badge: "Natural Wonder",
        image: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "nz2",
        title: "Queenstown: Global Adventure Capital",
        description: "Nestled on Lake Wakatipu beneath the Remarkables mountains, Queenstown offers jet boating, scenic gondolas, canyon swings, and renowned Otago Pinot Noir wineries.",
        badge: "Adventure & Wine",
        image: "https://images.unsplash.com/photo-1589802829985-817e51171b92?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "nz3",
        title: "Rotorua & Living Māori Culture",
        description: "Experience bubbling mud pools, natural geysers, and authentic Māori cultural performances followed by a traditional underground hangi feast.",
        badge: "Indigenous Heritage",
        image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "nz4",
        title: "Subtropical Bay of Islands",
        description: "Discover 144 subtropical islands where dolphins leap in turquoise waters, and visit the historic Waitangi Treaty Grounds where modern New Zealand was founded.",
        badge: "Coastal Splendour",
        image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "nz5",
        title: "Dark Sky Stargazing & Alpine Lakes",
        description: "Gaze into crystalline night skies within the Aoraki Mackenzie International Dark Sky Reserve surrounding the turquoise waters of Lake Tekapo.",
        badge: "Celestial Wonder",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "nz6",
        title: "Hobbiton & Middle-Earth Movie Magic",
        description: "Step into the lush green pastures of the Shire on a guided walk through the permanent movie set featured in The Lord of the Rings and The Hobbit trilogies.",
        badge: "Cinematic Fantasy",
        image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  best_time_to_visit: {
    summary:
      "New Zealand sits in the Southern Hemisphere, meaning its seasons are the reverse of Europe and North America. Summer spans December to February, while the vibrant autumn colours of March to May and ski season of June to August offer unique rewards.",
    peak_season: {
      label: "Peak / Summer Season",
      months: "December - February",
      weather: "Warm, long daylight hours (sun sets after 9 PM in South Island), beach weather and hiking conditions.",
      description:
        "The most popular window for scenic driving, outdoor hiking on Great Walks, wine tours, and lake activities. Advance booking is highly recommended for popular lodges and ferry crossings.",
      crowds: "High",
      price_level: "High",
    },
    shoulder_season: {
      label: "Shoulder Season",
      months: "March - May & September - November",
      weather: "Crisp sunny days, golden autumn foliage in Arrowtown/Central Otago; spring brings newborn lambs and blossoming orchards.",
      description:
        "Exceptional value with fewer crowds on hiking trails. March and April are particularly spectacular for photography, wine harvests, and comfortable sightseeing temperatures.",
      crowds: "Moderate",
      price_level: "Moderate",
    },
    low_season: {
      label: "Winter / Ski Season",
      months: "June - August",
      weather: "Crisp cool days in North Island; snow blankets the Southern Alps, opening world-class ski fields in Queenstown and Wanaka.",
      description:
        "A winter wonderland for snow sports enthusiasts. Cosy alpine chalets, uncrowded thermal pools, and striking snow-covered peaks make winter magical.",
      crowds: "Moderate in ski hubs, Low elsewhere",
      price_level: "Value / Low (except ski resorts)",
    },
  },
  monsoon_info: {
    headline: "Weather & Rainfall Characteristics in New Zealand",
    monsoon_overview:
      "New Zealand does not experience a tropical monsoon season. It enjoys a temperate maritime climate influenced by prevailing westerly winds and the surrounding Southern Ocean.",
    rainfall_schedule:
      "Rainfall is evenly distributed throughout the year. The western coast of the South Island receives substantial rain (which feeds lush temperate rainforests and dramatic waterfalls), while the eastern plains (Canterbury, Hawke's Bay, Marlborough) enjoy sunny, dry microclimates.",
    cyclone_or_extreme_note:
      "Weather can change quickly in alpine regions — Kiwi locals famously say you can experience 'four seasons in one day'. Layered clothing is the golden rule when exploring Fiordland and alpine passes.",
    regional_variations: [
      {
        region: "North Island (Auckland, Northland, Rotorua)",
        climate_note: "Subtropical and warm in summer (23–27°C); mild, green winters with gentle showers.",
      },
      {
        region: "South Island Alpine (Queenstown, Fiordland, Mount Cook)",
        climate_note: "Continental alpine conditions: warm sunny summers (20–25°C) and sub-zero winter nights with powder snow.",
      },
      {
        region: "East Coast Wine Regions (Marlborough, Hawke's Bay)",
        climate_note: "Sheltered by mountain ranges; high annual sunshine hours and dry conditions ideal for viticulture.",
      },
      {
        region: "West Coast (Franz Josef, Punakaiki)",
        climate_note: "High rainfall creating dramatic rainforests, glacial valleys, and majestic coastal blowholes.",
      },
    ],
  },
  temperature_info: {
    headline: "Monthly Temperature & Climate Matrix",
    climate_overview:
      "Average daily high and low temperatures for central New Zealand (blended North and South Island averages).",
    monthly_weather: [
      { month: "Jan", full_month: "January", avg_high_c: 24, avg_low_c: 14, avg_high_f: toF(24), avg_low_f: toF(14), rainfall_days: 7, recommendation: "Peak", highlight: "Warm summer days; peak beach and hiking conditions" },
      { month: "Feb", full_month: "February", avg_high_c: 24, avg_low_c: 14, avg_high_f: toF(24), avg_low_f: toF(14), rainfall_days: 6, recommendation: "Peak", highlight: "Warmest waters and settled summer weather" },
      { month: "Mar", full_month: "March", avg_high_c: 22, avg_low_c: 12, avg_high_f: toF(22), avg_low_f: toF(12), rainfall_days: 7, recommendation: "Shoulder", highlight: "Pleasant temperatures & grape harvest season" },
      { month: "Apr", full_month: "April", avg_high_c: 18, avg_low_c: 9, avg_high_f: toF(18), avg_low_f: toF(9), rainfall_days: 8, recommendation: "Shoulder", highlight: "Brilliant gold autumn leaves in Central Otago" },
      { month: "May", full_month: "May", avg_high_c: 15, avg_low_c: 7, avg_high_f: toF(15), avg_low_f: toF(7), rainfall_days: 9, recommendation: "Shoulder", highlight: "Crisp air, uncrowded roads and quiet trails" },
      { month: "Jun", full_month: "June", avg_high_c: 12, avg_low_c: 4, avg_high_f: toF(12), avg_low_f: toF(4), rainfall_days: 10, recommendation: "Monsoon / Low", highlight: "Queenstown Winter Festival & ski fields open" },
      { month: "Jul", full_month: "July", avg_high_c: 11, avg_low_c: 3, avg_high_f: toF(11), avg_low_f: toF(3), rainfall_days: 11, recommendation: "Monsoon / Low", highlight: "Crisp powder snow on South Island ski slopes" },
      { month: "Aug", full_month: "August", avg_high_c: 12, avg_low_c: 4, avg_high_f: toF(12), avg_low_f: toF(4), rainfall_days: 10, recommendation: "Monsoon / Low", highlight: "Prime alpine skiing and cosy fireside evenings" },
      { month: "Sep", full_month: "September", avg_high_c: 15, avg_low_c: 6, avg_high_f: toF(15), avg_low_f: toF(6), rainfall_days: 9, recommendation: "Shoulder", highlight: "Spring blooms, gushing waterfalls, newborn lambs" },
      { month: "Oct", full_month: "October", avg_high_c: 17, avg_low_c: 8, avg_high_f: toF(17), avg_low_f: toF(8), rainfall_days: 9, recommendation: "Shoulder", highlight: "Hiking trails reopen; fresh spring alpine views" },
      { month: "Nov", full_month: "November", avg_high_c: 19, avg_low_c: 10, avg_high_f: toF(19), avg_low_f: toF(10), rainfall_days: 8, recommendation: "Shoulder", highlight: "Lupins bloom around Lake Tekapo; longer days" },
      { month: "Dec", full_month: "December", avg_high_c: 22, avg_low_c: 12, avg_high_f: toF(22), avg_low_f: toF(12), rainfall_days: 7, recommendation: "Peak", highlight: "Summer solstice; Pohutukawa crimson blossoms" },
    ],
  },
  best_places_to_visit: {
    headline: "Unmissable Places in New Zealand",
    subtitle: "From glacial fjords and volcanic peaks to golden wine valleys and sparkling bays.",
    places: [
      {
        name: "Milford Sound & Fiordland",
        tag: "Fjordland Splendour",
        image: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=800&q=80",
        description: "Sheer rock walls carved by ancient glaciers soar thousands of feet out of dark waters, draped in cascading rainforest waterfalls and home to playful fur seals.",
        highlights: ["Scenic nature cruise", "Mitre Peak photography", "Homer Tunnel scenic drive"],
        best_for: "Spectacular Scenery & Cruising",
      },
      {
        name: "Queenstown & Lake Wakatipu",
        tag: "Alpine Resort",
        image: "https://images.unsplash.com/photo-1589802829985-817e51171b92?auto=format&fit=crop&w=800&q=80",
        description: "Surrounded by majestic mountains and crystal waters, Queenstown offers world-class dining, Skyline gondola panoramas, and thrilling outdoor excursions.",
        highlights: ["TSS Earnslaw vintage steamboat", "Gibbston Valley Pinot Noir tasting", "Bob's Peak Skyline Gondola"],
        best_for: "Fine Dining, Wine & Adventure",
      },
      {
        name: "Rotorua Geothermal Valley",
        tag: "Geothermal & Māori Culture",
        image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80",
        description: "A surreal volcanic landscape of bubbling mud pools, shooting geysers, and traditional Māori villages welcoming travellers to sacred cultural ceremonies.",
        highlights: ["Te Puia Pohutu Geyser", "Māori cultural performance & Hangi", "Polynesian Spa thermal pools"],
        best_for: "Indigenous Culture & Spa Wellness",
      },
      {
        name: "Lake Tekapo & Mount Cook (Aoraki)",
        tag: "Alpine Glaciers & Dark Sky",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
        description: "Famous for its turquoise glacial waters, historic Church of the Good Shepherd, and towering views of Aoraki / Mount Cook, New Zealand's highest peak.",
        highlights: ["Dark Sky Reserve stargazing", "Hooker Valley alpine track", "Glacier boat tour on Tasman Lake"],
        best_for: "Stargazing, Alpine Hiking & Lakes",
      },
      {
        name: "Bay of Islands (Northland)",
        tag: "Subtropical Coast",
        image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80",
        description: "A maritime haven of 144 islands rich in sailing history, swimming with dolphins, and the foundational grounds of the Treaty of Waitangi.",
        highlights: ["Hole in the Rock boat tour", "Waitangi Treaty Grounds", "Historic Russell settlement"],
        best_for: "Beaches, Sailing & Marine Wildlife",
      },
      {
        name: "Franz Josef & Fox Glaciers",
        tag: "Glacial Ice Valleys",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
        description: "One of the few places on Earth where ancient blue glacial ice plunges directly down into lush temperate rainforest near sea level.",
        highlights: ["Heli-hike on ancient blue ice", "Lake Matheson mirror reflection walk", "West Coast scenic highway drive"],
        best_for: "Glacier Hiking & Scenic Flights",
      },
    ],
  },
  travel_info: {
    visas_and_passports:
      "Most visitors from visa-waiver nations (including UK, US, Canada, EU) must apply for an NZeTA (New Zealand Electronic Travel Authority) online or via the mobile app prior to boarding. Passports must have at least three months validity beyond your intended departure date.",
    money_and_tipping:
      "The local currency is the New Zealand Dollar (NZD $). Contactless credit cards and mobile payments (Apple Pay, Google Pay) are accepted almost everywhere, including small rural cafes. Tipping is not customary or expected in New Zealand, though appreciated for exceptional service.",
    health_and_vaccinations:
      "New Zealand maintains world-class healthcare and hygiene standards. Tap water is safe and delicious everywhere. The Southern Hemisphere ozone layer is thin, so high-SPF sunscreen, sunglasses, and hats are essential year-round.",
    local_customs_and_culture:
      "Kiwis are warm, friendly, and informal. Respect Māori protocols when visiting a marae (remove shoes, wait for invitation). Protect the pristine environment under the 'Tiaki Promise' — take your litter with you and preserve nature.",
    getting_around_and_transport:
      "Tourvaa guided coach tours provide comfortable, modern transit with expert local driver-guides. Self-drivers should note that New Zealand drives on the left and alpine routes can be winding with single-lane bridges.",
    packing_essentials:
      "Quality windproof and waterproof rain jacket, layered breathable clothing, sturdy hiking boots, swimwear for geothermal pools, insect repellent for Fiordland sandflies, and camera with extra memory cards.",
    emergency_numbers: "Emergency Services (Police, Fire, Ambulance): 111",
  },
};

// ─── 3. THAILAND ─────────────────────────────────────────────────────────────
const THAILAND_DEFAULT: CountryDestinationInfo = {
  country_id: 11,
  country_name: "Thailand",
  country_slug: "thailand",
  country_code: "TH",
  tagline: "The Land of Smiles: Golden Temples, Tropical Isles & World-Class Flavours",
  hero_title: "Thailand Destination Guide",
  hero_subtitle: "From glittering Bangkok temples and misty northern hill tribes to turquoise island archipelagos and legendary street gastronomy.",
  hero_image: "/images/hero-2.jpg",
  overview_narrative:
    "Known affectionately worldwide as the 'Land of Smiles', Thailand is Southeast Asia's quintessential travel destination. The Kingdom seamlessly combines rich Buddhist heritage and gilded royal palaces with pristine tropical islands and lush jungle hills. In Bangkok, historic river ferries glide past the gleaming Grand Palace and Wat Arun, while vibrant floating markets and futuristic shopping boulevards pulse with energy. To the north, Chiang Mai provides a haven of mountain mist, ethical elephant sanctuaries, and artisan crafts. In the south, idyllic limestone islands like Phuket and Koh Samui offer white-sand beaches, emerald waters, and spectacular diving.",
  quick_facts: {
    capital: "Bangkok",
    currency: "Thai Baht (THB ฿)",
    languages: "Thai (English widely spoken in tourism hubs)",
    timezone: "ICT (UTC+7)",
    ideal_duration: "10 - 18 Days",
    plug_types: "Plug Type A, B, C, O (220V / 50Hz)",
    dialing_code: "+66",
    driving_side: "Left",
  },
  why_visit: {
    title: "Why Visit Thailand?",
    subtitle: "Exquisite temple architecture, tropical island paradise, and legendary culinary heritage.",
    reasons: [
      {
        id: "th1",
        title: "Golden Temples & Sacred Heritage",
        description: "Gaze at the 46-metre reclining Buddha at Wat Pho, the Emerald Buddha at Wat Phra Kaew, and intricate porcelain spires of Wat Arun.",
        badge: "Sacred Architecture",
        image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "th2",
        title: "World-Famous Island & Beach Escapes",
        description: "Sail past dramatic limestone karsts rising out of turquoise Andaman waters in Phang Nga Bay, and unwind on powdery beaches in Krabi and Phuket.",
        badge: "Tropical Paradise",
        image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "th3",
        title: "Celebrated Street Food & Royal Cuisine",
        description: "Savour the balance of sweet, sour, salty, and spicy in Pad Thai, fragrant green curries, Tom Yum Goong, and sweet mango sticky rice.",
        badge: "Culinary Heaven",
        image: "https://images.unsplash.com/photo-1569569970363-df7b6160d111?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "th4",
        title: "Chiang Mai & Northern Mountain Culture",
        description: "Explore tranquil teak temples, learn the craft of traditional Lanna weaving, and visit ethical elephant rescue sanctuaries in misty valleys.",
        badge: "Northern Highlands",
        image: "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  best_time_to_visit: {
    summary:
      "Thailand enjoys a tropical climate with three seasons. The cool and dry season from November to February is universally considered the best time to visit nationwide.",
    peak_season: {
      label: "Cool & Dry (Peak Season)",
      months: "November - February",
      weather: "Warm and comfortable (25–30°C), low humidity, clear skies, and calm sea conditions.",
      description:
        "The most comfortable weather across Bangkok, the northern mountains, and the southern islands. Perfect for city tours, temple walks, and island beach hopping.",
      crowds: "High",
      price_level: "High",
    },
    shoulder_season: {
      label: "Hot Season",
      months: "March - May",
      weather: "Hot and sunny (32–38°C); pleasant coastal breezes by the sea.",
      description:
        "April hosts the world-famous Songkran (Thai New Year water festival), where countrywide water fights celebrate the new year. Island resorts are popular and lively.",
      crowds: "Moderate",
      price_level: "Moderate",
    },
    low_season: {
      label: "Green / Monsoon Season",
      months: "June - October",
      weather: "Warm tropical rains, typically in 1–2 hour afternoon showers followed by sunshine.",
      description:
        "Lush emerald rice terraces, raging waterfalls, and dramatic savings on luxury hotels. Note that Gulf islands like Koh Samui have different rainfall timing and enjoy great weather in July-August.",
      crowds: "Low",
      price_level: "Value / Low",
    },
  },
  monsoon_info: {
    headline: "Monsoon & Coastal Weather Nuances in Thailand",
    monsoon_overview:
      "The Southwest Monsoon brings rainfall between July and October to most of mainland Thailand and the Andaman Sea coast (Phuket, Krabi). However, Thailand's unique dual coastline means excellent weather is almost always found on one side of the country!",
    rainfall_schedule:
      "While the Andaman coast (Phuket/Krabi) experiences higher rainfall in September–October, the Gulf of Thailand (Koh Samui, Koh Phangan, Koh Tao) is sheltered during those months and experiences its primary rains later between October and December.",
    cyclone_or_extreme_note:
      "Even during the peak of the green season, days rarely see continuous rain — showers typically arrive in brief, refreshing tropical bursts.",
    regional_variations: [
      {
        region: "Bangkok & Central Plains",
        climate_note: "Hot tropical climate; afternoon downpours common in August-September.",
      },
      {
        region: "Northern Thailand (Chiang Mai)",
        climate_note: "Cool, crisp winter nights (down to 12°C in Dec-Jan); lush green landscapes in autumn.",
      },
      {
        region: "Andaman Coast (Phuket, Krabi)",
        climate_note: "Best seas and clearest diving from November to April; monsoon swells from June to October.",
      },
      {
        region: "Gulf of Thailand (Koh Samui)",
        climate_note: "Sunny and dry from January to August; peak rainfall occurs late in the year (Oct-Dec).",
      },
    ],
  },
  temperature_info: {
    headline: "Monthly Temperature Guide for Thailand",
    climate_overview: "Average temperatures and rainfall for Bangkok and central Thailand across the 12 months.",
    monthly_weather: [
      { month: "Jan", full_month: "January", avg_high_c: 32, avg_low_c: 21, avg_high_f: toF(32), avg_low_f: toF(21), rainfall_days: 1, recommendation: "Peak", highlight: "Crisp dry weather; premier time for temple sightseeing" },
      { month: "Feb", full_month: "February", avg_high_c: 33, avg_low_c: 23, avg_high_f: toF(33), avg_low_f: toF(23), rainfall_days: 2, recommendation: "Peak", highlight: "Warm sunny days and calm sea conditions" },
      { month: "Mar", full_month: "March", avg_high_c: 34, avg_low_c: 25, avg_high_f: toF(34), avg_low_f: toF(25), rainfall_days: 3, recommendation: "Shoulder", highlight: "Warm beach weather; great mango season begins" },
      { month: "Apr", full_month: "April", avg_high_c: 35, avg_low_c: 26, avg_high_f: toF(35), avg_low_f: toF(26), rainfall_days: 4, recommendation: "Shoulder", highlight: "Songkran Water Festival celebrations nationwide" },
      { month: "May", full_month: "May", avg_high_c: 34, avg_low_c: 26, avg_high_f: toF(34), avg_low_f: toF(26), rainfall_days: 9, recommendation: "Monsoon / Low", highlight: "Warm with first tropical spring showers" },
      { month: "Jun", full_month: "June", avg_high_c: 33, avg_low_c: 26, avg_high_f: toF(33), avg_low_f: toF(26), rainfall_days: 10, recommendation: "Monsoon / Low", highlight: "Lush green countryside; great value for resorts" },
      { month: "Jul", full_month: "July", avg_high_c: 33, avg_low_c: 25, avg_high_f: toF(33), avg_low_f: toF(25), rainfall_days: 12, recommendation: "Monsoon / Low", highlight: "Koh Samui enjoys dry sunny skies during summer break" },
      { month: "Aug", full_month: "August", avg_high_c: 33, avg_low_c: 25, avg_high_f: toF(33), avg_low_f: toF(25), rainfall_days: 13, recommendation: "Monsoon / Low", highlight: "Raging waterfalls and peaceful uncrowded temples" },
      { month: "Sep", full_month: "September", avg_high_c: 32, avg_low_c: 25, avg_high_f: toF(32), avg_low_f: toF(25), rainfall_days: 15, recommendation: "Monsoon / Low", highlight: "Wettest month in central areas; lush scenery" },
      { month: "Oct", full_month: "October", avg_high_c: 32, avg_low_c: 24, avg_high_f: toF(32), avg_low_f: toF(24), rainfall_days: 13, recommendation: "Shoulder", highlight: "Monsoon begins clearing; refreshing cool air arrives" },
      { month: "Nov", full_month: "November", avg_high_c: 32, avg_low_c: 23, avg_high_f: toF(32), avg_low_f: toF(23), rainfall_days: 5, recommendation: "Peak", highlight: "Loy Krathong lantern festival and ideal skies" },
      { month: "Dec", full_month: "December", avg_high_c: 31, avg_low_c: 21, avg_high_f: toF(31), avg_low_f: toF(21), rainfall_days: 1, recommendation: "Peak", highlight: "Coolest, sunniest weather across all regions" },
    ],
  },
  best_places_to_visit: {
    headline: "Top Places to Visit in Thailand",
    subtitle: "From glittering royal capitals to tranquil northern mountains and tropical islands.",
    places: [
      {
        name: "Bangkok & Chao Phraya River",
        tag: "Vibrant Capital",
        image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80",
        description: "A thrilling metropolis of gleaming golden stupas, historic long-tail canals, bustling night bazaars, and Michelin-starred street food stalls.",
        highlights: ["Grand Palace & Emerald Buddha", "Wat Pho Reclining Buddha", "Chao Phraya sunset river cruise"],
        best_for: "Culture, Temples & Street Food",
      },
      {
        name: "Chiang Mai (Old City & Hills)",
        tag: "Cultural Heartland",
        image: "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80",
        description: "Encircled by misty green mountains, Chiang Mai offers peaceful ancient temples, bustling Sunday walking street markets, and ethical animal sanctuaries.",
        highlights: ["Wat Phra That Doi Suthep", "Ethical Elephant Sanctuary", "Night Bazaar shopping"],
        best_for: "Culture, Mountains & Handicrafts",
      },
      {
        name: "Phuket & Phang Nga Bay",
        tag: "Island & Marine Sanctuary",
        image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80",
        description: "Thailand's largest island, boasting golden sand beaches, Sino-Portuguese Old Town heritage, and day trips to the dramatic limestone karsts of James Bond Island.",
        highlights: ["Phang Nga Bay sea kayaking", "Phuket Old Town heritage walk", "Phi Phi Islands speedboat tour"],
        best_for: "Beaches, Luxury Resorts & Boating",
      },
    ],
  },
  travel_info: {
    visas_and_passports:
      "Citizens of many countries (including UK, US, Australia, Canada, EU) receive visa-free entry for tourism stays up to 30 to 60 days. Passports must have at least 6 months validity.",
    money_and_tipping:
      "The currency is the Thai Baht (THB ฿). ATMs are widespread (a standard 220 THB withdrawal fee applies to foreign cards). Carrying cash is essential for street vendors and markets. Tipping is not strictly required but rounding up bills or leaving 10% is customary in restaurants.",
    health_and_vaccinations:
      "No specific compulsory vaccines for general travel. Drink bottled or purified water. Pack DEET mosquito repellent for evening dining and temple gardens.",
    local_customs_and_culture:
      "Show high respect for the Thai Royal Family and Buddhist monks. When entering temples, dress respectfully with covered shoulders and knees, and never point your feet directly at a Buddha statue.",
    getting_around_and_transport:
      "In cities, BTS Skytrain, MRT subway, and Grab rides provide easy navigation. For intercity routes, domestic flights and overnight sleeper trains connect Bangkok to Chiang Mai and the south.",
    packing_essentials:
      "Lightweight, loose-fitting cotton clothing, slip-on shoes for temple visits, sun hat, UV protection, reusable water bottle, and modesty wrap or sarong.",
    emergency_numbers: "Tourist Police (English-speaking): 1155 | National Emergency: 191",
  },
};

// ─── 4. GENERAL FALLBACK GENERATOR ──────────────────────────────────────────
export function getFallbackCountryDestinationInfo(
  countryName: string,
  countryCode = "XX",
  countryId = 999
): CountryDestinationInfo {
  const slug = countryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return {
    country_id: countryId,
    country_name: countryName,
    country_slug: slug,
    country_code: countryCode,
    tagline: `Discover the Wonders, Culture and Natural Beauty of ${countryName}`,
    hero_title: `${countryName} Destination Guide`,
    hero_subtitle: `Explore curated tour packages, seasonal travel advice, iconic landmarks, and practical advice for traveling across ${countryName}.`,
    hero_image: "/images/destination-alpine.jpg",
    overview_narrative: `${countryName} is an extraordinary destination welcoming travellers with diverse landscapes, rich cultural heritage, and warm local hospitality. Whether you are exploring historic cities, embarking on scenic nature trails, or immersing yourself in authentic culinary traditions, a journey to ${countryName} promises unforgettable memories. Browse our handpicked itineraries and expert travel insights below to begin planning your next adventure.`,
    quick_facts: {
      capital: `Capital of ${countryName}`,
      currency: "Local Currency",
      languages: "Official & Regional Languages",
      timezone: "Local Time",
      ideal_duration: "8 - 14 Days",
      plug_types: "Standard International Adaptor recommended",
      dialing_code: "+00",
      driving_side: "Standard",
    },
    why_visit: {
      title: `Why Visit ${countryName}?`,
      subtitle: `Experience the unique blend of natural wonder, living culture, and local warmth that makes ${countryName} special.`,
      reasons: [
        {
          id: "r1",
          title: "Rich Cultural Heritage & History",
          description: `Uncover centuries of captivating history, protected monuments, and enduring cultural traditions unique to ${countryName}.`,
          badge: "Historic Legacy",
          image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
        },
        {
          id: "r2",
          title: "Breathtaking Natural Scenery",
          description: `From panoramic mountain views to picturesque coastlines and tranquil countryside, ${countryName} offers stunning landscapes for every photographer.`,
          badge: "Scenic Majesty",
          image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
        },
        {
          id: "r3",
          title: "Authentic Local Cuisine",
          description: `Sample regional specialities crafted from fresh, local ingredients and experience the rich culinary hospitality of ${countryName}.`,
          badge: "Gastronomy",
          image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        },
      ],
    },
    best_time_to_visit: {
      summary: `The optimal time to explore ${countryName} depends on your preferred activities, with pleasant seasonal conditions and exciting festivals throughout the year.`,
      peak_season: {
        label: "Peak / High Season",
        months: "Spring & Autumn",
        weather: "Mild, comfortable temperatures and clear sunny days.",
        description: `Ideal conditions for sightseeing, guided walking tours, and outdoor photography across ${countryName}.`,
        crowds: "High",
        price_level: "High",
      },
      shoulder_season: {
        label: "Shoulder Season",
        months: "Late Spring / Early Autumn",
        weather: "Moderate temperatures with pleasant travel conditions.",
        description: "Great balance between fewer tourist crowds and comfortable weather.",
        crowds: "Moderate",
        price_level: "Moderate",
      },
      low_season: {
        label: "Low Season",
        months: "Off-peak months",
        weather: "Seasonal weather variations with cooler or wetter conditions.",
        description: "Best for budget-conscious travellers seeking the lowest accommodation rates and uncrowded attractions.",
        crowds: "Low",
        price_level: "Value / Low",
      },
    },
    monsoon_info: {
      headline: `Weather & Seasonal Patterns in ${countryName}`,
      monsoon_overview: `${countryName} experiences distinct seasonal variations throughout the year, with changing weather patterns that shape the local environment and seasonal activities.`,
      rainfall_schedule: `Check local regional forecasts when planning outdoor excursions, as mountain and coastal areas may experience varying rainfall schedules.`,
      regional_variations: [
        { region: "Central Region", climate_note: "Moderate climate with seasonal variations." },
        { region: "Coastal & Lowland Areas", climate_note: "Maritime influences with refreshing sea breezes." },
      ],
    },
    temperature_info: {
      headline: `Temperature Overview for ${countryName}`,
      climate_overview: `Average monthly temperatures throughout the year to help you pack appropriately.`,
      monthly_weather: [
        { month: "Jan", full_month: "January", avg_high_c: 18, avg_low_c: 8, avg_high_f: 64, avg_low_f: 46, rainfall_days: 5, recommendation: "Good", highlight: "Pleasant seasonal conditions" },
        { month: "Feb", full_month: "February", avg_high_c: 20, avg_low_c: 9, avg_high_f: 68, avg_low_f: 48, rainfall_days: 4, recommendation: "Good", highlight: "Clear skies and comfortable sightseeing" },
        { month: "Mar", full_month: "March", avg_high_c: 23, avg_low_c: 12, avg_high_f: 73, avg_low_f: 54, rainfall_days: 5, recommendation: "Peak", highlight: "Spring weather opens outdoor activities" },
        { month: "Apr", full_month: "April", avg_high_c: 26, avg_low_c: 15, avg_high_f: 79, avg_low_f: 59, rainfall_days: 6, recommendation: "Peak", highlight: "Warm pleasant temperatures" },
        { month: "May", full_month: "May", avg_high_c: 29, avg_low_c: 18, avg_high_f: 84, avg_low_f: 64, rainfall_days: 7, recommendation: "Peak", highlight: "Long daylight hours" },
        { month: "Jun", full_month: "June", avg_high_c: 31, avg_low_c: 21, avg_high_f: 88, avg_low_f: 70, rainfall_days: 8, recommendation: "Shoulder", highlight: "Summer holiday season begins" },
        { month: "Jul", full_month: "July", avg_high_c: 32, avg_low_c: 22, avg_high_f: 90, avg_low_f: 72, rainfall_days: 9, recommendation: "Shoulder", highlight: "Peak summer warmth" },
        { month: "Aug", full_month: "August", avg_high_c: 32, avg_low_c: 22, avg_high_f: 90, avg_low_f: 72, rainfall_days: 8, recommendation: "Shoulder", highlight: "Warm sunny days" },
        { month: "Sep", full_month: "September", avg_high_c: 29, avg_low_c: 19, avg_high_f: 84, avg_low_f: 66, rainfall_days: 6, recommendation: "Peak", highlight: "Refreshing autumn air" },
        { month: "Oct", full_month: "October", avg_high_c: 25, avg_low_c: 15, avg_high_f: 77, avg_low_f: 59, rainfall_days: 5, recommendation: "Peak", highlight: "Excellent touring conditions" },
        { month: "Nov", full_month: "November", avg_high_c: 21, avg_low_c: 11, avg_high_f: 70, avg_low_f: 52, rainfall_days: 4, recommendation: "Good", highlight: "Crisp clear weather" },
        { month: "Dec", full_month: "December", avg_high_c: 18, avg_low_c: 8, avg_high_f: 64, avg_low_f: 46, rainfall_days: 5, recommendation: "Good", highlight: "Festive season atmosphere" },
      ],
    },
    best_places_to_visit: {
      headline: `Top Highlights in ${countryName}`,
      subtitle: `Key cities, regions and landmarks not to miss when visiting ${countryName}.`,
      places: [
        {
          name: `Historic Capital of ${countryName}`,
          tag: "Cultural Centre",
          image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
          description: `The cultural and historical heart of ${countryName}, home to iconic monuments, national museums, and vibrant dining districts.`,
          highlights: ["Historic Old Town", "National Landmark", "Central Plaza"],
          best_for: "History & City Exploration",
        },
        {
          name: `Scenic National Park Region`,
          tag: "Natural Reserve",
          image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
          description: `An expansive wilderness area showcasing the stunning natural geography and diverse flora and fauna of ${countryName}.`,
          highlights: ["Panoramic viewpoints", "Hiking trails", "Wildlife watching"],
          best_for: "Nature & Hiking",
        },
      ],
    },
    travel_info: {
      visas_and_passports: `Check visa requirements with the embassy or official immigration portal of ${countryName} prior to departure. Ensure your passport is valid for at least six months from your planned date of entry.`,
      money_and_tipping: `Local currency and major international credit cards are generally accepted in urban hubs. Keep some local cash on hand for small purchases, local markets, and customary tipping.`,
      health_and_vaccinations: `Verify standard travel vaccines before your trip. Pack any essential personal medications in your carry-on luggage and carry basic travel medical insurance.`,
      local_customs_and_culture: `Respect local customs, cultural sites, and dress codes when visiting historic and religious landmarks. A friendly greeting in the local language is always appreciated.`,
      getting_around_and_transport: `Tourvaa tours include comfortable, verified transportation between all itinerary stops. Public transit, taxis, and domestic connections are available in major cities.`,
      packing_essentials: `Pack comfortable walking footwear, weather-appropriate layered clothing, sun protection, a travel power adaptor, and a reusable water bottle.`,
      emergency_numbers: "Check local police and medical emergency hotlines upon arrival.",
    },
  };
}

// ─── 4. CHINA ────────────────────────────────────────────────────────────────
const CHINA_DEFAULT: CountryDestinationInfo = {
  country_id: 12,
  country_name: "China",
  country_slug: "china",
  country_code: "CN",
  tagline: "An Ancient Land of Contrasts, Imperial Splendour & Futuristic Wonders",
  hero_title: "China Tours",
  hero_subtitle:
    "Discover ancient wonders, mist-shrouded peaks, futuristic skylines, and thousand-year traditions on unforgettable journeys across China.",
  hero_image:
    "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1800&q=80",
  overview_narrative:
    "From the monumental Great Wall undulating across rugged ridge lines to the surreal limestone karst pillars of Guilin and the bustling, neon-lit alleys of Shanghai, China is a country of staggering scale, deep history, and relentless modern vitality. Walk through the sprawling courtyards of Beijing's Forbidden City, stand face-to-face with the ancient Terracotta Army in Xi'an, and cruise through the dramatic Three Gorges along the Yangtze River. Whether you are savouring regional culinary delicacies in Sichuan, exploring classical silk gardens in Suzhou, or gazing at futuristic superstructures in Shenzhen, China promises an extraordinary travel adventure.",
  quick_facts: {
    capital: "Beijing",
    currency: "Chinese Yuan (CNY ¥)",
    languages: "Mandarin Chinese (Standard)",
    timezone: "CST (UTC+8)",
    ideal_duration: "10 - 21 Days",
    plug_types: "Plug Type A, C, I (220V / 50Hz)",
    dialing_code: "+86",
    driving_side: "Right",
  },
  why_visit: {
    title: "Why Visit China?",
    subtitle:
      "A civilization spanning millennia alongside futuristic innovation, rare giant pandas, and world-wonder monuments.",
    reasons: [
      {
        id: "c1",
        title: "The Great Wall & Imperial Relics",
        description: "Climb watchtowers along the Great Wall and explore the Ming and Qing dynasties' Forbidden City.",
        badge: "UNESCO Wonders",
        image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "c2",
        title: "The Terracotta Warriors of Xi'an",
        description: "Behold the silent underground army guarding the mausoleum of China's first emperor for 2,200 years.",
        badge: "Archaeological Marvel",
        image: "https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "c3",
        title: "Yangtze Gorges & Guilin Karsts",
        description: "Sail past dramatic limestone peaks and mist-crowned river canyons that inspired classical brush paintings.",
        badge: "Pristine Nature",
        image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "c4",
        title: "Chengdu Giant Panda Sanctuaries",
        description: "Get up close with adorable giant pandas in their lush bamboo habitats in Sichuan.",
        badge: "Rare Wildlife",
        image: "https://images.unsplash.com/photo-1527118732049-c88155f2107c?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  best_time_to_visit: {
    summary:
      "Autumn (September to November) and Spring (March to May) offer the most pleasant weather nationwide, with clear skies and comfortable sightseeing temperatures across both northern and southern regions.",
    peak_season: {
      label: "Peak / Autumn & Spring",
      months: "September - November & April - May",
      weather: "Warm, crisp, and sunny days with clear mountain views and blooming spring cherry blossoms.",
      description:
        "The ideal window for comfortable exploration of the Great Wall, Beijing, and Yangtze river cruises without intense heat.",
      crowds: "High",
      price_level: "High",
    },
    shoulder_season: {
      label: "Shoulder Season",
      months: "March & October",
      weather: "Mild to cool temperatures with lower rainfall and moderate humidity.",
      description:
        "Great for visiting cultural sites with fewer crowds, outside the Golden Week national holiday week.",
      crowds: "Moderate",
      price_level: "Moderate",
    },
    low_season: {
      label: "Low / Winter Season",
      months: "December - February",
      weather: "Cold and snowy in northern cities; mild in southern subtropical regions.",
      description:
        "Best for Harbin ice festivals, seeing snow on the Great Wall, and securing the lowest hotel rates.",
      crowds: "Low",
      price_level: "Value / Low",
    },
  },
  monsoon_info: {
    headline: "Seasonal Patterns & Regional Variations in China",
    monsoon_overview:
      "China spans multiple climate zones. The southern regions experience summer monsoon rains between June and August, while northern and western regions remain continental and dry.",
    rainfall_schedule:
      "Carry a light rain jacket during summer trips to southern cities like Guilin, Shanghai, and Hong Kong.",
    regional_variations: [
      { region: "North (Beijing & Xi'an)", climate_note: "Four distinct seasons with dry crisp autumns and freezing winters." },
      { region: "Central & Yangtze River", climate_note: "Hot humid summers with pleasant springs and autumn foliage." },
      { region: "South (Guilin & Guangzhou)", climate_note: "Subtropical climate with warm temperatures and summer monsoon showers." },
    ],
  },
  temperature_info: {
    headline: "Average Monthly Temperatures in China",
    climate_overview: "Average temperatures across Beijing and central regions throughout the year.",
    monthly_weather: [
      { month: "Jan", full_month: "January", avg_high_c: 2, avg_low_c: -8, avg_high_f: 36, avg_low_f: 18, rainfall_days: 2, recommendation: "Monsoon / Low", highlight: "Crisp winter skies and Harbin ice sculptures" },
      { month: "Feb", full_month: "February", avg_high_c: 5, avg_low_c: -5, avg_high_f: 41, avg_low_f: 23, rainfall_days: 3, recommendation: "Monsoon / Low", highlight: "Spring Festival & Chinese New Year celebrations" },
      { month: "Mar", full_month: "March", avg_high_c: 12, avg_low_c: 1, avg_high_f: 54, avg_low_f: 34, rainfall_days: 4, recommendation: "Good", highlight: "Spring blossoms appear across parks" },
      { month: "Apr", full_month: "April", avg_high_c: 20, avg_low_c: 8, avg_high_f: 68, avg_low_f: 46, rainfall_days: 5, recommendation: "Peak", highlight: "Ideal weather for Great Wall hikes" },
      { month: "May", full_month: "May", avg_high_c: 26, avg_low_c: 14, avg_high_f: 79, avg_low_f: 57, rainfall_days: 6, recommendation: "Peak", highlight: "Long sunny days and lush botanical scenery" },
      { month: "Jun", full_month: "June", avg_high_c: 30, avg_low_c: 19, avg_high_f: 86, avg_low_f: 66, rainfall_days: 9, recommendation: "Shoulder", highlight: "Dragon Boat Festival and summer energy" },
      { month: "Jul", full_month: "July", avg_high_c: 31, avg_low_c: 22, avg_high_f: 88, avg_low_f: 72, rainfall_days: 12, recommendation: "Shoulder", highlight: "Highland Tibetan plateau escapes" },
      { month: "Aug", full_month: "August", avg_high_c: 30, avg_low_c: 21, avg_high_f: 86, avg_low_f: 70, rainfall_days: 10, recommendation: "Shoulder", highlight: "Summer river cruises on the Yangtze" },
      { month: "Sep", full_month: "September", avg_high_c: 26, avg_low_c: 15, avg_high_f: 79, avg_low_f: 59, rainfall_days: 6, recommendation: "Peak", highlight: "Golden autumn season begins with clear blue skies" },
      { month: "Oct", full_month: "October", avg_high_c: 19, avg_low_c: 8, avg_high_f: 66, avg_low_f: 46, rainfall_days: 4, recommendation: "Peak", highlight: "Best overall travel month across China" },
      { month: "Nov", full_month: "November", avg_high_c: 10, avg_low_c: 0, avg_high_f: 50, avg_low_f: 32, rainfall_days: 3, recommendation: "Good", highlight: "Crisp air and uncrowded palaces" },
      { month: "Dec", full_month: "December", avg_high_c: 3, avg_low_c: -6, avg_high_f: 37, avg_low_f: 21, rainfall_days: 2, recommendation: "Monsoon / Low", highlight: "Winter wonderland sights on northern peaks" },
    ],
  },
  best_places_to_visit: {
    headline: "Places to Visit in China",
    subtitle: "Key highlights and iconic destinations you must see during your trip.",
    places: [
      {
        name: "The Great Wall of China",
        tag: "UNESCO World Wonder",
        image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80",
        description: "Winding over 13,000 miles across northern mountains, this ancient fortification is one of humanity's greatest architectural achievements.",
        highlights: ["Mutianyu section", "Watchtower vistas", "Cable car ascent"],
        best_for: "History & Hiking",
      },
      {
        name: "The Forbidden City, Beijing",
        tag: "Imperial Palace",
        image: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=800&q=80",
        description: "The world's largest imperial palace complex, home to 24 Ming and Qing emperors across 980 surviving ornate pavilions.",
        highlights: ["Hall of Supreme Harmony", "Imperial Garden", "Tiananmen Square"],
        best_for: "Imperial Heritage",
      },
      {
        name: "The Terracotta Army, Xi'an",
        tag: "Ancient Wonder",
        image: "https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=800&q=80",
        description: "Thousands of life-sized terracotta soldiers, horses, and chariots buried for over 2,200 years to guard China's first emperor.",
        highlights: ["Pit 1 battle formation", "Bronze chariots", "Ancient city wall"],
        best_for: "Archaeology",
      },
      {
        name: "The Bund & Skylines, Shanghai",
        tag: "Metropolitan Icon",
        image: "https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?auto=format&fit=crop&w=800&q=80",
        description: "A striking waterfront promenade blending European colonial architecture with the gleaming futuristic skyscrapers of Pudong.",
        highlights: ["Oriental Pearl Tower", "Huangpu River cruise", "Nanjing Road"],
        best_for: "City & Architecture",
      },
    ],
  },
  travel_info: {
    visas_and_passports: "Check entry visa requirements with the Chinese embassy or visa application service before departure. Transit visa-free policies (72/144-hour) are available at designated international airports for qualifying passport holders. Ensure your passport is valid for at least 6 months.",
    money_and_tipping: "Mobile payments (Alipay and WeChat Pay linked to international credit cards) are universally used in China. Carry a small amount of Chinese Yuan (CNY) cash for remote areas. Tipping is not traditionally customary in mainland China.",
    health_and_vaccinations: "Routine travel vaccinations are recommended. Tap water is not recommended for drinking; boiled or bottled water is readily accessible. Carry an international roaming plan or local eSIM for internet access.",
    local_customs_and_culture: "Remove shoes where requested and speak respectfully in Buddhist and Taoist temples. Exchanging business cards and gifts with both hands is a polite traditional gesture.",
    getting_around_and_transport: "China boasts the world's most extensive high-speed railway (CRH) network, connecting major hubs in record time. Modern metros and licensed taxis operate seamlessly across all tier-one and tier-two cities.",
    packing_essentials: "Pack comfortable walking shoes, weather-appropriate layers, a universal power adaptor (Type A/C/I), a portable power bank, and a phrasebook or translation app.",
    emergency_numbers: "Police: 110 | Medical Ambulance: 120 | Fire: 119",
  },
};

// ─── REGISTRY ───────────────────────────────────────────────────────────────
export const COUNTRY_DESTINATION_DEFAULTS: Record<string, CountryDestinationInfo> = {
  india: INDIA_DEFAULT,
  "new-zealand": NEW_ZEALAND_DEFAULT,
  thailand: THAILAND_DEFAULT,
  china: CHINA_DEFAULT,
};

export const CURATED_COUNTRY_INFOS = COUNTRY_DESTINATION_DEFAULTS;

export function getCountryDestinationDefault(slugOrName: string): CountryDestinationInfo {
  const normalized = slugOrName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  if (COUNTRY_DESTINATION_DEFAULTS[normalized]) {
    return COUNTRY_DESTINATION_DEFAULTS[normalized];
  }

  // Common aliases
  if (normalized === "nz") return NEW_ZEALAND_DEFAULT;
  if (normalized === "in") return INDIA_DEFAULT;
  if (normalized === "th") return THAILAND_DEFAULT;

  const prettyName = slugOrName
    .split(/[-_ ]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return getFallbackCountryDestinationInfo(prettyName, "XX", 999);
}
