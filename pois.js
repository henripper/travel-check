// Points of interest on Rhodes.
// cost: 0 = free, 1 = under €8, 2 = €8–15, 3 = over €15. Prices are approximate
// (2025–26 season) and Greek state sites are ~half price from Nov to Mar.
// rating: 1–5, a blend of visitor reviews and how much it's worth the trip.
// mins: suggested time on site. era: what period the place is about.
// Coordinates: published GPS points (source noted above each place), checked against the
// coastline. "approx" = placed from a description next to verified landmarks (~100–200 m).

const CATEGORIES = {
  museum:   { label: "Museum",        icon: "🏛️" },
  ruins:    { label: "Ruins",         icon: "🏺" },
  castle:   { label: "Castle & walls", icon: "🏰" },
  vista:    { label: "Vista",         icon: "🌄" },
  religious:{ label: "Church & mosque", icon: "⛪" },
  oldtown:  { label: "Historic streets", icon: "🧱" },
  architecture: { label: "Architecture", icon: "🏢" },
  beach:    { label: "Beach",         icon: "🏖️" },
  nature:   { label: "Nature & parks", icon: "🌿" },
  village:  { label: "Village",       icon: "🏘️" },
  market:   { label: "Market",        icon: "🛍️" },
  family:   { label: "Family",        icon: "🐠" },
  food:     { label: "Food & wine",   icon: "🍷" },
  experience: { label: "Experience",  icon: "🚤" },
  other:    { label: "Other",         icon: "📌" },
};

const ERAS = {
  ancient: "Ancient",
  byzantine: "Byzantine",
  medieval: "Knights era",
  ottoman: "Ottoman",
  italian: "Italian era",
  modern: "Modern",
  nature: "Natural",
};

const POIS = [
  // ---------- Rhodes Old Town ----------
  // Wikipedia
  { id: "grandmaster", name: "Palace of the Grand Master", cat: "castle", era: "medieval",
    lat: 36.4457, lng: 28.2241, rating: 4.7, cost: 2, price: "~€12 (combined Old Town ticket available)", mins: 90,
    desc: "14th-century fortress-palace of the Knights of St John, rebuilt by the Italians in the 1930s. Mosaic floors from Kos and two good exhibitions on ancient and medieval Rhodes.",
    tip: "Go at opening time (8:00) to beat cruise groups." },
  // Sygic
  { id: "ippoton", name: "Street of the Knights (Ippoton)", cat: "oldtown", era: "medieval",
    lat: 36.4451, lng: 28.2259, rating: 4.8, cost: 0, price: "Free", mins: 30,
    desc: "Cobbled medieval street lined with the 'Inns' of each nation of the Knights. One of the best-preserved Gothic streets in Europe.",
    tip: "Magical and empty early morning or after dark." },
  // AroundUs
  { id: "archmuseum", name: "Archaeological Museum", cat: "museum", era: "ancient",
    lat: 36.4448, lng: 28.2271, rating: 4.6, cost: 2, price: "~€10", mins: 90,
    desc: "Housed in the Knights' Hospital. Statues incl. the Aphrodite of Rhodes, grave finds from Kamiros and Ialysos, and a lovely garden.",
    tip: "Part of the Old Town combined ticket." },
  // Wikipedia
  { id: "kastrou", name: "Panagia tou Kastrou (Byzantine Museum)", cat: "religious", era: "byzantine",
    lat: 36.445, lng: 28.2275, rating: 4.4, cost: 1, price: "~€6", mins: 40,
    desc: "11th-century Byzantine cathedral, later the Knights' Catholic cathedral and an Ottoman mosque. Frescoes and icons.",
    tip: "" },
  // approx: Argyrokastrou Sq., next to Archaeological Museum
  { id: "decorative", name: "Decorative Arts Collection", cat: "museum", era: "modern",
    lat: 36.4453, lng: 28.2272, rating: 4.1, cost: 1, price: "~€3", mins: 30,
    desc: "Traditional Rhodian and Dodecanese embroidery, Lindian plates, carved furniture and costumes in the Knights' arsenal.",
    tip: "Quick stop next to the Archaeological Museum." },
  // approx: Symi Sq. inside Liberty Gate
  { id: "aphrodite", name: "Temple of Aphrodite", cat: "ruins", era: "ancient",
    lat: 36.4468, lng: 28.2274, rating: 3.9, cost: 0, price: "Free (viewed from street)", mins: 10,
    desc: "Remains of a 3rd-century BC temple on Symi Square, just inside the Liberty Gate.",
    tip: "" },
  // approx: d'Amboise Gate below the Palace
  { id: "moat", name: "Old Town Moat Walk", cat: "castle", era: "medieval",
    lat: 36.4462, lng: 28.2225, rating: 4.6, cost: 0, price: "Free", mins: 45,
    desc: "Walk the dry moat between the massive walls — 4 km of fortifications, stone cannonballs everywhere. Enter near the d'Amboise Gate.",
    tip: "Shady in the morning, a great quiet escape from the busy lanes." },
  // approx: east wall facing the harbour
  { id: "marinegate", name: "Marine Gate", cat: "castle", era: "medieval",
    lat: 36.4452, lng: 28.2296, rating: 4.4, cost: 0, price: "Free", mins: 10,
    desc: "The grand twin-towered sea gate of 1478, facing the commercial harbour.",
    tip: "" },
  // Wikipedia
  { id: "suleymaniye", name: "Suleymaniye Mosque", cat: "religious", era: "ottoman",
    lat: 36.4444, lng: 28.2242, rating: 4.2, cost: 0, price: "Free (exterior)", mins: 10,
    desc: "Pink-plastered mosque built after the Ottoman conquest of 1522, rebuilt in 1808. Opposite is the Hafiz Ahmed Aga library.",
    tip: "Interior usually closed; admire from Sokratous Street." },
  // approx: beside Suleymaniye Mosque
  { id: "clocktower", name: "Clock Tower (Roloi)", cat: "vista", era: "ottoman",
    lat: 36.4446, lng: 28.2245, rating: 4.4, cost: 1, price: "~€5 incl. a drink", mins: 30,
    desc: "Climb the 1850s clock tower — the highest point of the Old Town with 360° views over domes, minarets and the harbour.",
    tip: "Best in late afternoon light." },
  // approx: Hippocrates Sq. just inside Marine Gate
  { id: "sokratous", name: "Sokratous Street & Hippocrates Square", cat: "oldtown", era: "ottoman",
    lat: 36.4443, lng: 28.2288, rating: 4.3, cost: 0, price: "Free", mins: 45,
    desc: "The Old Town's old bazaar street, ending at the Castellania fountain on Hippocrates Square. Shops, cafés, people-watching.",
    tip: "Wander the side lanes south of here — far quieter and more authentic." },
  // Wikipedia (Kahal Shalom)
  { id: "jewish", name: "Jewish Quarter & Kahal Shalom Synagogue", cat: "religious", era: "medieval",
    lat: 36.4422, lng: 28.2304, rating: 4.6, cost: 1, price: "Small donation/fee", mins: 40,
    desc: "Greece's oldest synagogue (1577) and a moving museum on the Rhodian Jewish community deported in 1944. Square of the Jewish Martyrs nearby.",
    tip: "Closed Saturdays." },
  // approx: near Gate of the Virgin
  { id: "burgh", name: "Our Lady of the Burgh (ruins)", cat: "ruins", era: "medieval",
    lat: 36.4427, lng: 28.231, rating: 4.5, cost: 0, price: "Free", mins: 15,
    desc: "Roofless Gothic church with soaring arches — one of the most photogenic spots in the Old Town.",
    tip: "Often hosts evening concerts in summer." },
  // approx: Agiou Fanouriou street
  { id: "fanourios", name: "Agios Fanourios Church", cat: "religious", era: "byzantine",
    lat: 36.4425, lng: 28.2248, rating: 4.3, cost: 0, price: "Free", mins: 10,
    desc: "Tiny, partly sunken Byzantine church with fine frescoes, hidden in the quiet south-west lanes.",
    tip: "" },

  // ---------- Rhodes New Town & Mandraki ----------
  // approx: harbour entrance by St Nicholas mole
  { id: "mandraki", name: "Mandraki Harbour & Deer Statues", cat: "vista", era: "italian",
    lat: 36.4505, lng: 28.2276, rating: 4.5, cost: 0, price: "Free", mins: 30,
    desc: "Where legend places the Colossus of Rhodes. Bronze stag and doe on columns guard the entrance; yachts and day-trip boats line the quay.",
    tip: "Boats to Lindos, Symi and the east-coast beaches leave from here." },
  // Wikipedia lighthouse list (St Nicholas Fort)
  { id: "windmills", name: "Windmills of Mandraki & St Nicholas Fort", cat: "castle", era: "medieval",
    lat: 36.4511, lng: 28.2278, rating: 4.4, cost: 0, price: "Free", mins: 40,
    desc: "Walk out along the mole past three medieval windmills to the 15th-century St Nicholas fortress and lighthouse.",
    tip: "Great sunset view back over the town." },
  // AroundUs (Evangelismos)
  { id: "italianfront", name: "Italian Waterfront (Governor's Palace & Evangelismos)", cat: "architecture", era: "italian",
    lat: 36.4509, lng: 28.225, rating: 4.3, cost: 0, price: "Free", mins: 30,
    desc: "1920s–30s Italian colonial buildings: the Venetian-Gothic Governor's Palace, Evangelismos Church, Town Hall, National Theatre and Post Office.",
    tip: "Combine with Mandraki and the New Market." },
  // approx: south side of Mandraki
  { id: "newmarket", name: "New Market (Nea Agora)", cat: "market", era: "italian",
    lat: 36.4486, lng: 28.2262, rating: 4.0, cost: 0, price: "Free", mins: 30,
    desc: "Heptagonal Italian-era market with cafés, souvlaki joints and fresh juice. East-coast buses leave from the stops right beside it.",
    tip: "Good spot for a cheap gyros lunch." },
  // Wikipedia
  { id: "muradreis", name: "Murad Reis Mosque & Ottoman Cemetery", cat: "religious", era: "ottoman",
    lat: 36.4522, lng: 28.2242, rating: 4.2, cost: 0, price: "Free", mins: 20,
    desc: "Peaceful mosque and graveyard with turbaned tombstones and shady trees, tucked behind the waterfront.",
    tip: "" },
  // Sembo listing
  { id: "rosescasino", name: "Grande Albergo delle Rose (Casino)", cat: "architecture", era: "italian",
    lat: 36.4535, lng: 28.2225, rating: 3.9, cost: 0, price: "Free (exterior)", mins: 10,
    desc: "Grand 1927 Italian hotel in an eclectic Moorish-Venetian style, now the Casino Rodos. Right by Elli Beach.",
    tip: "" },
  // approx: G. Charitou Sq., New Town
  { id: "nestorideio", name: "Museum of Modern Greek Art (Nestorideio)", cat: "museum", era: "modern",
    lat: 36.4555, lng: 28.215, rating: 4.3, cost: 1, price: "~€3–5", mins: 60,
    desc: "The main venue of one of Greece's best modern-art collections: Greek painters from the 19th century to today.",
    tip: "Check opening hours — some branches close on Mondays." },
  // allovergreece
  { id: "elli", name: "Elli Beach", cat: "beach", era: "nature",
    lat: 36.4554, lng: 28.2191, rating: 4.3, cost: 0, price: "Free (sunbeds ~€10–20)", mins: 120,
    desc: "Town beach with clear water, the famous diving board platform and lively beach bars.",
    tip: "Calm water most days — the west side (Windy beach) gets the waves." },
  // Wikipedia
  { id: "aquarium", name: "Aquarium of Rhodes", cat: "family", era: "italian",
    lat: 36.4572, lng: 28.2208, rating: 4.1, cost: 2, price: "~€8", mins: 45,
    desc: "Small aquarium of Aegean sea life in a 1930s Italian Art Deco building at the island's northern tip.",
    tip: "Walk on to the very tip (Kum Burnu) where two seas meet." },
  // approx: tip just past the Aquarium
  { id: "kumburnu", name: "Northern Tip (Kum Burnu)", cat: "vista", era: "nature",
    lat: 36.4578, lng: 28.2207, rating: 4.3, cost: 0, price: "Free", mins: 20,
    desc: "The northernmost point of Rhodes — watch the calm east sea meet the windy west sea. Views to Turkey on clear days.",
    tip: "" },

  // ---------- South of town ----------
  // Wikipedia via Sygic
  { id: "acropolis", name: "Acropolis of Rhodes (Temple of Apollo & Stadium)", cat: "ruins", era: "ancient",
    lat: 36.4393, lng: 28.2116, rating: 4.5, cost: 0, price: "Free", mins: 60,
    desc: "Hellenistic acropolis on Monte Smith: columns of the Temple of Pythian Apollo, a restored stadium and a small odeon.",
    tip: "Uphill walk — or take city bus no. 5. Go late for the sunset from Monte Smith." },
  // approx: west brow of the acropolis hill
  { id: "montesmith", name: "Monte Smith Sunset Viewpoint", cat: "vista", era: "nature",
    lat: 36.4395, lng: 28.2098, rating: 4.6, cost: 0, price: "Free", mins: 30,
    desc: "The hilltop above the acropolis looks west over the sea to Turkey and Symi. The classic Rhodes Town sunset spot.",
    tip: "Pair with the Acropolis ruins just below." },
  // Sygic
  { id: "rodini", name: "Rodini Park", cat: "nature", era: "ancient",
    lat: 36.4258, lng: 28.2185, rating: 4.0, cost: 0, price: "Free", mins: 45,
    desc: "Shady wooded park with streams, bridges and peacocks — said to be the site of the ancient school of rhetoric.",
    tip: "A cool escape on a hot afternoon." },
  // ToposText (tombs SW of Rodini), medium confidence
  { id: "ptolemies", name: "Tomb of the Ptolemies", cat: "ruins", era: "ancient",
    lat: 36.4223, lng: 28.215, rating: 4.0, cost: 0, price: "Free", mins: 20,
    desc: "Monumental Hellenistic tomb with a stepped facade, cut into the rock just beyond Rodini Park.",
    tip: "" },
  // Wikipedia (village-level)
  { id: "koskinou", name: "Koskinou Village", cat: "village", era: "modern",
    lat: 36.383, lng: 28.217, rating: 4.5, cost: 0, price: "Free", mins: 60,
    desc: "Traditional village famous for its brightly painted doorways, pebble-mosaic courtyards and quiet lanes.",
    tip: "Pop into a kafeneio on the square." },
  // Sygic
  { id: "kallithea", name: "Kallithea Springs", cat: "architecture", era: "italian",
    lat: 36.3781, lng: 28.2385, rating: 4.4, cost: 1, price: "~€5", mins: 90,
    desc: "1920s Italian Art Deco thermal spa with domes, mosaics and a rocky swimming cove. Many films were shot here.",
    tip: "Bring swimwear — the cove is great for snorkelling.",
    how: "Bus 21 from the New Market (~20 min)." },
  // GTP
  { id: "anthonyquinn", name: "Anthony Quinn Bay", cat: "beach", era: "nature",
    lat: 36.3214, lng: 28.2092, rating: 4.6, cost: 0, price: "Free (sunbeds extra)", mins: 150,
    desc: "Emerald cove surrounded by pine-covered rocks, named after the actor who filmed The Guns of Navarone here. Superb snorkelling.",
    tip: "Small and popular — arrive before 10:00.",
    how: "East-coast bus to Faliraki, then taxi or 30-min walk; or by car." },
  // approx: Leof. Kallitheas opposite Esperos Palace
  { id: "waterpark", name: "Water Park Faliraki", cat: "family", era: "modern",
    lat: 36.357, lng: 28.204, rating: 4.4, cost: 3, price: "~€30", mins: 240,
    desc: "One of the largest water parks in Europe: slides, wave pool and lazy river.",
    tip: "Usually closes by end of October — check before going.",
    how: "Free shuttle buses run from Rhodes Town in season." },

  // ---------- West & interior ----------
  // AroundUs (Ialysos site)
  { id: "filerimos", name: "Filerimos Monastery & Ancient Ialysos", cat: "religious", era: "ancient",
    lat: 36.399, lng: 28.143, rating: 4.6, cost: 1, price: "~€6", mins: 90,
    desc: "Hilltop with ruins of ancient Ialysos' acropolis, a Doric fountain, a Knights' monastery, peacocks and the 'Golgotha' path to a huge cross with sweeping views.",
    tip: "Walk the cypress-lined Stations of the Cross to the giant cross.",
    how: "Car or taxi (~20 min). No direct bus to the top." },
  // Travelprofy + photo geotag
  { id: "butterflies", name: "Valley of the Butterflies (Petaloudes)", cat: "nature", era: "nature",
    lat: 36.3388, lng: 28.0603, rating: 4.2, cost: 1, price: "~€5", mins: 75,
    desc: "Shady gorge with wooden bridges, streams and waterfalls. In summer thousands of Jersey tiger moths rest on the trees.",
    tip: "Moths are present Jun–Sep; still a nice cool walk in October.",
    how: "Car, taxi or tour (~35 min). Limited KTEL bus." },
  // Sygic + Pleiades
  { id: "kamiros", name: "Ancient Kamiros", cat: "ruins", era: "ancient",
    lat: 36.3359, lng: 27.9213, rating: 4.5, cost: 1, price: "~€6–8", mins: 75,
    desc: "A whole Hellenistic hillside town laid out above the sea: streets, houses, a temple, cistern and stoa. Atmospheric and rarely crowded.",
    tip: "Little shade — go early or late. Fish taverns at Kamiros Skala nearby.",
    how: "West-coast KTEL bus from Averof St (~1 h) or ~40 min by car." },
  // Sygic
  { id: "kritinia", name: "Kritinia Castle", cat: "castle", era: "medieval",
    lat: 36.2641, lng: 27.8089, rating: 4.6, cost: 0, price: "Free", mins: 45,
    desc: "Ruined Knights' castle on a crag with fabulous views over the Aegean islands of Halki and Tilos.",
    tip: "Short steep climb from the parking.",
    how: "Car (~50 min)." },
  // Wikipedia
  { id: "embonas", name: "Embonas Wineries", cat: "food", era: "modern",
    lat: 36.2283, lng: 27.8583, rating: 4.3, cost: 1, price: "Tastings from ~€5", mins: 60,
    desc: "The island's wine village below Mount Attavyros. Try the local Athiri white and Mandilaria red at Emery and others.",
    tip: "Combine with Kritinia Castle and Monolithos.",
    how: "Car (~1 h)." },
  // Wikipedia
  { id: "profitisilias", name: "Mount Profitis Ilias", cat: "nature", era: "italian",
    lat: 36.2722, lng: 27.9333, rating: 4.3, cost: 0, price: "Free", mins: 60,
    desc: "Pine-forested mountain with abandoned Italian Alpine-style chalets, deer and cool forest walks.",
    tip: "",
    how: "Car (~50 min)." },
  // allovergreece
  { id: "eleousa", name: "Eleousa (abandoned Italian village)", cat: "architecture", era: "italian",
    lat: 36.2755, lng: 28.0263, rating: 4.2, cost: 0, price: "Free", mins: 30,
    desc: "1930s Italian model village with a ghostly derelict square, a fascist-era hospital and the 'Fish Pond' with rare Ladoga minnow.",
    tip: "Pair with Fountoukli church 3 km away.",
    how: "Car (~45 min)." },
  // UNVERIFIED (no published point)
  { id: "fountoukli", name: "Agios Nikolaos Fountoukli", cat: "religious", era: "byzantine",
    lat: 36.293, lng: 28.005, rating: 4.4, cost: 0, price: "Free / small donation", mins: 20,
    desc: "Tiny four-apse 15th-century chapel in the hills with remarkable frescoes and a spring-fed picnic spot.",
    tip: "",
    how: "Car (~45 min)." },
  // allovergreece + Via Gallica
  { id: "monolithos", name: "Monolithos Castle", cat: "castle", era: "medieval",
    lat: 36.1245, lng: 27.7262, rating: 4.7, cost: 0, price: "Free", mins: 45,
    desc: "Knights' castle perched on a 240 m sheer rock above the sea — one of the most dramatic sights on the island. Fourni beach below.",
    tip: "Unbeatable at sunset.",
    how: "Car (~1 h 20)." },

  // ---------- East coast ----------
  // Geocaching
  { id: "sevensprings", name: "Seven Springs (Epta Piges)", cat: "nature", era: "nature",
    lat: 36.2532, lng: 28.1135, rating: 4.3, cost: 0, price: "Free (tunnel walk)", mins: 60,
    desc: "Spring-fed forest lake reached through a pitch-dark, ankle-deep 186 m Italian-built tunnel. Peacocks and a shady taverna.",
    tip: "Bring shoes you don't mind getting wet; claustrophobes take the path over the top.",
    how: "Car or tour (~40 min)." },
  // allovergreece
  { id: "tsambika", name: "Tsambika Monastery Viewpoint", cat: "vista", era: "byzantine",
    lat: 36.2359, lng: 28.1495, rating: 4.7, cost: 0, price: "Free", mins: 60,
    desc: "Climb ~300 steps to a little white monastery for the best panorama on the east coast, over Tsambika's golden beach.",
    tip: "Go early before it gets hot.",
    how: "East-coast bus to the turn-off, or car (~35 min)." },
  // Travelprofy
  { id: "tsambikabeach", name: "Tsambika Beach", cat: "beach", era: "nature",
    lat: 36.2315, lng: 28.1508, rating: 4.5, cost: 0, price: "Free (sunbeds extra)", mins: 150,
    desc: "Long arc of soft golden sand with shallow water, framed by the monastery cliff.",
    tip: "",
    how: "Car (~35 min) or east-coast bus + walk." },
  // Univ. Bologna + Pleiades
  { id: "lindosacro", name: "Acropolis of Lindos", cat: "ruins", era: "ancient",
    lat: 36.0915, lng: 28.0879, rating: 4.7, cost: 3, price: "~€20 (half price in winter)", mins: 120,
    desc: "Temple of Athena Lindia and a Hellenistic stoa crowning a cliff 116 m above the sea, inside a Knights' fortress. The island's must-see.",
    tip: "Arrive for 8:00 opening or the last two hours; it's a hot steep climb (donkeys available).",
    how: "KTEL east-coast bus from the New Market (~1 h 15), boat from Mandraki, or car (~50 min)." },
  // NGA GEOnames
  { id: "lindosvillage", name: "Lindos Village", cat: "village", era: "medieval",
    lat: 36.0904, lng: 28.0856, rating: 4.6, cost: 0, price: "Free", mins: 90,
    desc: "Whitewashed maze of lanes with 17th-century captains' houses, pebble-mosaic courtyards and rooftop restaurants.",
    tip: "Look for the Church of Panagia with its frescoed interior.",
    how: "Same as Lindos Acropolis." },
  // allovergreece
  { id: "stpauls", name: "St Paul's Bay, Lindos", cat: "beach", era: "nature",
    lat: 36.0858, lng: 28.0878, rating: 4.7, cost: 0, price: "Free (sunbeds extra)", mins: 120,
    desc: "Nearly enclosed turquoise lagoon below the Acropolis, with a tiny white chapel where St Paul is said to have landed.",
    tip: "Swim after visiting the Acropolis.",
    how: "Same as Lindos Acropolis; 15-min walk from the village." },
  // Beach Atlas
  { id: "prasonisi", name: "Prasonisi", cat: "beach", era: "nature",
    lat: 35.8901, lng: 27.7746, rating: 4.6, cost: 0, price: "Free", mins: 180,
    desc: "The island's southern tip: a sandbar joining an islet, with flat water on one side and kitesurf waves on the other.",
    tip: "A full-day trip; windy most days.",
    how: "Car (~1 h 45)." },
];

// Wikipedia article (English) for each place.
// "Exact title"  – used if it exists and is located on/about Rhodes.
// "?word word"   – look for a nearby article whose title contains one of these words
//                  (case/accent-insensitive, partial match). No match → no article shown.
const WIKI = {
  grandmaster: "Palace of the Grand Master of the Knights of Rhodes",
  ippoton: "Street of the Knights",
  archmuseum: "Archaeological Museum of Rhodes",
  kastrou: "?Kastrou",
  decorative: "Medieval City of Rhodes",
  aphrodite: "?Aphrodite",
  moat: "?Fortifications Walls",
  marinegate: "?Marine",
  suleymaniye: "Mosque of Suleiman (Rhodes)",
  clocktower: "?Roloi Clock",
  sokratous: "Medieval City of Rhodes",
  jewish: "Kahal Shalom Synagogue",
  burgh: "?Burgh",
  fanourios: "?Fanourios",
  mandraki: "?Mandraki",
  windmills: "?Nicholas Windmill",
  italianfront: "?Governor Evangelismos Annunciation",
  newmarket: "?Agora Market",
  muradreis: "Murad Reis Mosque",
  rosescasino: "?Rose Casino",
  nestorideio: "?Nestorideio Modern",
  elli: "?Elli",
  aquarium: "?Aquarium Hydrobiolog",
  kumburnu: "Rhodes (city)",
  acropolis: "Acropolis of Rhodes",
  montesmith: "?Smith",
  rodini: "Rodini Park",
  ptolemies: "?Ptolem",
  koskinou: "Koskinou",
  kallithea: "Kallithea Springs",
  anthonyquinn: "Anthony Quinn Bay",
  waterpark: "Faliraki",
  filerimos: "Filerimos",
  butterflies: "?Petaloudes Butterfl",
  kamiros: "Kamiros",
  kritinia: "?Kritinia",
  embonas: "Embonas",
  profitisilias: "?Profitis",
  eleousa: "?Eleousa",
  fountoukli: "?Fountoukli",
  monolithos: "?Monolithos",
  sevensprings: "?Epta Seven",
  tsambika: "?Tsambika",
  tsambikabeach: "?Tsambika",
  lindosacro: "Acropolis of Lindos",
  lindosvillage: "Lindos",
  stpauls: "?Paul",
  prasonisi: "Prasonisi",
};
