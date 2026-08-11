import { QuizQuestion, Article, TimelineEvent } from '../types';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    category: 'Geology',
    question: 'What marine discovery was made at the very summit limestone of Mount Everest?',
    options: [
      'Prehistoric shark teeth',
      'Fossilized ammonites and sea shells',
      'Volcanic obsidian glass',
      'Frozen coral reefs'
    ],
    correctAnswerIndex: 1,
    explanation: 'Limestone rock near Everest’s summit contains 450-million-year-old fossilized marine ammonites and sea crinoids from the ancient Tethys Sea floor before continental collision uplifted the Himalayas.',
    mountainId: 'everest'
  },
  {
    id: 'q2',
    category: 'Geography',
    question: 'Which of the "Seven Summits" is the highest peak in North America?',
    options: ['Mount Logan', 'Aconcagua', 'Denali', 'Mount Rainier'],
    correctAnswerIndex: 2,
    explanation: 'Denali in Alaska stands at 6,190m (20,310 ft) and is the highest peak in North America.',
    mountainId: 'denali'
  },
  {
    id: 'q3',
    category: 'Records',
    question: 'Which mountain is technically the tallest on Earth when measured from its underwater base to summit?',
    options: ['Mount Everest', 'Mauna Kea', 'Kilimanjaro', 'K2'],
    correctAnswerIndex: 1,
    explanation: 'Mauna Kea in Hawaii measures 10,210 meters (33,500 feet) from its submerged ocean floor base to summit, making it taller than Everest from base to peak!',
    mountainId: 'fuji'
  },
  {
    id: 'q4',
    category: 'History',
    question: 'Who were the first climbers confirmed to reach the summit of Mount Everest on May 29, 1953?',
    options: [
      'Reinhold Messner & Peter Habeler',
      'Edmund Hillary & Tenzing Norgay',
      'George Mallory & Andrew Irvine',
      'Maurice Herzog & Louis Lachenal'
    ],
    correctAnswerIndex: 1,
    explanation: 'Edmund Hillary of New Zealand and Sherpa Tenzing Norgay of Nepal achieved the historic first confirmed ascent of Everest in 1953.',
    mountainId: 'everest'
  },
  {
    id: 'q5',
    category: 'Wildlife',
    question: 'How many distinct ecological zones do climbers pass through when ascending Mount Kilimanjaro?',
    options: ['2 zones', '3 zones', '5 zones', '7 zones'],
    correctAnswerIndex: 2,
    explanation: 'Climbers trek through 5 zones: Cultivated land, Tropical Rainforest, Heath/Moorland, Alpine Desert, and Arctic Ice Cap.',
    mountainId: 'kilimanjaro'
  },
  {
    id: 'q6',
    category: 'Geology',
    question: 'Why does the Matterhorn have its distinctive four-sided pyramid shape?',
    options: [
      'Meteorite impact cratering',
      'Glacial cirque erosion chiseling four distinct faces',
      'Volcanic explosive collapses',
      'Tectonic faultline sliding'
    ],
    correctAnswerIndex: 1,
    explanation: 'Glaciers surrounding the peak eroded the rock inward from four separate directions, carving cirques that met to form a sharp glacial horn pyramid.',
    mountainId: 'matterhorn'
  }
];

export const ARTICLES: Article[] = [
  {
    id: 'tectonics-uplift',
    title: 'How Mountains Form: Plate Tectonics & Continental Collisions',
    category: 'Geology & Uplift',
    readTimeMinutes: 6,
    author: 'Dr. Elena Vance, Senior Geomorphologist',
    date: '2026-03-15',
    summary: 'Discover how Earth’s restless crust crumples, folds, and erupts to build giant mountain ranges over millions of years.',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop',
    contentMarkdown: `
Mountains are monuments to Earth's dynamic crustal forces. There are four primary mountain formation mechanisms:

### 1. Fold Mountains (Continental Collision)
When two continental tectonic plates slam into each other, neither plate easily subducts because both are buoyant. Instead, vast rock layers crumple, fault, and buckle upward into towering chains like the Himalayas, Alps, and Andes. The Indian plate continues pushing northward into Asia at ~5 cm per year, driving Mount Everest higher by ~5 mm annually!

### 2. Volcanic Mountains (Subduction & Rift Zones)
Molten magma beneath Earth's crust forces its way upward through volcanic vents, building conical peaks layer by layer. Examples include Mount Fuji, Mount Kilimanjaro, and Mount Etna.

### 3. Fault-Block Mountains
Tensional forces stretch the crust until blocks of rock snap along fault lines. One block drops down while adjacent blocks tilt upward to form sharp ranges, like the Sierra Nevada or Vinson Massif in Antarctica.

### 4. Dome Mountains
Magma pushes upward beneath the surface rock layers without erupting, creating a smooth dome-shaped swelling, such as Mount Kosciuszko's granite core.
`
  },
  {
    id: 'altitude-physiology',
    title: 'The Science of the Death Zone & Hypoxia Physiology',
    category: 'Altitude Science',
    readTimeMinutes: 8,
    author: 'Dr. Marcus Thorne, High Altitude Expedition Medical Officer',
    date: '2026-04-10',
    summary: 'What happens to the human body above 8,000 meters where oxygen pressure drops by 66%?',
    coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop',
    contentMarkdown: `
Above 8,000 meters (26,247 ft), human biology enters what mountain medicine terms **The Death Zone**.

### Why Oxygen Drops
At sea level, atmospheric barometric pressure forces oxygen molecules through lungs into red blood cells. While air remains 21% oxygen at all altitudes, the atmospheric pressure at Everest's summit drops to only 33% of sea level pressure. Lungs cannot diffuse oxygen efficiently, leading to rapid cellular starvation.

### Physiological Compensations & Hazards
- **Hyperventilation & Alkalosis**: Breathing rate quadruples to pull in scarce oxygen, exhaling CO2 rapidly and altering blood pH.
- **Acclimatization**: The body produces hormone EPO, triggering bone marrow to manufacture millions of new red blood cells.
- **HAPE (High Altitude Pulmonary Edema)**: High pressure causes fluid leakage into lung alveoli.
- **HACE (High Altitude Cerebral Edema)**: Brain swelling causing hallucinations, loss of motor control, and coma if not descended immediately.
`
  },
  {
    id: 'glaciers-climate',
    title: 'Glaciers as Water Towers: Climate Impact on Alpine Reservoirs',
    category: 'Glaciers & Climate',
    readTimeMinutes: 5,
    author: 'Prof. Anika Sharma, Glaciology Institute',
    date: '2026-05-02',
    summary: 'High mountain glaciers store over 70% of Earth’s freshwater, feeding rivers that sustain over 1.9 billion people below.',
    coverImage: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?q=80&w=1000&auto=format&fit=crop',
    contentMarkdown: `
Glaciers are giant rivers of ice formed over centuries from compacted snow.

### Glacial Anatomy & Features
- **Cirque**: Bowl-shaped basin at the head of a glacial valley.
- **Crevasses**: Massive cracks in ice formed as glaciers bend over steep bedrock steps.
- **Moraines**: Rock debris pushed along the sides (lateral) and terminus (terminal) of retreating ice sheets.

### Climate Change & Water Towers
Himalayan, Andean, and Alpine glaciers are retreating at unprecedented rates. Protecting high-altitude ecosystems is crucial for preserving agricultural water supplies for river basins like the Ganges, Indus, Yangtze, and Rhine.
`
  }
];

export const HISTORICAL_TIMELINE: TimelineEvent[] = [
  {
    year: 1786,
    title: 'First Ascent of Mont Blanc',
    mountainName: 'Mont Blanc',
    location: 'France / Italy',
    description: 'Jacques Balmat and Michel-Gabriel Paccard reached the summit of Mont Blanc, marking the official birth of modern mountaineering.',
    category: 'First Ascent',
    heroClimber: 'Jacques Balmat & Dr. Michel-Gabriel Paccard'
  },
  {
    year: 1865,
    title: 'Matterhorn Conquered & Tragic Descent',
    mountainName: 'Matterhorn',
    location: 'Switzerland',
    description: 'Edward Whymper led a 7-man team to the summit of the Matterhorn. On the descent, a snapped rope resulted in four climbers falling 1,400 meters.',
    category: 'Tragedy & Rescue',
    heroClimber: 'Edward Whymper'
  },
  {
    year: 1950,
    title: 'First 8,000m Peak Conquered: Annapurna',
    mountainName: 'Annapurna I',
    location: 'Nepal',
    description: 'Maurice Herzog and Louis Lachenal stood atop Annapurna I, proving that human beings could survive and summit the world’s 8,000-meter giants.',
    category: 'First Ascent',
    heroClimber: 'Maurice Herzog & Louis Lachenal'
  },
  {
    year: 1953,
    title: 'Mount Everest First Confirmed Summit',
    mountainName: 'Mount Everest',
    location: 'Nepal / China',
    description: 'Edmund Hillary and Tenzing Norgay reached the highest point on Earth at 11:30 AM on May 29, 1953.',
    category: 'First Ascent',
    heroClimber: 'Edmund Hillary & Tenzing Norgay'
  },
  {
    year: 1954,
    title: 'K2 Conquered by Italian Expedition',
    mountainName: 'K2',
    location: 'Pakistan',
    description: 'Lino Lacedelli and Achille Compagnoni summitted K2 via the Abruzzi Spur in the Karakoram.',
    category: 'First Ascent',
    heroClimber: 'Lino Lacedelli & Achille Compagnoni'
  },
  {
    year: 1978,
    title: 'Everest Without Oxygen',
    mountainName: 'Mount Everest',
    location: 'Nepal',
    description: 'Reinhold Messner and Peter Habeler shocked the medical world by reaching Everest summit without bottled oxygen.',
    category: 'Solo Legend',
    heroClimber: 'Reinhold Messner & Peter Habeler'
  },
  {
    year: 2021,
    title: 'First Winter Summit of K2',
    mountainName: 'K2',
    location: 'Pakistan',
    description: 'A 10-person all-Nepali team led by Nimsdai Purja achieved the ultimate winter mountaineering challenge on K2.',
    category: 'Speed Record',
    heroClimber: 'Nimsdai Purja & Nepali Sherpa Team'
  }
];
