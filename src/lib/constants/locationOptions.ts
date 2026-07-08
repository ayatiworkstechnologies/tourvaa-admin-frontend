export const phoneCountryCodes = [
  { label: "India (+91)", value: "+91" },
  { label: "United States (+1)", value: "+1" },
  { label: "United Kingdom (+44)", value: "+44" },
  { label: "Australia (+61)", value: "+61" },
  { label: "Canada (+1)", value: "+1" },
  { label: "United Arab Emirates (+971)", value: "+971" },
  { label: "Singapore (+65)", value: "+65" },
  { label: "Malaysia (+60)", value: "+60" },
  { label: "Germany (+49)", value: "+49" },
  { label: "France (+33)", value: "+33" },
  { label: "Italy (+39)", value: "+39" },
  { label: "Spain (+34)", value: "+34" },
  { label: "Japan (+81)", value: "+81" },
  { label: "China (+86)", value: "+86" },
  { label: "South Africa (+27)", value: "+27" },
  { label: "Brazil (+55)", value: "+55" },
];

export const countries = [
  "India",
  "United States",
  "United Kingdom",
  "Australia",
  "Canada",
  "United Arab Emirates",
  "Singapore",
  "Malaysia",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Japan",
  "China",
  "South Africa",
  "Brazil",
];

const statesByCountry: Record<string, string[]> = {
  India: ["Tamil Nadu", "Kerala", "Karnataka", "Maharashtra", "Delhi", "Telangana"],
  "United States": ["California", "Florida", "New York", "Texas", "Washington"],
  "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
  Australia: ["New South Wales", "Queensland", "Victoria", "Western Australia"],
  Canada: ["Alberta", "British Columbia", "Ontario", "Quebec"],
  "United Arab Emirates": ["Abu Dhabi", "Dubai", "Sharjah"],
  Singapore: ["Central Region", "East Region", "North Region", "West Region"],
  Malaysia: ["Johor", "Kuala Lumpur", "Penang", "Selangor"],
  Germany: ["Bavaria", "Berlin", "Hamburg", "Hesse"],
  France: ["Ile-de-France", "Nouvelle-Aquitaine", "Occitanie", "Provence-Alpes-Cote d'Azur"],
  Italy: ["Lazio", "Lombardy", "Sicily", "Veneto"],
  Spain: ["Andalusia", "Catalonia", "Madrid", "Valencian Community"],
  Japan: ["Aichi", "Hokkaido", "Osaka", "Tokyo"],
  China: ["Beijing", "Guangdong", "Shanghai", "Zhejiang"],
  "South Africa": ["Gauteng", "KwaZulu-Natal", "Western Cape"],
  Brazil: ["Bahia", "Rio de Janeiro", "Sao Paulo"],
};

const citiesByState: Record<string, string[]> = {
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  Kerala: ["Kochi", "Kozhikode", "Thiruvananthapuram"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru"],
  Maharashtra: ["Mumbai", "Nagpur", "Pune"],
  Delhi: ["New Delhi", "Dwarka", "Rohini"],
  Telangana: ["Hyderabad", "Secunderabad", "Warangal"],
  California: ["Los Angeles", "San Diego", "San Francisco"],
  Florida: ["Miami", "Orlando", "Tampa"],
  "New York": ["Albany", "Buffalo", "New York City"],
  Texas: ["Austin", "Dallas", "Houston"],
  Washington: ["Seattle", "Spokane", "Tacoma"],
  England: ["Birmingham", "London", "Manchester"],
  Scotland: ["Edinburgh", "Glasgow"],
  Wales: ["Cardiff", "Swansea"],
  "Northern Ireland": ["Belfast", "Derry"],
  "New South Wales": ["Newcastle", "Sydney"],
  Queensland: ["Brisbane", "Gold Coast"],
  Victoria: ["Geelong", "Melbourne"],
  "Western Australia": ["Fremantle", "Perth"],
  Alberta: ["Calgary", "Edmonton"],
  "British Columbia": ["Vancouver", "Victoria"],
  Ontario: ["Ottawa", "Toronto"],
  Quebec: ["Montreal", "Quebec City"],
  "Abu Dhabi": ["Abu Dhabi", "Al Ain"],
  Dubai: ["Dubai"],
  Sharjah: ["Sharjah"],
  "Central Region": ["Bukit Merah", "Downtown Core"],
  "East Region": ["Bedok", "Tampines"],
  "North Region": ["Woodlands", "Yishun"],
  "West Region": ["Jurong East", "Queenstown"],
  Johor: ["Johor Bahru", "Muar"],
  "Kuala Lumpur": ["Kuala Lumpur"],
  Penang: ["George Town", "Seberang Perai"],
  Selangor: ["Petaling Jaya", "Shah Alam"],
  Bavaria: ["Munich", "Nuremberg"],
  Berlin: ["Berlin"],
  Hamburg: ["Hamburg"],
  Hesse: ["Frankfurt", "Wiesbaden"],
  "Ile-de-France": ["Paris", "Versailles"],
  "Nouvelle-Aquitaine": ["Bordeaux", "Limoges"],
  Occitanie: ["Montpellier", "Toulouse"],
  "Provence-Alpes-Cote d'Azur": ["Marseille", "Nice"],
  Lazio: ["Rome"],
  Lombardy: ["Milan"],
  Sicily: ["Palermo"],
  Veneto: ["Venice", "Verona"],
  Andalusia: ["Malaga", "Seville"],
  Catalonia: ["Barcelona", "Girona"],
  Madrid: ["Madrid"],
  "Valencian Community": ["Alicante", "Valencia"],
  Aichi: ["Nagoya"],
  Hokkaido: ["Sapporo"],
  Osaka: ["Osaka"],
  Tokyo: ["Tokyo"],
  Beijing: ["Beijing"],
  Guangdong: ["Guangzhou", "Shenzhen"],
  Shanghai: ["Shanghai"],
  Zhejiang: ["Hangzhou", "Ningbo"],
  Gauteng: ["Johannesburg", "Pretoria"],
  "KwaZulu-Natal": ["Durban", "Pietermaritzburg"],
  "Western Cape": ["Cape Town", "Stellenbosch"],
  Bahia: ["Salvador"],
  "Rio de Janeiro": ["Rio de Janeiro"],
  "Sao Paulo": ["Campinas", "Sao Paulo"],
};

export function getStates(country: string) {
  return statesByCountry[country] || [];
}

export function getCities(state: string) {
  return citiesByState[state] || [];
}

export function getCitiesForCountry(country: string) {
  return getStates(country).flatMap((state) => getCities(state));
}
export const phoneCountryCodeValues = Array.from(
  new Set(phoneCountryCodes.map((item) => item.value))
);

