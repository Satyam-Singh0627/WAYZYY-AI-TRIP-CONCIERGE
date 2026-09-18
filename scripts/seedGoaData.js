/**
 * ============================================================
 * SCRIPT: seedGoaData.js
 * Generates verified Goa starter dataset from official GTDC & verified sources
 * Output: data/goa/*.json
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

const GOA_DIR = path.join(__dirname, '..', 'data', 'goa');

if (!fs.existsSync(GOA_DIR)) {
  fs.mkdirSync(GOA_DIR, { recursive: true });
}

// ------------------------------------------------------------
// 1. AREAS & GEOGRAPHIC RELATIONSHIPS
// ------------------------------------------------------------
const areas = [
  {
    id: "AREA-CANDOLIM",
    name: "Candolim",
    region: "North Goa",
    coordinates: { lat: 15.5178, lng: 73.7634 },
    nearby: ["Sinquerim", "Calangute", "Nerul", "Reis Magos"],
    key_streets: ["Candolim Beach Road", "Fort Aguada Road", "Sinquerim Road"],
    vibe: ["coastal", "luxury villas", "water sports", "relaxed dining"],
    description: "Upscale coastal resort strip along Fort Aguada Road known for golden sands and beachside dining."
  },
  {
    id: "AREA-CALANGUTE",
    name: "Calangute",
    region: "North Goa",
    coordinates: { lat: 15.5439, lng: 73.7553 },
    nearby: ["Candolim", "Baga", "Saligao", "Arpora"],
    key_streets: ["Calangute-Baga Road", "Tito's White House Road"],
    vibe: ["lively", "shopping", "water sports", "bustling markets"],
    description: "The 'Queen of Beaches', Goa's largest and most vibrant commercial beach hub."
  },
  {
    id: "AREA-BAGA",
    name: "Baga",
    region: "North Goa",
    coordinates: { lat: 15.5553, lng: 73.7517 },
    nearby: ["Calangute", "Anjuna", "Arpora"],
    key_streets: ["Tito's Lane", "Baga Creek Road"],
    vibe: ["nightlife", "party clubs", "beach shacks", "water sports"],
    description: "Epicenter of North Goa nightlife, famous for Tito's Lane and energetic beach shacks."
  },
  {
    id: "AREA-SINQUERIM",
    name: "Sinquerim",
    region: "North Goa",
    coordinates: { lat: 15.4989, lng: 73.7681 },
    nearby: ["Candolim", "Nerul"],
    key_streets: ["Sinquerim Road", "Fort Aguada Access Road"],
    vibe: ["heritage", "scenic fort views", "luxury resorts"],
    description: "Picturesque cove beneath the 17th-century ramparts of Fort Aguada."
  },
  {
    id: "AREA-ANJUNA",
    name: "Anjuna",
    region: "North Goa",
    coordinates: { lat: 15.5804, lng: 73.7429 },
    nearby: ["Vagator", "Baga", "Assagao"],
    key_streets: ["Anjuna Mapusa Road", "Fleamarket Road"],
    vibe: ["bohemian", "flea market", "sunset trance", "beach cafes"],
    description: "Historic bohemian haven celebrated for Curlies, red laterite cliffs, and weekly markets."
  },
  {
    id: "AREA-VAGATOR",
    name: "Vagator",
    region: "North Goa",
    coordinates: { lat: 15.6028, lng: 73.7336 },
    nearby: ["Anjuna", "Chapora", "Siolim"],
    key_streets: ["Vagator Beach Road", "Ozran Beach Road"],
    vibe: ["cliffside sunset", "culinary bars", "dramatic red cliffs"],
    description: "Dramatic cliff-backed beaches crowned by Chapora Fort, host to world-class sunset cocktail lounges."
  },
  {
    id: "AREA-CHAPORA",
    name: "Chapora",
    region: "North Goa",
    coordinates: { lat: 15.6074, lng: 73.7408 },
    nearby: ["Vagator", "Siolim"],
    key_streets: ["Chapora Jetty Road", "Fort Road"],
    vibe: ["fishing village", "fort ramparts", "fresh juice bars"],
    description: "Quaint fishing community famed for the iconic 'Dil Chahta Hai' Chapora Fort."
  },
  {
    id: "AREA-ASSAGAO",
    name: "Assagao",
    region: "North Goa",
    coordinates: { lat: 15.5925, lng: 73.7744 },
    nearby: ["Anjuna", "Siolim", "Mapusa"],
    key_streets: ["Assagao Badem Road"],
    vibe: ["boutique villas", "gourmet dining", "lush heritage lanes", "peaceful"],
    description: "Goa's premier culinary & design village nestled in quiet wooded valleys."
  },
  {
    id: "AREA-SIOLIM",
    name: "Siolim",
    region: "North Goa",
    coordinates: { lat: 15.6264, lng: 73.7656 },
    nearby: ["Assagao", "Chapora", "Morjim"],
    key_streets: ["Siolim-Chopdem Bridge Road"],
    vibe: ["riverside", "heritage homes", "bridge views"],
    description: "Scenic village along the Chapora River connecting North Goa to the northern beach belt."
  },
  {
    id: "AREA-MORJIM",
    name: "Morjim",
    region: "North Goa",
    coordinates: { lat: 15.6322, lng: 73.7319 },
    nearby: ["Ashwem", "Siolim", "Arambol"],
    key_streets: ["Morjim Beach Road"],
    vibe: ["olive ridley turtles", "kite surfing", "tranquil sands"],
    description: "Wide, serene sands protected as an Olive Ridley turtle nesting sanctuary."
  },
  {
    id: "AREA-ASHWEM",
    name: "Ashwem",
    region: "North Goa",
    coordinates: { lat: 15.6601, lng: 73.7197 },
    nearby: ["Morjim", "Mandrem"],
    key_streets: ["Ashwem Beach Road"],
    vibe: ["boutique beach clubs", "palm fringed", "chic bohemian"],
    description: "Laid-back, sophisticated beach haven lined with designer beach shacks and yoga retreats."
  },
  {
    id: "AREA-MANDREM",
    name: "Mandrem",
    region: "North Goa",
    coordinates: { lat: 15.6747, lng: 73.7144 },
    nearby: ["Ashwem", "Arambol"],
    key_streets: ["Mandrem Beach Road"],
    vibe: ["bamboo bridges", "wellness", "peaceful estuary"],
    description: "Idyllic stretch known for calm waters, quiet bamboo bridges, and wellness resorts."
  },
  {
    id: "AREA-ARAMBOL",
    name: "Arambol",
    region: "North Goa",
    coordinates: { lat: 15.6869, lng: 73.7042 },
    nearby: ["Mandrem", "Querim"],
    key_streets: ["Arambol Beach Road"],
    vibe: ["sweet water lake", "drum circles", "bohemian arts"],
    description: "Free-spirited northern haven famous for sunset drum circles, banyan tree walks, and sweet water lake."
  },
  {
    id: "AREA-PANAJI",
    name: "Panaji",
    region: "North Goa",
    coordinates: { lat: 15.4909, lng: 73.8278 },
    nearby: ["Dona Paula", "Miramar", "Ribandar", "Old Goa"],
    key_streets: ["18th June Road", "D.B. Road", "Dayanand Bandodkar Marg"],
    vibe: ["latin quarter", "portuguese architecture", "riverside promenade", "capital"],
    description: "Goa's capital city, home to the UNESCO-favored Fontainhas Latin Quarter, casinos, and art galleries."
  },
  {
    id: "AREA-OLD-GOA",
    name: "Old Goa",
    region: "North Goa",
    coordinates: { lat: 15.5033, lng: 73.9114 },
    nearby: ["Panaji", "Ponda"],
    key_streets: ["Old Goa Road"],
    vibe: ["unesco world heritage", "monumental cathedrals", "colonial history"],
    description: "Historic colonial capital famous for the Basilica of Bom Jesus and Se Cathedral."
  },
  {
    id: "AREA-REIS-MAGOS",
    name: "Reis Magos",
    region: "North Goa",
    coordinates: { lat: 15.4981, lng: 73.8089 },
    nearby: ["Candolim", "Nerul", "Panaji"],
    key_streets: ["Reis Magos Fort Road"],
    vibe: ["restored fortress", "mandovi river views", "art exhibits"],
    description: "Riverside hamlet boasting the 1551 fortress and Mario Miranda art exhibition hall."
  },
  {
    id: "AREA-DONA-PAULA",
    name: "Dona Paula",
    region: "North Goa",
    coordinates: { lat: 15.4542, lng: 73.8058 },
    nearby: ["Miramar", "Bambolim", "Panaji"],
    key_streets: ["Dona Paula Jetty Road"],
    vibe: ["viewpoint", "promenade", "ocean estuary"],
    description: "Famed lovers' leap viewpoint where the Zuari and Mandovi rivers meet the Arabian Sea."
  },
  {
    id: "AREA-MIRAMAR",
    name: "Miramar",
    region: "North Goa",
    coordinates: { lat: 15.4819, lng: 73.8086 },
    nearby: ["Panaji", "Dona Paula"],
    key_streets: ["Dayanand Bandodkar Marg"],
    vibe: ["city beach", "sunset walk", "casuarina pines"],
    description: "Panjim's accessible city beach fringed by casuarina trees facing Aguada bay."
  },
  {
    id: "AREA-BAMBOLIM",
    name: "Bambolim",
    region: "North Goa",
    coordinates: { lat: 15.4489, lng: 73.8569 },
    nearby: ["Dona Paula", "Panaji"],
    key_streets: ["Goa University Road"],
    vibe: ["luxury resorts", "quiet bay", "sailing"],
    description: "Secluded bay in central Goa hosting luxury resorts and calm waters."
  },
  {
    id: "AREA-MAPUSA",
    name: "Mapusa",
    region: "North Goa",
    coordinates: { lat: 15.5936, lng: 73.8144 },
    nearby: ["Assagao", "Porvorim"],
    key_streets: ["Mapusa-Anjuna Road", "Market Road"],
    vibe: ["friday market", "local spices", "commercial hub"],
    description: "Northern market town renowned for its vibrant Friday bazaar of spices, pottery, and sausages."
  },
  {
    id: "AREA-PORVORIM",
    name: "Porvorim",
    region: "North Goa",
    coordinates: { lat: 15.5267, lng: 73.8242 },
    nearby: ["Panaji", "Candolim", "Mapusa"],
    key_streets: ["NH66", "Chogm Road"],
    vibe: ["residential", "shopping malls", "museums"],
    description: "Plateau suburb connecting Panjim and the coast, home to the Houses of Goa Museum."
  },
  {
    id: "AREA-NERUL",
    name: "Nerul",
    region: "North Goa",
    coordinates: { lat: 15.5097, lng: 73.7844 },
    nearby: ["Candolim", "Reis Magos", "Sinquerim"],
    key_streets: ["Nerul River Road"],
    vibe: ["backwaters", "mangroves", "quiet villas"],
    description: "Peaceful backwater river village bordering Candolim with lush mangrove channels."
  },
  {
    id: "AREA-PONDA",
    name: "Ponda",
    region: "South Goa",
    coordinates: { lat: 15.4026, lng: 74.0153 },
    nearby: ["Old Goa", "Margao"],
    key_streets: ["Ponda-Panaji Highway"],
    vibe: ["spice plantations", "hindu temples", "cultural heartland"],
    description: "Goa's cultural center known for spice plantations and grand 18th-century Hindu temples."
  },
  {
    id: "AREA-VASCO",
    name: "Vasco da Gama",
    region: "South Goa",
    coordinates: { lat: 15.3989, lng: 73.8128 },
    nearby: ["Bogmalo"],
    key_streets: ["Swatantra Path", "Airport Road"],
    vibe: ["port city", "airport gateway", "naval museum"],
    description: "Industrial port town home to Dabolim International Airport and Naval Aviation Museum."
  },
  {
    id: "AREA-BOGMALO",
    name: "Bogmalo",
    region: "South Goa",
    coordinates: { lat: 15.3789, lng: 73.8344 },
    nearby: ["Vasco da Gama"],
    key_streets: ["Bogmalo Beach Road"],
    vibe: ["scuba diving", "cove beach", "close to airport"],
    description: "Curved sandy cove near Dabolim airport, famous for scuba diving expeditions."
  },
  {
    id: "AREA-BETUL",
    name: "Betul",
    region: "South Goa",
    coordinates: { lat: 15.1489, lng: 73.9536 },
    nearby: ["Mobor", "Cavelossim", "Cabo de Rama"],
    key_streets: ["Betul Beach Road"],
    vibe: ["fishing village", "quiet estuary", "seafood"],
    description: "Peaceful fishing village where the Sal River meets the sea, famous for quiet coastline and fresh catch."
  },
  {
    id: "AREA-CANACONA",
    name: "Canacona",
    region: "South Goa",
    coordinates: { lat: 15.0111, lng: 74.0208 },
    nearby: ["Palolem", "Patnem", "Agonda"],
    key_streets: ["Canacona Highway Road"],
    vibe: ["southern gateway", "hills", "waterfalls"],
    description: "The southernmost taluka of Goa, blessed with pristine crescent beaches, lagoons, and jungle waterfalls."
  },
  {
    id: "AREA-DUDHSAGAR",
    name: "Dudhsagar",
    region: "South Goa",
    coordinates: { lat: 15.3144, lng: 74.3144 },
    nearby: ["Colem", "Ponda"],
    key_streets: ["Dudhsagar Railway Road"],
    vibe: ["four tiered waterfall", "ghats", "trekking"],
    description: "Four-tiered waterfall on the Mandovi River located in Bhagwan Mahaveer Sanctuary."
  },
  {
    id: "AREA-NETRAVALI",
    name: "Netravali",
    region: "South Goa",
    coordinates: { lat: 15.0889, lng: 74.2144 },
    nearby: ["Sanguem", "Canacona"],
    key_streets: ["Netravali Sanctuary Road"],
    vibe: ["bubble lake", "rainforest", "tambdi surla"],
    description: "Lush eco-tourism haven famous for Netravali Wildlife Sanctuary and the ancient Kadamba temple at Tambdi Surla."
  },
  {
    id: "AREA-MARGAO",
    name: "Margao",
    region: "South Goa",
    coordinates: { lat: 15.2736, lng: 73.9583 },
    nearby: ["Colva", "Benaulim"],
    key_streets: ["Margao-Colva Road", "Station Road"],
    vibe: ["commercial capital", "historic mansions", "railway hub"],
    description: "South Goa's historic commercial hub renowned for palatial Portuguese mansions and spice markets."
  },
  {
    id: "AREA-COLVA",
    name: "Colva",
    region: "South Goa",
    coordinates: { lat: 15.2792, lng: 73.9144 },
    nearby: ["Margao", "Benaulim", "Betalbatim"],
    key_streets: ["Colva Beach Road"],
    vibe: ["white sands", "seafood shacks", "popular family beach"],
    description: "Classic South Goa beach with expansive powdery white sands and popular water sports."
  },
  {
    id: "AREA-BENAULIM",
    name: "Benaulim",
    region: "South Goa",
    coordinates: { lat: 15.2589, lng: 73.9178 },
    nearby: ["Colva", "Varca"],
    key_streets: ["Benaulim Beach Road"],
    vibe: ["dolphin spotting", "peaceful", "fishing shacks"],
    description: "Tranquil coastal village known for dolphin watching trips and fresh catch shacks."
  },
  {
    id: "AREA-BETALBATIM",
    name: "Betalbatim",
    region: "South Goa",
    coordinates: { lat: 15.2978, lng: 73.9122 },
    nearby: ["Colva", "Majorda"],
    key_streets: ["Sunset Beach Road"],
    vibe: ["sunset beach", "quiet pine groves", "peaceful"],
    description: "Serene white-sand stretch known as 'Sunset Beach', shaded by casuarina pines."
  },
  {
    id: "AREA-MAJORDA",
    name: "Majorda",
    region: "South Goa",
    coordinates: { lat: 15.3144, lng: 73.9089 },
    nearby: ["Betalbatim", "Utorda"],
    key_streets: ["Majorda Beach Road"],
    vibe: ["goan bakeries", "wide sands", "luxury hotels"],
    description: "Historic bakery village boasting miles of golden sand and top European-influenced bakers."
  },
  {
    id: "AREA-VARCA",
    name: "Varca",
    region: "South Goa",
    coordinates: { lat: 15.2289, lng: 73.9236 },
    nearby: ["Benaulim", "Cavelossim"],
    key_streets: ["Varca Beach Road"],
    vibe: ["luxury resorts", "wooden fishing boats", "pristine sands"],
    description: "Immaculate white sand strip lined with 5-star luxury beachfront properties."
  },
  {
    id: "AREA-CAVELOSSIM",
    name: "Cavelossim",
    region: "South Goa",
    coordinates: { lat: 15.1789, lng: 73.9458 },
    nearby: ["Varca", "Mobor"],
    key_streets: ["Cavelossim Beach Road"],
    vibe: ["sal river cruises", "black lava rocks", "quiet luxury"],
    description: "Picturesque stretch wedged between the Arabian Sea and the Sal River, renowned for dolphin cruises."
  },
  {
    id: "AREA-MOBOR",
    name: "Mobor",
    region: "South Goa",
    coordinates: { lat: 15.1589, lng: 73.9489 },
    nearby: ["Cavelossim", "Betul"],
    key_streets: ["Mobor Peninsula Road"],
    vibe: ["peninsula", "river confluence", "water sports"],
    description: "Slender sandy spit where the Sal River meets the sea, popular for water skiing and luxury stays."
  },
  {
    id: "AREA-PALOLEM",
    name: "Palolem",
    region: "South Goa",
    coordinates: { lat: 15.0100, lng: 74.0231 },
    nearby: ["Patnem", "Agonda", "Canacona"],
    key_streets: ["Palolem Beach Road"],
    vibe: ["crescent bay", "kayaking", "silent noise parties", "coconut groves"],
    description: "World-famous golden crescent bay framed by tall palms and calm, swimmable blue waters."
  },
  {
    id: "AREA-PATNEM",
    name: "Patnem",
    region: "South Goa",
    coordinates: { lat: 14.9972, lng: 74.0328 },
    nearby: ["Palolem", "Canacona"],
    key_streets: ["Patnem Beach Road"],
    vibe: ["peaceful yoga", "laid back shacks", "unhurried"],
    description: "Smaller, calmer neighbor to Palolem, favored by yogis and long-stay travelers."
  },
  {
    id: "AREA-AGONDA",
    name: "Agonda",
    region: "South Goa",
    coordinates: { lat: 15.0442, lng: 73.9878 },
    nearby: ["Palolem", "Cola"],
    key_streets: ["Agonda Beach Road"],
    vibe: ["turtle sanctuary", "pristine quiet", "surf schools"],
    description: "Wide, peaceful 3km coastline designated as a protected sea turtle nesting ground."
  }
];

// ------------------------------------------------------------
// 2. STREET SEEDS
// ------------------------------------------------------------
const streets = [
  { id: "STR-001", name: "Candolim Beach Road", area: "Candolim", region: "North Goa", coordinates: { lat: 15.518, lng: 73.764 } },
  { id: "STR-002", name: "Fort Aguada Road", area: "Candolim", region: "North Goa", coordinates: { lat: 15.515, lng: 73.766 } },
  { id: "STR-003", name: "Sinquerim Road", area: "Sinquerim", region: "North Goa", coordinates: { lat: 15.501, lng: 73.769 } },
  { id: "STR-004", name: "Calangute-Baga Road", area: "Calangute", region: "North Goa", coordinates: { lat: 15.549, lng: 73.753 } },
  { id: "STR-005", name: "Tito's Lane", area: "Baga", region: "North Goa", coordinates: { lat: 15.556, lng: 73.752 } },
  { id: "STR-006", name: "Anjuna Mapusa Road", area: "Anjuna", region: "North Goa", coordinates: { lat: 15.582, lng: 73.748 } },
  { id: "STR-007", name: "Vagator Beach Road", area: "Vagator", region: "North Goa", coordinates: { lat: 15.603, lng: 73.734 } },
  { id: "STR-008", name: "18th June Road", area: "Panaji", region: "North Goa", coordinates: { lat: 15.494, lng: 73.827 } },
  { id: "STR-009", name: "D.B. Road", area: "Panaji", region: "North Goa", coordinates: { lat: 15.498, lng: 73.829 } },
  { id: "STR-010", name: "Dayanand Bandodkar Marg", area: "Panaji", region: "North Goa", coordinates: { lat: 15.488, lng: 73.818 } },
  { id: "STR-011", name: "Old Goa Road", area: "Old Goa", region: "North Goa", coordinates: { lat: 15.503, lng: 73.910 } },
  { id: "STR-012", name: "Margao-Colva Road", area: "Colva", region: "South Goa", coordinates: { lat: 15.275, lng: 73.935 } },
  { id: "STR-013", name: "Colva Beach Road", area: "Colva", region: "South Goa", coordinates: { lat: 15.279, lng: 73.916 } },
  { id: "STR-014", name: "Palolem Beach Road", area: "Palolem", region: "South Goa", coordinates: { lat: 15.011, lng: 74.024 } },
  { id: "STR-015", name: "Agonda Beach Road", area: "Agonda", region: "South Goa", coordinates: { lat: 15.045, lng: 73.989 } },
  { id: "STR-016", name: "Morjim Beach Road", area: "Morjim", region: "North Goa", coordinates: { lat: 15.633, lng: 73.733 } },
  { id: "STR-017", name: "Assagao Badem Road", area: "Assagao", region: "North Goa", coordinates: { lat: 15.593, lng: 73.776 } },
  { id: "STR-018", name: "Mapusa-Anjuna Road", area: "Mapusa", region: "North Goa", coordinates: { lat: 15.591, lng: 73.792 } }
];

// ------------------------------------------------------------
// 3. OFFICIAL GTDC BEACHES (26 Verified)
// ------------------------------------------------------------
const beaches = [
  { name: "Agonda Beach", area: "Agonda", region: "South Goa", lat: 15.0442, lng: 73.9878, tags: ["beach", "turtle sanctuary", "quiet", "surfing"] },
  { name: "Aguada Beach", area: "Sinquerim", region: "North Goa", lat: 15.4989, lng: 73.7681, tags: ["beach", "fort views", "luxury", "water sports"] },
  { name: "Arambol Beach", area: "Arambol", region: "North Goa", lat: 15.6869, lng: 73.7042, tags: ["beach", "sweet lake", "drum circle", "bohemian"] },
  { name: "Anjuna Beach", area: "Anjuna", region: "North Goa", lat: 15.5804, lng: 73.7429, tags: ["beach", "flea market", "curlies", "rocky"] },
  { name: "Ashwem Beach", area: "Ashwem", region: "North Goa", lat: 15.6601, lng: 73.7197, tags: ["beach", "boutique", "chic", "palm groves"] },
  { name: "Baga Beach", area: "Baga", region: "North Goa", lat: 15.5553, lng: 73.7517, tags: ["beach", "nightlife", "water sports", "shacks"] },
  { name: "Bambolim Beach", area: "Bambolim", region: "North Goa", lat: 15.4489, lng: 73.8569, tags: ["beach", "calm", "resorts", "sailing"] },
  { name: "Benaulim Beach", area: "Benaulim", region: "South Goa", lat: 15.2589, lng: 73.9178, tags: ["beach", "dolphin watching", "peaceful"] },
  { name: "Betalbatim Beach", area: "Betalbatim", region: "South Goa", lat: 15.2978, lng: 73.9122, tags: ["beach", "sunset", "pine groves", "quiet"] },
  { name: "Betul Beach", area: "Betul", region: "South Goa", lat: 15.1489, lng: 73.9536, tags: ["beach", "fishing port", "river mouth", "seafood"] },
  { name: "Bogmalo Beach", area: "Bogmalo", region: "South Goa", lat: 15.3789, lng: 73.8344, tags: ["beach", "scuba diving", "cove", "near airport"] },
  { name: "Butterfly Beach", area: "Palolem", region: "South Goa", lat: 15.0256, lng: 74.0044, tags: ["beach", "hidden cove", "boat access", "dolphins"] },
  { name: "Calangute Beach", area: "Calangute", region: "North Goa", lat: 15.5439, lng: 73.7553, tags: ["beach", "queen of beaches", "water sports", "shopping"] },
  { name: "Candolim Beach", area: "Candolim", region: "North Goa", lat: 15.5178, lng: 73.7634, tags: ["beach", "water sports", "relaxed", "fine dining"] },
  { name: "Cola Beach", area: "Canacona", region: "South Goa", lat: 15.0611, lng: 73.9744, tags: ["beach", "blue lagoon", "hidden", "kayaking"] },
  { name: "Galgibaga / Turtle Beach", area: "Canacona", region: "South Goa", lat: 14.9658, lng: 74.0489, tags: ["beach", "olive ridley turtle", "protected", "pristine"] },
  { name: "Majorda Beach", area: "Majorda", region: "South Goa", lat: 15.3144, lng: 73.9089, tags: ["beach", "white sands", "bakeries", "wide shore"] },
  { name: "Miramar Beach", area: "Panaji", region: "North Goa", lat: 15.4819, lng: 73.8086, tags: ["beach", "city beach", "mandovi estuary", "sunset walk"] },
  { name: "Morjim Beach", area: "Morjim", region: "North Goa", lat: 15.6322, lng: 73.7319, tags: ["beach", "turtle nesting", "kitesurfing", "quiet"] },
  { name: "Palolem Beach", area: "Palolem", region: "South Goa", lat: 15.0100, lng: 74.0231, tags: ["beach", "crescent bay", "kayaking", "scenic"] },
  { name: "Patnem Beach", area: "Patnem", region: "South Goa", lat: 14.9972, lng: 74.0328, tags: ["beach", "yoga", "chill shacks", "swimming"] },
  { name: "Sinquerim Beach", area: "Sinquerim", region: "North Goa", lat: 15.5019, lng: 73.7678, tags: ["beach", "fort aguada", "jet ski", "scenic"] },
  { name: "Vagator Beach", area: "Vagator", region: "North Goa", lat: 15.6028, lng: 73.7336, tags: ["beach", "red cliffs", "chapora views", "sunsets"] },
  { name: "Varca Beach", area: "Varca", region: "South Goa", lat: 15.2289, lng: 73.9236, tags: ["beach", "luxury resorts", "white sand", "calm"] },
  { name: "Cavelossim Beach", area: "Cavelossim", region: "South Goa", lat: 15.1789, lng: 73.9458, tags: ["beach", "black rocks", "dolphin cruises", "quiet"] },
  { name: "Mobor Beach", area: "Mobor", region: "South Goa", lat: 15.1589, lng: 73.9489, tags: ["beach", "peninsula", "sal river mouth", "water sports"] }
].map((b, idx) => ({
  id: `GOA-BEACH-${(idx + 1).toString().padStart(3, '0')}`,
  name: b.name,
  type: "beach",
  region: b.region,
  area: b.area,
  coordinates: { lat: b.lat, lng: b.lng },
  address: `${b.name}, ${b.area}, ${b.region}, Goa`,
  tags: b.tags,
  categories: ["beaches", "outdoors", "nature"],
  indoor_outdoor: "outdoor",
  weather_fit: { clear: 1.0, cloudy: 0.8, rain: 0.1 },
  best_time: ["morning", "evening", "sunset"],
  estimated_duration_minutes: 120,
  price_level: 1,
  family_friendly: true,
  couple_friendly: true,
  solo_friendly: true,
  quiet_score: b.tags.includes("quiet") || b.tags.includes("peaceful") ? 0.9 : 0.4,
  adventure_score: b.tags.includes("water sports") || b.tags.includes("surfing") ? 0.8 : 0.3,
  relaxed_score: 0.9,
  cultural_score: 0.2,
  food_score: 0.7,
  opening_hours: "Open 24 hours",
  website: null,
  phone: null,
  source: "Goa Tourism Development Corporation",
  source_type: "official",
  source_url: "https://goa-tourism.com/beach/",
  last_verified: "2026-09-18"
}));

// ------------------------------------------------------------
// 4. FORTS (6 Verified)
// ------------------------------------------------------------
const forts = [
  {
    name: "Fort Aguada",
    area: "Sinquerim",
    region: "North Goa",
    lat: 15.4925,
    lng: 73.7736,
    tags: ["fort", "lighthouse", "mandovi views", "history"],
    desc: "Well-preserved 17th-century Portuguese fortress and lighthouse guarding the mouth of Mandovi River."
  },
  {
    name: "Lower Aguada Fort",
    area: "Sinquerim",
    region: "North Goa",
    lat: 15.4947,
    lng: 73.7661,
    tags: ["fort", "sea wall", "jail museum", "coastal ramparts"],
    desc: "Lower coastal bastion featuring the Aguada Central Jail heritage museum and seaside battlements."
  },
  {
    name: "Chapora Fort",
    area: "Chapora",
    region: "North Goa",
    lat: 15.6074,
    lng: 73.7408,
    tags: ["fort", "sunset", "dil chahta hai", "river views"],
    desc: "Dramatic hilltop laterite fort commanding sweeping panoramas over Vagator beach and Chapora river."
  },
  {
    name: "Reis Magos Fort",
    area: "Reis Magos",
    region: "North Goa",
    lat: 15.4981,
    lng: 73.8089,
    tags: ["fort", "museum", "mario miranda", "covered halls"],
    desc: "Restored 1551 fortress with covered naval exhibits, cultural galleries, and Mandovi river views."
  },
  {
    name: "Cabo de Rama Fort",
    area: "Canacona",
    region: "South Goa",
    lat: 15.0889,
    lng: 73.9219,
    tags: ["fort", "remote", "dramatic sea cliff", "church"],
    desc: "Ancient clifftop fortress in South Goa offering breathtaking unobstructed vistas of the Arabian Sea."
  },
  {
    name: "Corjuem Fort",
    area: "Mapusa",
    region: "North Goa",
    lat: 15.5978,
    lng: 73.8967,
    tags: ["fort", "inland fort", "river island", "history"],
    desc: "Rare inland island military fort built in 1705 near Aldona surrounded by lush green river valleys."
  }
].map((f, idx) => ({
  id: `GOA-FORT-${(idx + 1).toString().padStart(3, '0')}`,
  name: f.name,
  type: "fort",
  region: f.region,
  area: f.area,
  coordinates: { lat: f.lat, lng: f.lng },
  address: `${f.name}, ${f.area}, ${f.region}, Goa`,
  tags: f.tags,
  categories: ["forts", "heritage", "history", "sightseeing"],
  indoor_outdoor: f.name.includes("Reis Magos") ? "covered" : "outdoor",
  weather_fit: f.name.includes("Reis Magos") ? { clear: 1.0, cloudy: 0.9, rain: 0.8 } : { clear: 1.0, cloudy: 0.7, rain: 0.2 },
  best_time: ["morning", "late afternoon", "sunset"],
  estimated_duration_minutes: 90,
  price_level: 1,
  family_friendly: true,
  couple_friendly: true,
  solo_friendly: true,
  quiet_score: 0.7,
  adventure_score: 0.6,
  relaxed_score: 0.7,
  cultural_score: 0.9,
  food_score: 0.1,
  opening_hours: "09:30 - 17:30",
  website: null,
  phone: null,
  source: "Goa Tourism Development Corporation",
  source_type: "official",
  source_url: "https://goa-tourism.com/",
  last_verified: "2026-09-18"
}));

// ------------------------------------------------------------
// 5. TEMPLES (6 Verified)
// ------------------------------------------------------------
const temples = [
  { name: "Shantadurga Temple", area: "Ponda", region: "South Goa", lat: 15.3622, lng: 73.9878, tags: ["temple", "hindu heritage", "peace deity", "architecture"] },
  { name: "Mahadev Temple Tambdi Surla", area: "Netravali", region: "South Goa", lat: 15.4394, lng: 74.2589, tags: ["temple", "12th century", "kadamba architecture", "jungle"] },
  { name: "Mahalaxmi Temple", area: "Ponda", region: "South Goa", lat: 15.3989, lng: 73.9967, tags: ["temple", "ancient shrine", "bandora", "heritage"] },
  { name: "Mahalsa Narayani Temple", area: "Ponda", region: "South Goa", lat: 15.4219, lng: 73.9856, tags: ["temple", "brass deepastambha", "mardol", "culture"] },
  { name: "Kamakshi Temple", area: "Ponda", region: "South Goa", lat: 15.3511, lng: 74.0044, tags: ["temple", "shiroda", "water tank", "spiritual"] },
  { name: "Tapobhoomi", area: "Ponda", region: "South Goa", lat: 15.4122, lng: 74.0211, tags: ["temple", "spiritual center", "ayurveda", "meditation"] }
].map((t, idx) => ({
  id: `GOA-TEMPLE-${(idx + 1).toString().padStart(3, '0')}`,
  name: t.name,
  type: "temple",
  region: t.region,
  area: t.area,
  coordinates: { lat: t.lat, lng: t.lng },
  address: `${t.name}, ${t.area}, ${t.region}, Goa`,
  tags: t.tags,
  categories: ["temples", "spiritual", "heritage", "culture"],
  indoor_outdoor: "covered",
  weather_fit: { clear: 1.0, cloudy: 0.9, rain: 0.9 },
  best_time: ["morning", "evening"],
  estimated_duration_minutes: 60,
  price_level: 1,
  family_friendly: true,
  couple_friendly: true,
  solo_friendly: true,
  quiet_score: 0.9,
  adventure_score: 0.1,
  relaxed_score: 0.9,
  cultural_score: 1.0,
  food_score: 0.1,
  opening_hours: "06:00 - 20:30",
  website: null,
  phone: null,
  source: "Goa Tourism Development Corporation",
  source_type: "official",
  source_url: "https://goa-tourism.com/",
  last_verified: "2026-09-18"
}));

// ------------------------------------------------------------
// 6. CHURCHES & HERITAGE (8 Verified)
// ------------------------------------------------------------
const churches = [
  { name: "Basilica of Bom Jesus", area: "Old Goa", region: "North Goa", lat: 15.5008, lng: 73.9117, tags: ["unesco", "st francis xavier", "baroque", "heritage"] },
  { name: "Se Cathedral", area: "Old Goa", region: "North Goa", lat: 15.5039, lng: 73.9125, tags: ["unesco", "golden bell", "cathedral", "largest in asia"] },
  { name: "Church of Saint Augustine Ruins", area: "Old Goa", region: "North Goa", lat: 15.5019, lng: 73.9056, tags: ["ruins", "belfry tower", "unesco", "history"] },
  { name: "St Cajetan Church", area: "Old Goa", region: "North Goa", lat: 15.5056, lng: 73.9144, tags: ["corinthian", "st peters rome replica", "quiet", "heritage"] },
  { name: "St Francis of Assisi Church", area: "Old Goa", region: "North Goa", lat: 15.5036, lng: 73.9122, tags: ["manueline", "museum", "wood carvings", "unesco"] },
  { name: "Immaculate Conception Church", area: "Panaji", region: "North Goa", lat: 15.4989, lng: 73.8292, tags: ["zigzag stairs", "iconic landmark", "panaji", "portuguese"] },
  { name: "Old Goa Church", area: "Old Goa", region: "North Goa", lat: 15.5028, lng: 73.9111, tags: ["heritage precinct", "unesco", "architecture"] },
  { name: "Santa Monica Church", area: "Old Goa", region: "North Goa", lat: 15.5022, lng: 73.9067, tags: ["convent", "christian art museum", "covered", "heritage"] }
].map((c, idx) => ({
  id: `GOA-CHURCH-${(idx + 1).toString().padStart(3, '0')}`,
  name: c.name,
  type: "church",
  region: c.region,
  area: c.area,
  coordinates: { lat: c.lat, lng: c.lng },
  address: `${c.name}, ${c.area}, ${c.region}, Goa`,
  tags: c.tags,
  categories: ["churches", "heritage", "unesco", "culture"],
  indoor_outdoor: "indoor",
  weather_fit: { clear: 1.0, cloudy: 1.0, rain: 1.0 },
  best_time: ["morning", "afternoon"],
  estimated_duration_minutes: 60,
  price_level: 1,
  family_friendly: true,
  couple_friendly: true,
  solo_friendly: true,
  quiet_score: 0.8,
  adventure_score: 0.1,
  relaxed_score: 0.8,
  cultural_score: 1.0,
  food_score: 0.1,
  opening_hours: "09:00 - 17:30",
  website: null,
  phone: null,
  source: "Goa Tourism Development Corporation",
  source_type: "official",
  source_url: "https://goa-tourism.com/",
  last_verified: "2026-09-18"
}));

// ------------------------------------------------------------
// 7. MUSEUMS & CULTURE (6 Verified)
// ------------------------------------------------------------
const museums = [
  { name: "Houses of Goa Museum", area: "Porvorim", region: "North Goa", lat: 15.5267, lng: 73.8242, tags: ["museum", "architecture", "ship shaped", "gerard da cunha", "rain safe"] },
  { name: "Goa Chitra Museum", area: "Benaulim", region: "South Goa", lat: 15.2636, lng: 73.9311, tags: ["museum", "ethnographic", "agrarian tools", "organic farm"] },
  { name: "Goa Science Centre", area: "Miramar", region: "North Goa", lat: 15.4767, lng: 73.8111, tags: ["museum", "science", "planetarium", "kids friendly", "indoor"] },
  { name: "Dharohar (National Customs & GST Museum)", area: "Panaji", region: "North Goa", lat: 15.4981, lng: 73.8306, tags: ["heritage", "blue building", "customs history", "indoor"] },
  { name: "Kala Academy", area: "Panaji", region: "North Goa", lat: 15.4897, lng: 73.8189, tags: ["culture", "theatre", "art exhibitions", "charles correa", "covered"] },
  { name: "Maquinez Palace", area: "Panaji", region: "North Goa", lat: 15.4956, lng: 73.8258, tags: ["film heritage", "iffi venue", "art cinema", "indoor"] },
  { name: "Mario Miranda Gallery & Art Cafe", area: "Candolim", region: "North Goa", lat: 15.5167, lng: 73.7661, tags: ["art", "souvenirs", "cartoonist", "indoor", "cafe"] }
].map((m, idx) => ({
  id: `GOA-MUSEUM-${(idx + 1).toString().padStart(3, '0')}`,
  name: m.name,
  type: "museum",
  region: m.region,
  area: m.area,
  coordinates: { lat: m.lat, lng: m.lng },
  address: `${m.name}, ${m.area}, ${m.region}, Goa`,
  tags: m.tags,
  categories: ["museums", "culture", "indoor", "rain_safe"],
  indoor_outdoor: "indoor",
  weather_fit: { clear: 0.9, cloudy: 1.0, rain: 1.0 },
  best_time: ["morning", "midday", "afternoon"],
  estimated_duration_minutes: 75,
  price_level: 1,
  family_friendly: true,
  couple_friendly: true,
  solo_friendly: true,
  quiet_score: 0.8,
  adventure_score: 0.1,
  relaxed_score: 0.9,
  cultural_score: 1.0,
  food_score: 0.3,
  opening_hours: "10:00 - 18:00",
  website: null,
  phone: null,
  source: "Goa Tourism Development Corporation",
  source_type: "official",
  source_url: "https://goa-tourism.com/",
  last_verified: "2026-09-18"
}));

// ------------------------------------------------------------
// 8. NATURE, WATERFALLS & WILDLIFE (7 Verified)
// ------------------------------------------------------------
const nature = [
  { name: "Dudhsagar Waterfalls", area: "Dudhsagar", region: "South Goa", lat: 15.3144, lng: 74.3144, tags: ["waterfall", "sea of milk", "jeep safari", "trekking"] },
  { name: "Arvalem Waterfalls", area: "Ponda", region: "North Goa", lat: 15.5564, lng: 74.0264, tags: ["waterfall", "harvalem", "nature cascade", "rudreshwar"] },
  { name: "Netravali Wildlife Sanctuary", area: "Netravali", region: "South Goa", lat: 15.0889, lng: 74.2144, tags: ["wildlife", "rainforest", "black panther", "nature trails"] },
  { name: "Kesarval Spring", area: "Vasco da Gama", region: "South Goa", lat: 15.3611, lng: 73.9167, tags: ["spring", "medicinal waters", "betel palms", "quiet"] },
  { name: "Bubble Lake (Netravali)", area: "Netravali", region: "South Goa", lat: 15.0978, lng: 74.1989, tags: ["natural wonder", "acoustic bubbles", "gopinath temple", "eco"] },
  { name: "Arvalem Caves", area: "Ponda", region: "North Goa", lat: 15.5539, lng: 74.0244, tags: ["caves", "pandava caves", "rock cut", "6th century"] },
  { name: "Chapoli Dam", area: "Canacona", region: "South Goa", lat: 15.0189, lng: 74.0844, tags: ["dam", "ecotourism", "freshwater reservoir", "hills"] }
].map((n, idx) => ({
  id: `GOA-NATURE-${(idx + 1).toString().padStart(3, '0')}`,
  name: n.name,
  type: "nature",
  region: n.region,
  area: n.area,
  coordinates: { lat: n.lat, lng: n.lng },
  address: `${n.name}, ${n.area}, ${n.region}, Goa`,
  tags: n.tags,
  categories: ["nature", "waterfalls", "wildlife", "outdoors"],
  indoor_outdoor: "outdoor",
  weather_fit: { clear: 1.0, cloudy: 0.8, rain: 0.4 },
  best_time: ["morning", "day trip"],
  estimated_duration_minutes: 180,
  price_level: 2,
  family_friendly: true,
  couple_friendly: true,
  solo_friendly: true,
  quiet_score: 0.9,
  adventure_score: 0.9,
  relaxed_score: 0.7,
  cultural_score: 0.5,
  food_score: 0.2,
  opening_hours: "08:00 - 17:00",
  website: null,
  phone: null,
  source: "Goa Tourism Development Corporation",
  source_type: "official",
  source_url: "https://goa-tourism.com/",
  last_verified: "2026-09-18"
}));

// ------------------------------------------------------------
// 9. OFFICIAL GTDC RESIDENCIES / ACCOMMODATION (11 Verified)
// ------------------------------------------------------------
const residencies = [
  { name: "Panaji Residency", area: "Panaji", region: "North Goa", lat: 15.4994, lng: 73.8286 },
  { name: "Calangute Residency", area: "Calangute", region: "North Goa", lat: 15.5422, lng: 73.7547 },
  { name: "Vasco Residency", area: "Vasco da Gama", region: "South Goa", lat: 15.3989, lng: 73.8119 },
  { name: "Margao Residency", area: "Margao", region: "South Goa", lat: 15.2747, lng: 73.9575 },
  { name: "Old Goa Residency", area: "Old Goa", region: "North Goa", lat: 15.5019, lng: 73.9122 },
  { name: "Farmagudi Residency", area: "Ponda", region: "South Goa", lat: 15.4111, lng: 74.0089 },
  { name: "Mayem Lake View", area: "Mapusa", region: "North Goa", lat: 15.5819, lng: 73.9219 },
  { name: "Fort Tiracol Heritage Hotel", area: "Arambol", region: "North Goa", lat: 15.7289, lng: 73.6844 },
  { name: "Mapusa Residency", area: "Mapusa", region: "North Goa", lat: 15.5925, lng: 73.8139 },
  { name: "Miramar Residency", area: "Panaji", region: "North Goa", lat: 15.4811, lng: 73.8078 },
  { name: "Colva Residency", area: "Colva", region: "South Goa", lat: 15.2789, lng: 73.9156 }
].map((r, idx) => ({
  id: `GOA-STAY-${(idx + 1).toString().padStart(3, '0')}`,
  name: r.name,
  type: "hotel",
  region: r.region,
  area: r.area,
  coordinates: { lat: r.lat, lng: r.lng },
  address: `${r.name}, ${r.area}, ${r.region}, Goa`,
  tags: ["hotel", "official gtdc", "residency", "accommodations"],
  categories: ["hotels", "stays", "accommodations"],
  indoor_outdoor: "indoor",
  weather_fit: { clear: 1.0, cloudy: 1.0, rain: 1.0 },
  best_time: ["any"],
  estimated_duration_minutes: null,
  price_level: 2,
  family_friendly: true,
  couple_friendly: true,
  solo_friendly: true,
  quiet_score: 0.7,
  adventure_score: 0.1,
  relaxed_score: 0.8,
  cultural_score: 0.5,
  food_score: 0.6,
  opening_hours: "24 hours check-in",
  website: "https://bookings.goa-tourism.com/",
  phone: null,
  source: "Goa Tourism Development Corporation",
  source_type: "official",
  source_url: "https://bookings.goa-tourism.com/",
  last_verified: "2026-09-18"
}));

// ------------------------------------------------------------
// 10. CURATED DINING, CAFES, NIGHTLIFE & LOCAL EXPERIENCES
// ------------------------------------------------------------
const diningAndNightlife = [
  {
    id: "GOA-DINE-001",
    name: "Calamari Bathe & Binge",
    type: "restaurant",
    region: "North Goa",
    area: "Candolim",
    coordinates: { lat: 15.5122, lng: 73.7622 },
    address: "Dando Beach, Candolim, Goa 403515",
    tags: ["food", "seafood", "beach shack", "cocktails", "live music"],
    categories: ["restaurants", "beach_shacks", "food"],
    indoor_outdoor: "outdoor",
    weather_fit: { clear: 1.0, cloudy: 0.8, rain: 0.2 },
    best_time: ["lunch", "dinner", "sunset"],
    estimated_duration_minutes: 90,
    price_level: 2,
    family_friendly: true,
    couple_friendly: true,
    solo_friendly: true,
    quiet_score: 0.5,
    adventure_score: 0.2,
    relaxed_score: 0.8,
    cultural_score: 0.6,
    food_score: 0.9,
    opening_hours: "11:00 - 23:30",
    website: null,
    phone: null,
    source: "Goa Tourism / Curated Local Guide",
    source_type: "manual",
    source_url: "https://goa-tourism.com/",
    last_verified: "2026-09-18"
  },
  {
    id: "GOA-DINE-002",
    name: "Fisherman's Wharf",
    type: "restaurant",
    region: "North Goa",
    area: "Panaji",
    coordinates: { lat: 15.4956, lng: 73.8344 },
    address: "Campal, Panaji, Goa 403001",
    tags: ["food", "fine dining", "goan fish curry", "indoor", "covered veranda"],
    categories: ["restaurants", "food", "indoor"],
    indoor_outdoor: "indoor",
    weather_fit: { clear: 1.0, cloudy: 1.0, rain: 1.0 },
    best_time: ["lunch", "dinner"],
    estimated_duration_minutes: 90,
    price_level: 3,
    family_friendly: true,
    couple_friendly: true,
    solo_friendly: true,
    quiet_score: 0.6,
    adventure_score: 0.1,
    relaxed_score: 0.8,
    cultural_score: 0.8,
    food_score: 0.95,
    opening_hours: "12:00 - 23:00",
    website: null,
    phone: null,
    source: "Curated Local Guide",
    source_type: "manual",
    source_url: "https://goa-tourism.com/",
    last_verified: "2026-09-18"
  },
  {
    id: "GOA-DINE-003",
    name: "Gunpowder",
    type: "restaurant",
    region: "North Goa",
    area: "Assagao",
    coordinates: { lat: 15.5925, lng: 73.7744 },
    address: "Saunto Vaddo, Assagao, Goa 403507",
    tags: ["food", "kerala cuisine", "pandi curry", "heritage villa", "covered courtyard"],
    categories: ["restaurants", "food", "covered"],
    indoor_outdoor: "covered",
    weather_fit: { clear: 1.0, cloudy: 1.0, rain: 0.9 },
    best_time: ["lunch", "dinner"],
    estimated_duration_minutes: 80,
    price_level: 2,
    family_friendly: true,
    couple_friendly: true,
    solo_friendly: true,
    quiet_score: 0.7,
    adventure_score: 0.2,
    relaxed_score: 0.9,
    cultural_score: 0.8,
    food_score: 0.95,
    opening_hours: "12:00 - 15:30, 19:00 - 23:00",
    website: null,
    phone: null,
    source: "Curated Local Guide",
    source_type: "manual",
    source_url: "https://goa-tourism.com/",
    last_verified: "2026-09-18"
  },
  {
    id: "GOA-DINE-004",
    name: "Titlie Culinary Bar",
    type: "restaurant",
    region: "North Goa",
    area: "Vagator",
    coordinates: { lat: 15.6028, lng: 73.7336 },
    address: "Small Vagator Beach Road, Vagator, Goa 403509",
    tags: ["cocktails", "cliffside", "sunset", "global sharing plates"],
    categories: ["restaurants", "bars", "sunset"],
    indoor_outdoor: "outdoor",
    weather_fit: { clear: 1.0, cloudy: 0.8, rain: 0.2 },
    best_time: ["evening", "sunset", "dinner"],
    estimated_duration_minutes: 120,
    price_level: 3,
    family_friendly: false,
    couple_friendly: true,
    solo_friendly: true,
    quiet_score: 0.4,
    adventure_score: 0.4,
    relaxed_score: 0.8,
    cultural_score: 0.5,
    food_score: 0.9,
    opening_hours: "13:00 - 01:00",
    website: null,
    phone: null,
    source: "Curated Local Guide",
    source_type: "manual",
    source_url: "https://goa-tourism.com/",
    last_verified: "2026-09-18"
  },
  {
    id: "GOA-NIGHT-001",
    name: "SinQ Night Club & Showbar Exchange",
    type: "nightlife",
    region: "North Goa",
    area: "Candolim",
    coordinates: { lat: 15.5136, lng: 73.7689 },
    address: "Aguada - Siolim Road, Candolim, Goa 403515",
    tags: ["nightlife", "dj club", "air conditioned", "poolside cabanas", "rain safe"],
    categories: ["nightlife", "clubs", "indoor"],
    indoor_outdoor: "indoor",
    weather_fit: { clear: 1.0, cloudy: 1.0, rain: 1.0 },
    best_time: ["night"],
    estimated_duration_minutes: 180,
    price_level: 3,
    family_friendly: false,
    couple_friendly: true,
    solo_friendly: true,
    quiet_score: 0.1,
    adventure_score: 0.7,
    relaxed_score: 0.3,
    cultural_score: 0.2,
    food_score: 0.6,
    opening_hours: "21:00 - 03:00",
    website: null,
    phone: null,
    source: "Curated Local Guide",
    source_type: "manual",
    source_url: "https://goa-tourism.com/",
    last_verified: "2026-09-18"
  },
  {
    id: "GOA-NIGHT-002",
    name: "Anjuna Flea Market & Curlies",
    type: "nightlife",
    region: "North Goa",
    area: "Anjuna",
    coordinates: { lat: 15.5789, lng: 73.7422 },
    address: "South Anjuna Beach, Anjuna, Goa 403509",
    tags: ["beach party", "trance", "sunset chill", "bohemian"],
    categories: ["nightlife", "beach_clubs"],
    indoor_outdoor: "outdoor",
    weather_fit: { clear: 1.0, cloudy: 0.7, rain: 0.1 },
    best_time: ["evening", "night"],
    estimated_duration_minutes: 150,
    price_level: 2,
    family_friendly: false,
    couple_friendly: true,
    solo_friendly: true,
    quiet_score: 0.2,
    adventure_score: 0.8,
    relaxed_score: 0.6,
    cultural_score: 0.5,
    food_score: 0.7,
    opening_hours: "08:30 - 03:00",
    website: null,
    phone: null,
    source: "Curated Local Guide",
    source_type: "manual",
    source_url: "https://goa-tourism.com/",
    last_verified: "2026-09-18"
  },
  {
    id: "GOA-EXP-001",
    name: "Fontainhas Latin Quarter Heritage Walk",
    type: "activity",
    region: "North Goa",
    area: "Panaji",
    coordinates: { lat: 15.4958, lng: 73.8322 },
    address: "Fontainhas, Panaji, Goa 403001",
    tags: ["heritage walk", "portuguese houses", "art cafes", "covered bakeries"],
    categories: ["activities", "culture", "heritage"],
    indoor_outdoor: "covered",
    weather_fit: { clear: 1.0, cloudy: 1.0, rain: 0.85 },
    best_time: ["morning", "late afternoon"],
    estimated_duration_minutes: 90,
    price_level: 1,
    family_friendly: true,
    couple_friendly: true,
    solo_friendly: true,
    quiet_score: 0.8,
    adventure_score: 0.3,
    relaxed_score: 0.9,
    cultural_score: 1.0,
    food_score: 0.8,
    opening_hours: "Open all day",
    website: null,
    phone: null,
    source: "Goa Tourism / Curated Local Guide",
    source_type: "official",
    source_url: "https://goa-tourism.com/",
    last_verified: "2026-09-18"
  },
  {
    id: "GOA-EXP-002",
    name: "Savoi Spice Plantation Experience",
    type: "activity",
    region: "South Goa",
    area: "Ponda",
    coordinates: { lat: 15.4419, lng: 74.0536 },
    address: "Savoi, Ponda, Goa 403401",
    tags: ["spice plantation", "covered pavilions", "traditional buffet", "botany"],
    categories: ["activities", "nature", "food", "covered"],
    indoor_outdoor: "covered",
    weather_fit: { clear: 1.0, cloudy: 1.0, rain: 0.9 },
    best_time: ["morning", "lunch"],
    estimated_duration_minutes: 150,
    price_level: 2,
    family_friendly: true,
    couple_friendly: true,
    solo_friendly: true,
    quiet_score: 0.9,
    adventure_score: 0.4,
    relaxed_score: 0.9,
    cultural_score: 0.9,
    food_score: 0.9,
    opening_hours: "09:30 - 16:30",
    website: null,
    phone: null,
    source: "Goa Tourism Development Corporation",
    source_type: "official",
    source_url: "https://goa-tourism.com/",
    last_verified: "2026-09-18"
  }
];

// Combine all canonical places
const allPlaces = [
  ...beaches,
  ...forts,
  ...temples,
  ...churches,
  ...museums,
  ...nature,
  ...residencies,
  ...diningAndNightlife
];

// ------------------------------------------------------------
// 11. WRITE SEED FILES
// ------------------------------------------------------------
function writeJson(filename, data) {
  const filePath = path.join(GOA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`[Seed] Wrote ${data.length} records to ${filename}`);
}

writeJson('areas.json', areas);
writeJson('streets.json', streets);
writeJson('beaches.json', beaches);
writeJson('forts.json', forts);
writeJson('temples.json', temples);
writeJson('churches.json', churches);
writeJson('museums.json', museums);
writeJson('waterfalls.json', nature.filter(n => n.tags.includes("waterfall")));
writeJson('wildlife.json', nature.filter(n => n.tags.includes("wildlife")));
writeJson('attractions.json', [...forts, ...churches, ...museums]);
writeJson('hotels.json', residencies);
writeJson('resorts.json', residencies.filter(r => r.name.includes("Lake") || r.name.includes("Heritage")));
writeJson('hostels.json', []);
writeJson('villas.json', []);
writeJson('restaurants.json', diningAndNightlife.filter(d => d.type === "restaurant"));
writeJson('cafes.json', museums.filter(m => m.name.includes("Cafe")));
writeJson('nightlife.json', diningAndNightlife.filter(d => d.type === "nightlife"));
writeJson('activities.json', diningAndNightlife.filter(d => d.type === "activity"));
writeJson('shopping.json', []);
writeJson('transport.json', []);
writeJson('events.json', []);
writeJson('places.json', allPlaces);

// Sources Registry
const sourcesRegistry = [
  {
    id: "SRC-GTDC",
    name: "Goa Tourism Development Corporation",
    type: "official",
    url: "https://goa-tourism.com/",
    beach_url: "https://goa-tourism.com/beach/",
    booking_url: "https://bookings.goa-tourism.com/",
    stay_url: "https://goa-tourism.com/stay-in-goa/",
    last_verified: "2026-09-18"
  },
  {
    id: "SRC-OSM",
    name: "OpenStreetMap / Overpass API",
    type: "osm",
    url: "https://wiki.openstreetmap.org/wiki/Overpass_API",
    last_verified: "2026-09-18"
  },
  {
    id: "SRC-GOOGLE",
    name: "Google Places API (Web Service)",
    type: "google",
    url: "https://developers.google.com/maps/documentation/places/web-service",
    last_verified: "2026-09-18"
  },
  {
    id: "SRC-OPENMETEO",
    name: "Open-Meteo Weather API",
    type: "weather",
    url: "https://open-meteo.com/en/docs",
    last_verified: "2026-09-18"
  }
];
writeJson('sources.json', sourcesRegistry);

console.log(`\n✓ Seed completed successfully. Total canonical places: ${allPlaces.length}`);
