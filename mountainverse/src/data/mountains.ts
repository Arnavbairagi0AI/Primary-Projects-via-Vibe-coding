import { Mountain } from '../types';

export const MOUNTAINS: Mountain[] = [
  {
    id: 'everest',
    name: 'Mount Everest',
    localNames: ['Sagarmatha (Nepal)', 'Chomolungma (Tibet)', 'Qomolangma'],
    continent: 'Asia',
    country: ['Nepal', 'China (Tibet)'],
    mountainRange: 'Himalayas',
    elevationMeters: 8848.86,
    prominenceMeters: 8848.86,
    isolationKm: 40008,
    latitude: 27.9881,
    longitude: 86.9250,
    isSevenSummit: true,
    isVolcano: false,
    isUnesco: true,
    tagline: 'The Crown of the Planet & Roof of the World',
    summary: 'Mount Everest is the highest peak above sea level on Earth. Formed by the tectonic collision of the Indian and Eurasian plates, it towers over the High Himalayas with extreme winds, lethal temperatures, and its famed Death Zone above 8,000 meters.',
    heroImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=1000&auto=format&fit=crop'
    ],
    geology: {
      rockType: 'Limestone, Pelitic Schist, Granite, & Yellow Band Sedimentary Rock',
      tectonicOrigin: 'Continental Collision of Indian and Eurasian Plates (ongoing uplift ~5mm/yr)',
      ageMillionsYears: 50,
      formationType: 'Fold Mountain',
      funFact: 'Marine fossils like ammonites are embedded in limestone rock right at the summit of Everest, proving it was once sea floor!'
    },
    climate: {
      summerAvgTempC: -19,
      winterAvgTempC: -36,
      deathZoneAltitudeMeters: 8000,
      glaciersCount: 14,
      predominantWindKmH: 280,
      wildlife: ['Snow Leopard', 'Himalayan Tahr', 'Lammergeier Vulture', 'Alpine Chough', 'Himalayan Musk Deer'],
      flora: ['Rhododendron', 'Edelweiss', 'Juniper', 'Himalayan Birch']
    },
    routes: [
      {
        name: 'South Col Route (Nepal)',
        difficulty: 'Extreme',
        durationDays: 60,
        distanceKm: 65,
        bestMonths: ['May', 'October'],
        description: 'The standard route pioneered by Tenzing Norgay and Edmund Hillary. Navigates the treacherous Khumbu Icefall, Lhotse Face, and Hillary Step.',
        successRatePercent: 68
      },
      {
        name: 'North Ridge Route (Tibet)',
        difficulty: 'Extreme',
        durationDays: 55,
        distanceKm: 50,
        bestMonths: ['May'],
        description: 'Approached from the Tibetan Plateau, involving high-wind exposure on the North Col and three famous "Steps" on the northeast ridge.',
        successRatePercent: 52
      }
    ],
    expeditions: [
      {
        year: 1953,
        climberName: 'Edmund Hillary & Tenzing Norgay',
        nationalities: ['New Zealand', 'Nepal'],
        notes: 'First confirmed successful summit of Mount Everest via the South Col.',
        isFirstAscent: true
      },
      {
        year: 1978,
        climberName: 'Reinhold Messner & Peter Habeler',
        nationalities: ['Italy', 'Austria'],
        notes: 'First historic ascent without supplementary oxygen, proving human survival is possible in the Death Zone.',
        isFirstAscent: false
      },
      {
        year: 1980,
        climberName: 'Reinhold Messner',
        nationalities: ['Italy'],
        notes: 'First solo summit of Everest without oxygen via North Face route.',
        isFirstAscent: false
      }
    ],
    hotspots: [
      { id: 'bc', name: 'South Base Camp', altitudeMeters: 5364, description: 'Tented village on Khumbu Glacier where expedtions prepare.', xRatio: -0.2, yRatio: -0.3, zRatio: 0.3, type: 'base_camp' },
      { id: 'icefall', name: 'Khumbu Icefall', altitudeMeters: 5486, description: 'Ever-shifting labyrinth of massive ice seracs and giant crevasses.', xRatio: -0.1, yRatio: -0.2, zRatio: 0.2, type: 'hazard' },
      { id: 'camp2', name: 'Western Cwm / Camp 2', altitudeMeters: 6400, description: 'Glacial valley known as the Valley of Silence.', xRatio: 0.0, yRatio: -0.05, zRatio: 0.1, type: 'camp' },
      { id: 'south_col', name: 'South Col (Camp 4)', altitudeMeters: 7906, description: 'Desolate high pass where the Death Zone begins.', xRatio: 0.25, yRatio: 0.25, zRatio: -0.05, type: 'camp' },
      { id: 'hillary_step', name: 'Hillary Step', altitudeMeters: 8790, description: 'Famous 12-meter rock wall near the summit ridge.', xRatio: 0.08, yRatio: 0.42, zRatio: 0.0, type: 'key_feature' },
      { id: 'summit', name: 'Summit Crest', altitudeMeters: 8848.86, description: 'Highest point on planet Earth covered in prayer flags.', xRatio: 0.0, yRatio: 0.48, zRatio: 0.0, type: 'summit' }
    ],
    culturalSignificance: 'Sacred to both Sherpa Buddhists and Tibetan people as the home of Goddess Miyolangsangma, provider of wealth and nourishment.',
    conservationStatus: 'Sagarmatha National Park UNESCO Site. Facing climate warming glacier retreat and microplastic waste cleanup initiatives.',
    terrainType: 'massive_ridge',
    roughness: 0.85,
    peakSharpness: 0.92,
    snowLineRatio: 0.45
  },

  {
    id: 'k2',
    name: 'K2 (Chhogori)',
    localNames: ['Dapsang', 'Savage Mountain', 'Chhogori (Balti)'],
    continent: 'Asia',
    country: ['Pakistan', 'China'],
    mountainRange: 'Karakoram',
    elevationMeters: 8611,
    prominenceMeters: 4017,
    isolationKm: 1316,
    latitude: 35.8808,
    longitude: 76.5158,
    isSevenSummit: false,
    isVolcano: false,
    isUnesco: false,
    tagline: 'The Savage Mountain & The Mountaineers Mountain',
    summary: 'K2 is the second-highest mountain on Earth and widely regarded as the most dangerous and technical 8,000-meter peak to climb. Its steep pyramidal walls in the Karakoram present relentless rock, ice fall, and unpredictable hurricane-force winds.',
    heroImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=1000&auto=format&fit=crop'
    ],
    geology: {
      rockType: 'K2 Gneiss, Granite Plutons, & Metamorphic Slate',
      tectonicOrigin: 'Karakoram Microplate Compression & Magmatic Arc Intrusion',
      ageMillionsYears: 120,
      formationType: 'Fold Mountain',
      funFact: 'K2 has a nearly perfect steep pyramid geometry, making it almost impossible to find flat ground for tents on high camps.'
    },
    climate: {
      summerAvgTempC: -22,
      winterAvgTempC: -45,
      deathZoneAltitudeMeters: 8000,
      glaciersCount: 8,
      predominantWindKmH: 310,
      wildlife: ['Snow Leopard', 'Marco Polo Sheep', 'Himalayan Ibex'],
      flora: ['Subalpine Willow', 'Artemisia']
    },
    routes: [
      {
        name: 'Abruzzi Spur',
        difficulty: 'Extreme',
        durationDays: 65,
        distanceKm: 45,
        bestMonths: ['July', 'August'],
        description: 'The standard route ascending the Southeast Ridge. Highlights include House’s Chimney, the Black Pyramid, and the infamous Bottleneck ice cliff.',
        successRatePercent: 42
      }
    ],
    expeditions: [
      {
        year: 1954,
        climberName: 'Achille Compagnoni & Lino Lacedelli',
        nationalities: ['Italy'],
        notes: 'First historic ascent of K2 lead by Ardito Desio.',
        isFirstAscent: true
      },
      {
        year: 2021,
        climberName: 'Nimsdai Purja & Nepali Sherpa Team',
        nationalities: ['Nepal'],
        notes: 'First successful winter summit of K2 in mountaineering history, singing the Nepali national anthem.',
        isFirstAscent: false
      }
    ],
    hotspots: [
      { id: 'k2_bc', name: 'K2 Base Camp', altitudeMeters: 5150, description: 'Located on the Godwin-Austen Glacier looking at the sheer South Face.', xRatio: -0.2, yRatio: -0.3, zRatio: 0.25, type: 'base_camp' },
      { id: 'houses_chimney', name: 'House’s Chimney', altitudeMeters: 6600, description: 'Vertical 30m rock crack requiring technical jamming.', xRatio: -0.1, yRatio: -0.05, zRatio: 0.1, type: 'key_feature' },
      { id: 'black_pyramid', name: 'Black Pyramid', altitudeMeters: 7200, description: 'Exposed dark rock and ice buttress.', xRatio: 0.05, yRatio: 0.15, zRatio: 0.0, type: 'key_feature' },
      { id: 'bottleneck', name: 'The Bottleneck', altitudeMeters: 8200, description: 'A narrow couloir overhang by massive unstable ice seracs.', xRatio: 0.0, yRatio: 0.38, zRatio: -0.05, type: 'hazard' },
      { id: 'k2_summit', name: 'K2 Summit Apex', altitudeMeters: 8611, description: 'Small snow dome atop the Karakoram mountain realm.', xRatio: 0.0, yRatio: 0.48, zRatio: 0.0, type: 'summit' }
    ],
    culturalSignificance: 'Chhogori translates to "King of Mountains" in Balti language. Respected by local Balti high-altitude porters.',
    conservationStatus: 'Central Karakoram National Park. Protected glacier basin with extreme wilderness status.',
    terrainType: 'pyramid',
    roughness: 0.95,
    peakSharpness: 0.98,
    snowLineRatio: 0.35
  },

  {
    id: 'matterhorn',
    name: 'Matterhorn (Cervino)',
    localNames: ['Mont Cervin (French)', 'Monte Cervino (Italian)'],
    continent: 'Europe',
    country: ['Switzerland', 'Italy'],
    mountainRange: 'Pennine Alps',
    elevationMeters: 4478,
    prominenceMeters: 1042,
    isolationKm: 13.8,
    latitude: 45.9763,
    longitude: 7.6586,
    isSevenSummit: false,
    isVolcano: false,
    isUnesco: false,
    tagline: 'The Iconic Four-Sided Pyramid of the Swiss Alps',
    summary: 'The Matterhorn is one of the most recognizable mountains in the world. Its four steep faces align nearly exactly with the four cardinal directions (North, South, East, West), created by glacial cirque erosion chiseling an African tectonic sliver.',
    heroImage: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop'
    ],
    geology: {
      rockType: 'Gneiss and Ophiolites (Fragment of African Tectonic Plate)',
      tectonicOrigin: 'Alpine Orogeny: African Plate thrusting over Eurasian Plate',
      ageMillionsYears: 100,
      formationType: 'Glacial Horn',
      funFact: 'The top of the Matterhorn is actually composed of rock that originated on the African continent, making it an alien piece of Africa resting in Europe!'
    },
    climate: {
      summerAvgTempC: -1,
      winterAvgTempC: -18,
      glaciersCount: 4,
      predominantWindKmH: 110,
      wildlife: ['Alpine Ibex', 'Chamoix', 'Alpine Marmot', 'Golden Eagle'],
      flora: ['Alpine Edelweiss', 'Gentian', 'Swiss Pine']
    },
    routes: [
      {
        name: 'Hörnli Ridge (Switzerland)',
        difficulty: 'Advanced',
        durationDays: 2,
        distanceKm: 8,
        bestMonths: ['July', 'August', 'September'],
        description: 'The classic northeast ridge route from Zermatt, featuring fixed ropes and Solvay Hut emergency shelter.',
        successRatePercent: 75
      },
      {
        name: 'Lion Ridge (Italy)',
        difficulty: 'Advanced',
        durationDays: 2,
        distanceKm: 7,
        bestMonths: ['July', 'August'],
        description: 'The southwest Italian ridge from Breuil-Cervinia, equipped with chain handholds on steep rock faces.',
        successRatePercent: 70
      }
    ],
    expeditions: [
      {
        year: 1865,
        climberName: 'Edward Whymper & Team',
        nationalities: ['United Kingdom'],
        notes: 'First successful ascent, followed by a tragic rope break on descent that cost four lives.',
        isFirstAscent: true
      }
    ],
    hotspots: [
      { id: 'hornli_hut', name: 'Hörnli Hut', altitudeMeters: 3260, description: 'Starting base camp lodge at the foot of the northeast ridge.', xRatio: -0.25, yRatio: -0.25, zRatio: 0.2, type: 'base_camp' },
      { id: 'solvay_hut', name: 'Solvay Hut', altitudeMeters: 4003, description: 'Tiny emergency refuge perched on a narrow ledge.', xRatio: 0.0, yRatio: 0.1, zRatio: 0.05, type: 'camp' },
      { id: 'mosley_slab', name: 'Moseley Slab', altitudeMeters: 3800, description: 'Polished granite slab section above the lower ridge.', xRatio: -0.05, yRatio: -0.05, zRatio: 0.1, type: 'key_feature' },
      { id: 'matterhorn_summit', name: 'Cross Summit', altitudeMeters: 4478, description: 'Sharp narrow ridge summit marked with metal cross.', xRatio: 0.0, yRatio: 0.46, zRatio: 0.0, type: 'summit' }
    ],
    culturalSignificance: 'Emblem of Swiss chocolate (Toblerone) and worldwide symbol of mountaineering grandeur.',
    conservationStatus: 'Protected Swiss Heritage Landscape. Strict daily guide limits to protect fragile rock faces.',
    terrainType: 'sharp_spire',
    roughness: 0.88,
    peakSharpness: 0.99,
    snowLineRatio: 0.5
  },

  {
    id: 'kilimanjaro',
    name: 'Mount Kilimanjaro',
    localNames: ['Kilima Njaro (Swahili)', 'Kibo Summit'],
    continent: 'Africa',
    country: ['Tanzania'],
    mountainRange: 'Eastern Rift Mountains',
    elevationMeters: 5895,
    prominenceMeters: 5885,
    isolationKm: 5510,
    latitude: -3.0674,
    longitude: 37.3556,
    isSevenSummit: true,
    isVolcano: true,
    isUnesco: true,
    tagline: 'The Snow-Capped Equatorial Giant of East Africa',
    summary: 'Mount Kilimanjaro is the highest mountain in Africa and the largest free-standing mountain rise on Earth. Rising abruptly from equatorial savannahs, it features three volcanic cones—Kibo, Mawenzi, and Shira.',
    heroImage: 'https://images.unsplash.com/photo-1589553460732-58ef7a71fbb5?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=1000&auto=format&fit=crop'
    ],
    geology: {
      rockType: 'Trachyte, Basalt, Phonolite Volcanic Rocks',
      tectonicOrigin: 'East African Rift Continental Rifting & Plume Volcanism',
      ageMillionsYears: 2.5,
      formationType: 'Volcano (Stratovolcano)',
      funFact: 'Climbing Kilimanjaro passes through 5 distinct ecological zones in 5 days—from tropical rainforest to arctic ice cap!'
    },
    climate: {
      summerAvgTempC: 5,
      winterAvgTempC: -15,
      glaciersCount: 3,
      predominantWindKmH: 80,
      wildlife: ['Colobus Monkey', 'Blue Monkey', 'Kilimanjaro Tree Hyrax', 'Leopard', 'Serval'],
      flora: ['Giant Lobelia', 'Dendrosenecio kilimanjari', 'Protea']
    },
    routes: [
      {
        name: 'Machame Route (Whiskey Route)',
        difficulty: 'Intermediate',
        durationDays: 7,
        distanceKm: 62,
        bestMonths: ['January', 'February', 'July', 'August', 'September'],
        description: 'Popular scenic route climbing through rainforest, Shira Plateau, Barranco Wall, and Uhuru Peak.',
        successRatePercent: 85
      },
      {
        name: 'Lemosho Route',
        difficulty: 'Intermediate',
        durationDays: 8,
        distanceKm: 70,
        bestMonths: ['June', 'July', 'August', 'September', 'October'],
        description: 'High success rate route with gradual acclimatization across pristine western rainforest slopes.',
        successRatePercent: 92
      }
    ],
    expeditions: [
      {
        year: 1889,
        climberName: 'Hans Meyer & Ludwig Purtscheller',
        nationalities: ['Germany', 'Austria'],
        notes: 'First recorded ascent to Kibo summit.',
        isFirstAscent: true
      }
    ],
    hotspots: [
      { id: 'machame_gate', name: 'Machame Gate', altitudeMeters: 1800, description: 'Lush tropical rainforest entrance gate.', xRatio: -0.3, yRatio: -0.4, zRatio: 0.3, type: 'base_camp' },
      { id: 'shira_plateau', name: 'Shira Plateau', altitudeMeters: 3840, description: 'Vast volcanic caldera plateau.', xRatio: -0.15, yRatio: -0.1, zRatio: 0.15, type: 'key_feature' },
      { id: 'barranco_wall', name: 'Barranco Wall', altitudeMeters: 4200, description: 'Fun scrambling rock wall with views of Heim Glacier.', xRatio: 0.05, yRatio: 0.1, zRatio: -0.1, type: 'key_feature' },
      { id: 'stella_point', name: 'Stella Point', altitudeMeters: 5756, description: 'Crater rim junction point before final summit walk.', xRatio: 0.0, yRatio: 0.4, zRatio: 0.05, type: 'camp' },
      { id: 'uhuru_peak', name: 'Uhuru Peak Summit', altitudeMeters: 5895, description: 'Highest point in Africa on Kibo volcanic rim.', xRatio: 0.0, yRatio: 0.45, zRatio: 0.0, type: 'summit' }
    ],
    culturalSignificance: 'Chagga people inhabit the fertile southern foothills, practicing traditional banana and coffee forest farming.',
    conservationStatus: 'Kilimanjaro National Park UNESCO World Heritage Site. Active glacier preservation monitoring.',
    terrainType: 'plateau_cone',
    roughness: 0.65,
    peakSharpness: 0.6,
    snowLineRatio: 0.75
  },

  {
    id: 'denali',
    name: 'Denali (Mount McKinley)',
    localNames: ['Denali ("The High One" in Koyukon Koyukuk)', 'Mt McKinley'],
    continent: 'North America',
    country: ['United States'],
    mountainRange: 'Alaska Range',
    elevationMeters: 6190,
    prominenceMeters: 6144,
    isolationKm: 7450,
    latitude: 63.0692,
    longitude: -151.0070,
    isSevenSummit: true,
    isVolcano: false,
    isUnesco: false,
    tagline: 'The Coldest & Most Isolated Monarch of North America',
    summary: 'Denali is the highest mountain peak in North America. Rising 5,500 meters from its base to its summit, it has a larger vertical base-to-peak relief than Mount Everest. Near the Arctic Circle, it features extreme sub-zero winds and massive glaciers.',
    heroImage: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop'
    ],
    geology: {
      rockType: 'Granite Pluton Batholith & Metamorphic Yukon-Tanana Rocks',
      tectonicOrigin: 'Subduction of Pacific Plate beneath North American Plate',
      ageMillionsYears: 60,
      formationType: 'Plutonic',
      funFact: 'Because Denali is located at 63° North latitude, atmospheric pressure at its summit is lower than equivalent altitudes at the equator, feeling like 6,800m!'
    },
    climate: {
      summerAvgTempC: -25,
      winterAvgTempC: -60,
      deathZoneAltitudeMeters: 6000,
      glaciersCount: 5,
      predominantWindKmH: 260,
      wildlife: ['Grizzly Bear', 'Dall Sheep', 'Caribou', 'Wolf', 'Wolverine'],
      flora: ['Tundra Lichen', 'Alpine Willow', 'Fireweed']
    },
    routes: [
      {
        name: 'West Buttress Route',
        difficulty: 'Advanced',
        durationDays: 21,
        distanceKm: 30,
        bestMonths: ['May', 'June'],
        description: 'The standard route up Kahiltna Glacier, ascending Motorcycle Hill, Windy Corner, and the 17,000ft High Camp ridge.',
        successRatePercent: 52
      }
    ],
    expeditions: [
      {
        year: 1913,
        climberName: 'Hudson Stuck, Harry Karstens, Walter Harper, Robert Tatum',
        nationalities: ['United States'],
        notes: 'First successful summit ascent via South Peak. Walter Harper was first person to set foot on summit.',
        isFirstAscent: true
      }
    ],
    hotspots: [
      { id: 'denali_bc', name: 'Kahiltna Glacier Base Camp', altitudeMeters: 2200, description: 'Ski-plane landing strip on snow runway.', xRatio: -0.3, yRatio: -0.35, zRatio: 0.3, type: 'base_camp' },
      { id: 'motorcycle_hill', name: 'Motorcycle Hill', altitudeMeters: 3350, description: 'Steep snow slope hauled with heavy sleds.', xRatio: -0.15, yRatio: -0.1, zRatio: 0.15, type: 'key_feature' },
      { id: 'high_camp', name: '17,000ft High Camp', altitudeMeters: 5240, description: 'Exposed snow ridge camp overlooking Alaska Range.', xRatio: 0.1, yRatio: 0.25, zRatio: -0.05, type: 'camp' },
      { id: 'denali_summit', name: 'South Peak Summit', altitudeMeters: 6190, description: 'True summit of North America.', xRatio: 0.0, yRatio: 0.47, zRatio: 0.0, type: 'summit' }
    ],
    culturalSignificance: 'Sacred Koyukon Athabascan heritage mountain, officially renamed back to Denali in 2015.',
    conservationStatus: 'Denali National Park and Preserve. Strictly regulated wilderness waste pack-out clean climbing policy.',
    terrainType: 'twin_peak',
    roughness: 0.82,
    peakSharpness: 0.85,
    snowLineRatio: 0.2
  },

  {
    id: 'aconcagua',
    name: 'Aconcagua',
    localNames: ['Sentinel of Stone (Ackon Cahuak in Quechua)'],
    continent: 'South America',
    country: ['Argentina'],
    mountainRange: 'Andes (Principal Cordillera)',
    elevationMeters: 6961,
    prominenceMeters: 6961,
    isolationKm: 16518,
    latitude: -32.6532,
    longitude: -70.0109,
    isSevenSummit: true,
    isVolcano: false,
    isUnesco: false,
    tagline: 'Colossus of the Andes & Highest Peak Outside Asia',
    summary: 'Aconcagua is the highest mountain in both the Southern and Western Hemispheres. Located in the Mendoza province of Argentina, it towers over the Andes with dry, intense winds known as the "Viento Blanco" (White Wind).',
    heroImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop'
    ],
    geology: {
      rockType: 'Andesite, Volcanic Breccia, Sedimentary Sandstone',
      tectonicOrigin: 'Subduction of Nazca Plate under South American Plate',
      ageMillionsYears: 20,
      formationType: 'Fold Mountain',
      funFact: 'An Inca child mummy was discovered at 5,300 meters on Aconcagua, buried around 1500 AD as an Inca ritual sacrifice.'
    },
    climate: {
      summerAvgTempC: -12,
      winterAvgTempC: -30,
      glaciersCount: 6,
      predominantWindKmH: 180,
      wildlife: ['Andean Condor', 'Guanaco', 'Puma', 'Mountain Chinchilla'],
      flora: ['Llareta', 'Yareta Cushion Plants', 'Stipa Grass']
    },
    routes: [
      {
        name: 'Normal Route (Horcones Valley)',
        difficulty: 'Intermediate',
        durationDays: 18,
        distanceKm: 45,
        bestMonths: ['December', 'January', 'February'],
        description: 'Non-technical trek ascending Plaza de Mulas, Camp Berlin, and the steep Canaleta scree gully to summit.',
        successRatePercent: 60
      }
    ],
    expeditions: [
      {
        year: 1897,
        climberName: 'Matthias Zurbriggen',
        nationalities: ['Switzerland'],
        notes: 'First solo ascension via Normal Route lead by Edward FitzGerald expedition.',
        isFirstAscent: true
      }
    ],
    hotspots: [
      { id: 'plaza_de_mulas', name: 'Plaza de Mulas Base Camp', altitudeMeters: 4300, description: 'Second largest base camp tent city in the world.', xRatio: -0.25, yRatio: -0.3, zRatio: 0.2, type: 'base_camp' },
      { id: 'canaleta', name: 'La Canaleta', altitudeMeters: 6700, description: 'Steep scree chute leading to summit ridge.', xRatio: 0.05, yRatio: 0.35, zRatio: -0.05, type: 'key_feature' },
      { id: 'aconcagua_summit', name: 'Aconcagua Summit Cross', altitudeMeters: 6961, description: 'Highest point in the Western Hemisphere.', xRatio: 0.0, yRatio: 0.46, zRatio: 0.0, type: 'summit' }
    ],
    culturalSignificance: 'Sacred mountain boundary marker for Inca Empire capacocha pilgrimages.',
    conservationStatus: 'Aconcagua Provincial Park. Strict ranger patrol and waste disposal monitoring.',
    terrainType: 'massive_ridge',
    roughness: 0.78,
    peakSharpness: 0.8,
    snowLineRatio: 0.55
  },

  {
    id: 'fuji',
    name: 'Mount Fuji (Fujisan)',
    localNames: ['Fuji-san', 'Fuji-yama'],
    continent: 'Asia',
    country: ['Japan'],
    mountainRange: 'Chūbu Region (Standalone Stratovolcano)',
    elevationMeters: 3776.24,
    prominenceMeters: 3776.24,
    isolationKm: 2077,
    latitude: 35.3606,
    longitude: 138.7274,
    isSevenSummit: false,
    isVolcano: true,
    isUnesco: true,
    tagline: 'The Sacred Symmetry & Cultural Heart of Japan',
    summary: 'Mount Fuji is an active stratovolcano and Japan’s highest peak. Famous around the world for its nearly flawless cone symmetry, snow-capped crater rim, and deep connection to Shinto spirituality and Japanese art.',
    heroImage: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1528164344705-47542687990d?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1578637387939-43c525550085?q=80&w=1000&auto=format&fit=crop'
    ],
    geology: {
      rockType: 'Basaltic Andesite & Scoria Volcanic Ash',
      tectonicOrigin: 'Triple Tectonic Junction (Amurian, Okhotsk, and Philippine Sea Plates)',
      ageMillionsYears: 0.1,
      formationType: 'Volcano (Stratovolcano)',
      funFact: 'Mount Fuji is built on top of three older volcanoes: Komitake, Ko-Fuji (Old Fuji), and Shin-Fuji (New Fuji).'
    },
    climate: {
      summerAvgTempC: 6,
      winterAvgTempC: -20,
      glaciersCount: 0,
      predominantWindKmH: 120,
      wildlife: ['Japanese Serow', 'Sika Deer', 'Japanese Black Bear', 'Red Fox'],
      flora: ['Sakura Cherry Blossom', 'Japanese Larch', 'Rhododendron brachycarpum']
    },
    routes: [
      {
        name: 'Yoshida Trail',
        difficulty: 'Beginner',
        durationDays: 1,
        distanceKm: 14,
        bestMonths: ['July', 'August', 'September'],
        description: 'Most popular trail starting at Fuji Subaru Line 5th Station with mountain huts, Torii gates, and sunrise views (Goraiko).',
        successRatePercent: 95
      }
    ],
    expeditions: [
      {
        year: 663,
        climberName: 'Anonymous Monk En no Gyōja',
        nationalities: ['Japan'],
        notes: 'First legendary recorded summit ascension.',
        isFirstAscent: true
      }
    ],
    hotspots: [
      { id: 'fuji_5th', name: 'Yoshida 5th Station', altitudeMeters: 2300, description: 'Bus terminal and starting gate lined with shrines.', xRatio: -0.3, yRatio: -0.3, zRatio: 0.3, type: 'base_camp' },
      { id: 'fuji_crater', name: 'Osawa Collapse Crater', altitudeMeters: 3700, description: 'Massive volcanic crater chasm on the summit rim.', xRatio: 0.0, yRatio: 0.4, zRatio: 0.05, type: 'key_feature' },
      { id: 'kengamine', name: 'Kengamine Peak Summit', altitudeMeters: 3776.24, description: 'Highest point on the crater rim marked by weather station.', xRatio: 0.0, yRatio: 0.45, zRatio: 0.0, type: 'summit' }
    ],
    culturalSignificance: 'Sacred Shinto pilgrimage site dedicated to goddess Konohanasakuya-hime. Inspiring Hokusai’s "36 Views of Mount Fuji".',
    conservationStatus: 'Fuji-Hakone-Izu National Park & UNESCO Cultural Site.',
    terrainType: 'crater',
    roughness: 0.45,
    peakSharpness: 0.7,
    snowLineRatio: 0.6
  },

  {
    id: 'vinson',
    name: 'Vinson Massif',
    localNames: ['Mount Vinson'],
    continent: 'Antarctica',
    country: ['Antarctica (International Territory)'],
    mountainRange: 'Sentinel Range (Ellsworth Mountains)',
    elevationMeters: 4892,
    prominenceMeters: 4892,
    isolationKm: 4911,
    latitude: -78.5254,
    longitude: -85.6171,
    isSevenSummit: true,
    isVolcano: false,
    isUnesco: false,
    tagline: 'The Frozen Crown at the End of the Earth',
    summary: 'Vinson Massif is the highest peak on the polar continent of Antarctica. Located 1,200 kilometers from the South Pole, it towers above pristine polar ice sheets where sun shines 24 hours a day during summer expeditions.',
    heroImage: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop'
    ],
    geology: {
      rockType: 'Quartzite and Slate Rock',
      tectonicOrigin: 'Gondwana Breakup Faulting & Transantarctic Uplift',
      ageMillionsYears: 300,
      formationType: 'Fault-Block',
      funFact: 'Vinson was not even discovered by humanity until 1958, when a US Navy aircraft spotted it soaring above the Ellsworth snowfield!'
    },
    climate: {
      summerAvgTempC: -20,
      winterAvgTempC: -55,
      glaciersCount: 1,
      predominantWindKmH: 150,
      wildlife: ['Antarctic Petrel (coastal only)'],
      flora: ['Polar Lichens']
    },
    routes: [
      {
        name: 'Branscomb Glacier Route',
        difficulty: 'Advanced',
        durationDays: 12,
        distanceKm: 21,
        bestMonths: ['December', 'January'],
        description: 'Fly via ski plane to Union Glacier base camp, hauling sleds up gentle snow ramps to High Camp and summit plateau.',
        successRatePercent: 95
      }
    ],
    expeditions: [
      {
        year: 1966,
        climberName: 'Nicholas Clinch & American Alpine Club Team',
        nationalities: ['United States'],
        notes: 'First recorded expedition ascent supported by US Navy flight crew.',
        isFirstAscent: true
      }
    ],
    hotspots: [
      { id: 'vinson_bc', name: 'Vinson Base Camp', altitudeMeters: 2140, description: 'Snow runway base camp on Branscomb Glacier.', xRatio: -0.3, yRatio: -0.35, zRatio: 0.3, type: 'base_camp' },
      { id: 'vinson_summit', name: 'Vinson Summit Ridge', altitudeMeters: 4892, description: 'Summit point looking across white expanse of Antarctic polar cap.', xRatio: 0.0, yRatio: 0.45, zRatio: 0.0, type: 'summit' }
    ],
    culturalSignificance: 'Symbol of international scientific unity and polar exploration bravery.',
    conservationStatus: 'Protected under the Antarctic Treaty Environmental Protocol (Leave No Trace).',
    terrainType: 'massive_ridge',
    roughness: 0.7,
    peakSharpness: 0.82,
    snowLineRatio: 0.05
  },

  {
    id: 'kosciuszko',
    name: 'Mount Kosciuszko',
    localNames: ['Kunama Namadgi (Ngarigo Language)'],
    continent: 'Australia / Oceania',
    country: ['Australia'],
    mountainRange: 'Main Range (Snowy Mountains / Great Dividing Range)',
    elevationMeters: 2228,
    prominenceMeters: 2228,
    isolationKm: 1894,
    latitude: -36.4559,
    longitude: 148.2636,
    isSevenSummit: true,
    isVolcano: false,
    isUnesco: false,
    tagline: 'The Alpine Crest of the Australian Continent',
    summary: 'Mount Kosciuszko is the highest mountain peak on mainland Australia. Surrounded by unique alpine herbfields, glacial tarns, and snow gums, it provides an accessible alpine wilderness trek.',
    heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop'
    ],
    geology: {
      rockType: 'Ordovician Granite and Metamorphic Siltstone',
      tectonicOrigin: 'Lachlan Orogeny & Intraplate Uplift',
      ageMillionsYears: 400,
      formationType: 'Dome Mountain',
      funFact: 'Kosciuszko was named in 1840 by Polish explorer Paul Strzelecki because its shape reminded him of the Kosciuszko Mound in Kraków!'
    },
    climate: {
      summerAvgTempC: 14,
      winterAvgTempC: -6,
      glaciersCount: 0,
      predominantWindKmH: 70,
      wildlife: ['Corroboree Frog', 'Mountain Pygmy Possum', 'Wombat', 'Echidna'],
      flora: ['Snow Gum (Eucalyptus pauciflora)', 'Silver Daisy', 'Billy Buttons']
    },
    routes: [
      {
        name: 'Thredbo Chairlift Trail',
        difficulty: 'Beginner',
        durationDays: 1,
        distanceKm: 13,
        bestMonths: ['November', 'December', 'January', 'February', 'March'],
        description: 'Elevated mesh boardwalk path protecting fragile alpine vegetation from Eagles Nest chairlift to summit.',
        successRatePercent: 99
      }
    ],
    expeditions: [
      {
        year: 1840,
        climberName: 'Paul Edmund Strzelecki',
        nationalities: ['Poland'],
        notes: 'First European ascent and survey.',
        isFirstAscent: true
      }
    ],
    hotspots: [
      { id: 'thredbo', name: 'Thredbo Village', altitudeMeters: 1365, description: 'Alpine ski resort village starting point.', xRatio: -0.3, yRatio: -0.4, zRatio: 0.3, type: 'base_camp' },
      { id: 'kosciuszko_summit', name: 'Kosciuszko Summit Monument', altitudeMeters: 2228, description: 'Rounded granite summit stone pillar.', xRatio: 0.0, yRatio: 0.42, zRatio: 0.0, type: 'summit' }
    ],
    culturalSignificance: 'Sacred Indigenous Ngarigo country, home to traditional summer Bogong moth harvesting gatherings.',
    conservationStatus: 'Kosciuszko National Park & UNESCO Biosphere Reserve.',
    terrainType: 'plateau_cone',
    roughness: 0.4,
    peakSharpness: 0.35,
    snowLineRatio: 0.85
  },

  {
    id: 'annapurna',
    name: 'Annapurna I',
    localNames: ['Goddess of the Harvests (Sanskrit)'],
    continent: 'Asia',
    country: ['Nepal'],
    mountainRange: 'Himalayas (Annapurna Massif)',
    elevationMeters: 8091,
    prominenceMeters: 2984,
    isolationKm: 34,
    latitude: 28.5961,
    longitude: 83.8203,
    isSevenSummit: false,
    isVolcano: false,
    isUnesco: false,
    tagline: 'The First 8,000m Peak Ever Climbed by Man',
    summary: 'Annapurna I is the 10th highest peak in the world. Historically infamous for its massive South Face wall and frequent avalanches, it was the first 8,000m peak ever conquered in 1950.',
    heroImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop'
    ],
    geology: {
      rockType: 'Sedimentary Tethyan Limestone & Granite Injections',
      tectonicOrigin: 'Himalayan Orogeny Collision',
      ageMillionsYears: 50,
      formationType: 'Fold Mountain',
      funFact: 'Annapurna Circuit is widely considered one of the world’s ultimate trekking journeys, circling the entire mountain massif.'
    },
    climate: {
      summerAvgTempC: -15,
      winterAvgTempC: -32,
      deathZoneAltitudeMeters: 8000,
      glaciersCount: 9,
      predominantWindKmH: 220,
      wildlife: ['Snow Leopard', 'Blue Sheep (Bharal)', 'Himalayan Monal Pheasant'],
      flora: ['Rhododendron Forests', 'Alpine Mosses']
    },
    routes: [
      {
        name: 'North Face French Route',
        difficulty: 'Extreme',
        durationDays: 50,
        distanceKm: 40,
        bestMonths: ['April', 'May', 'October'],
        description: 'Extremely avalanche-prone snow slope route pioneered by Maurice Herzog.',
        successRatePercent: 40
      }
    ],
    expeditions: [
      {
        year: 1950,
        climberName: 'Maurice Herzog & Louis Lachenal',
        nationalities: ['France'],
        notes: 'First historic ascent of an 8,000-meter peak in human history.',
        isFirstAscent: true
      }
    ],
    hotspots: [
      { id: 'abc', name: 'Annapurna Sanctuary Base Camp', altitudeMeters: 4130, description: '360-degree glacial amphitheater surrounded by 7,000m peaks.', xRatio: -0.2, yRatio: -0.3, zRatio: 0.2, type: 'base_camp' },
      { id: 'annapurna_summit', name: 'Annapurna I Summit', altitudeMeters: 8091, description: 'Summit crest of the harvest goddess.', xRatio: 0.0, yRatio: 0.47, zRatio: 0.0, type: 'summit' }
    ],
    culturalSignificance: 'Annapurna is Sanskrit for "Filled with food" and revered as Lakshmi, goddess of wealth and agriculture.',
    conservationStatus: 'Annapurna Conservation Area Project (ACAP) - Largest protected area in Nepal.',
    terrainType: 'massive_ridge',
    roughness: 0.9,
    peakSharpness: 0.9,
    snowLineRatio: 0.4
  },

  {
    id: 'mont_blanc',
    name: 'Mont Blanc (Monte Bianco)',
    localNames: ['The White Mountain', 'Monshu'],
    continent: 'Europe',
    country: ['France', 'Italy'],
    mountainRange: 'Graian Alps',
    elevationMeters: 4805.59,
    prominenceMeters: 4695,
    isolationKm: 2812,
    latitude: 45.8326,
    longitude: 6.8652,
    isSevenSummit: false,
    isVolcano: false,
    isUnesco: false,
    tagline: 'The Birthplace of Modern Mountaineering',
    summary: 'Mont Blanc is the highest mountain peak in Western Europe. Rising above the Chamonix and Courmayeur valleys, its snow dome summit hosted the birth of modern mountaineering in 1786.',
    heroImage: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop'
    ],
    geology: {
      rockType: 'Proterozoic Granite and Crystalline Schist',
      tectonicOrigin: 'European and African Plate Collision (Alpine Orogeny)',
      ageMillionsYears: 300,
      formationType: 'Fold Mountain',
      funFact: 'Mont Blanc’s exact height changes year to year by several meters depending on snow and ice accumulation on its summit cap!'
    },
    climate: {
      summerAvgTempC: -2,
      winterAvgTempC: -22,
      glaciersCount: 12,
      predominantWindKmH: 140,
      wildlife: ['Alpine Ibex', 'Chamois', 'Bearded Vulture'],
      flora: ['Glacier Buttercup', 'Saxifrage', 'Swiss Stone Pine']
    },
    routes: [
      {
        name: 'Goûter Route (Royal Route)',
        difficulty: 'Advanced',
        durationDays: 2,
        distanceKm: 14,
        bestMonths: ['June', 'July', 'August', 'September'],
        description: 'The standard French route via Nid d’Aigle, Refuge du Goûter, and the Bosses Ridge.',
        successRatePercent: 80
      }
    ],
    expeditions: [
      {
        year: 1786,
        climberName: 'Jacques Balmat & Michel-Gabriel Paccard',
        nationalities: ['France'],
        notes: 'First recorded ascent, sparking the era of modern mountaineering.',
        isFirstAscent: true
      }
    ],
    hotspots: [
      { id: 'chamonix', name: 'Chamonix Valley Base', altitudeMeters: 1035, description: 'Capital of world mountain sports.', xRatio: -0.3, yRatio: -0.4, zRatio: 0.3, type: 'base_camp' },
      { id: 'gouter_refuge', name: 'Refuge du Goûter', altitudeMeters: 3835, description: 'Futuristic metal egg hut hanging above Aiguille du Goûter.', xRatio: 0.0, yRatio: 0.1, zRatio: 0.05, type: 'camp' },
      { id: 'montblanc_summit', name: 'Mont Blanc Summit Snow Dome', altitudeMeters: 4805.59, description: 'Wide snow dome summit.', xRatio: 0.0, yRatio: 0.45, zRatio: 0.0, type: 'summit' }
    ],
    culturalSignificance: 'Birthplace of alpine climbing culture and iconic Tour du Mont Blanc trekking trail.',
    conservationStatus: 'Espace Mont-Blanc transboundary conservation program.',
    terrainType: 'pyramid',
    roughness: 0.72,
    peakSharpness: 0.75,
    snowLineRatio: 0.45
  },

  {
    id: 'elbrus',
    name: 'Mount Elbrus',
    localNames: ['Mingi Tau (Karachay-Balkar)', 'Oshxamaho (Kabardian)'],
    continent: 'Europe',
    country: ['Russia'],
    mountainRange: 'Caucasus Mountains',
    elevationMeters: 5642,
    prominenceMeters: 4741,
    isolationKm: 2470,
    latitude: 43.3499,
    longitude: 42.4453,
    isSevenSummit: true,
    isVolcano: true,
    isUnesco: false,
    tagline: 'The Twin-Peaked Volcanic Giant of the Caucasus',
    summary: 'Mount Elbrus is a dormant stratovolcano in the Caucasus range and the official highest peak in continental Europe. Featuring two distinct volcanic domes covered in a permanent ice cap.',
    heroImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop'
    ],
    geology: {
      rockType: 'Dacite and Andesite Volcanic Lavas',
      tectonicOrigin: 'Arabian Plate pushing north into Eurasian Plate',
      ageMillionsYears: 2.5,
      formationType: 'Volcano (Stratovolcano)',
      funFact: 'Greek mythology tells that Prometheus was chained to Mount Elbrus by Zeus for giving fire to humanity!'
    },
    climate: {
      summerAvgTempC: -8,
      winterAvgTempC: -30,
      glaciersCount: 22,
      predominantWindKmH: 160,
      wildlife: ['Caucasian Tur', 'Caucasian Snowcock', 'Chamois'],
      flora: ['Rhododendron caucasicum', 'Alpine Meadow Grasses']
    },
    routes: [
      {
        name: 'South Route (Gara-Bashi Cable Car)',
        difficulty: 'Intermediate',
        durationDays: 7,
        distanceKm: 16,
        bestMonths: ['July', 'August'],
        description: 'Utilizes cable cars up to 3,800m, climbing snow slopes past Pastukhov Rocks and the Saddle to West Summit.',
        successRatePercent: 88
      }
    ],
    expeditions: [
      {
        year: 1874,
        climberName: 'Florence Crauford Grove & Team',
        nationalities: ['United Kingdom'],
        notes: 'First recorded ascent of the higher West Summit (5,642m).',
        isFirstAscent: true
      }
    ],
    hotspots: [
      { id: 'elbrus_barrels', name: 'Gara-Bashi Barrel Huts', altitudeMeters: 3800, description: 'Famous cylindrical metal barrel huts at cable car terminus.', xRatio: -0.25, yRatio: -0.2, zRatio: 0.2, type: 'base_camp' },
      { id: 'saddle', name: 'Elbrus Saddle', altitudeMeters: 5416, description: 'Snow col between East and West summits.', xRatio: 0.0, yRatio: 0.3, zRatio: 0.05, type: 'camp' },
      { id: 'elbrus_summit', name: 'West Summit', altitudeMeters: 5642, description: 'Highest volcanic crest in Europe.', xRatio: 0.0, yRatio: 0.46, zRatio: 0.0, type: 'summit' }
    ],
    culturalSignificance: 'Mythic mountain of Prometheus and sacred landmark of Balkar mountain people.',
    conservationStatus: 'Prielbrusye National Park protected reserve.',
    terrainType: 'twin_peak',
    roughness: 0.6,
    peakSharpness: 0.65,
    snowLineRatio: 0.5
  },

  {
    id: 'etna',
    name: 'Mount Etna',
    localNames: ['Mongibello', 'Aetna'],
    continent: 'Europe',
    country: ['Italy'],
    mountainRange: 'Sicilian Alps / Standalone Volcano',
    elevationMeters: 3357,
    prominenceMeters: 3329,
    isolationKm: 998,
    latitude: 37.7510,
    longitude: 14.9934,
    isSevenSummit: false,
    isVolcano: true,
    isUnesco: true,
    tagline: 'Europe’s Most Active & Majestic Volcano',
    summary: 'Mount Etna on the east coast of Sicily is Europe’s highest active volcano. Continuously rumbling with glowing lava fountains, ash plumes, and fertile vineyards around its flanks.',
    heroImage: 'https://images.unsplash.com/photo-1589553460732-58ef7a71fbb5?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=1000&auto=format&fit=crop'
    ],
    geology: {
      rockType: 'Basaltic Lava, Tephra, & Scoria',
      tectonicOrigin: 'African Plate subducting beneath Eurasian Plate (Rollback volcanism)',
      ageMillionsYears: 0.5,
      formationType: 'Volcano (Stratovolcano)',
      funFact: 'Mount Etna has been erupting almost continuously for over 500,000 years, recorded by writers since ancient Greek antiquity!'
    },
    climate: {
      summerAvgTempC: 12,
      winterAvgTempC: -8,
      glaciersCount: 0,
      predominantWindKmH: 90,
      wildlife: ['Wild Cat', 'Red Fox', 'Golden Eagle', 'Sicilian Lizard'],
      flora: ['Etna Broom (Genista aetnensis)', 'Etna Birch', 'Sicilian Pine']
    },
    routes: [
      {
        name: 'Sapienza South Crater Trail',
        difficulty: 'Beginner',
        durationDays: 1,
        distanceKm: 10,
        bestMonths: ['May', 'June', 'September', 'October'],
        description: 'Trek or 4x4 bus up to Torre del Filosofo, walking past steaming summit craters with volcano guide.',
        successRatePercent: 98
      }
    ],
    expeditions: [
      {
        year: -430,
        climberName: 'Empedocles (Philosopher Legend)',
        nationalities: ['Ancient Greece'],
        notes: 'Legend holds philosopher Empedocles threw himself into the volcano to prove immortality.',
        isFirstAscent: true
      }
    ],
    hotspots: [
      { id: 'rifugio_sapienza', name: 'Rifugio Sapienza', altitudeMeters: 1910, description: 'Lower visitor base with restaurants and cable car.', xRatio: -0.3, yRatio: -0.3, zRatio: 0.3, type: 'base_camp' },
      { id: 'etna_craters', name: 'Summit Central Craters', altitudeMeters: 3357, description: 'Steaming summit volcanic abyss.', xRatio: 0.0, yRatio: 0.45, zRatio: 0.0, type: 'summit' }
    ],
    culturalSignificance: 'Forge of Vulcan in Roman mythology and home of the monster Typhon in Greek legend.',
    conservationStatus: 'Parco dell’Etna UNESCO World Heritage Site.',
    terrainType: 'crater',
    roughness: 0.7,
    peakSharpness: 0.5,
    snowLineRatio: 0.7
  }
];

export const CONTINENTS_LIST = [
  'All',
  'Asia',
  'Europe',
  'Africa',
  'North America',
  'South America',
  'Antarctica',
  'Australia / Oceania'
] as const;
