import type { SurfaceSite } from '../types';

export const WONDERS: SurfaceSite[] = [
  {
    id: 'great-wall',
    name: 'Great Wall of China',
    parentId: 'earth',
    latitude: 40.4319,
    longitude: 116.5704,
    country: 'China',
    built: 'c. 7th century BCE – 17th century CE',
    category: 'Fortification',
    description:
      "The Great Wall of China is an ancient series of fortifications stretching roughly 21,196 kilometres across northern China's mountains, deserts, and plains. " +
      'Built over many centuries and dynasties, it remains one of the most ambitious construction projects in human history.',
    learn: [
      'Construction on the Great Wall began as early as the 7th century BCE when individual Chinese states erected earthen ramparts along their borders. ' +
        "The first unified wall was ordered by Emperor Qin Shi Huang around 221 BCE, connecting and extending existing sections after he unified the warring states. " +
        'Subsequent dynasties, particularly the Han and Ming, expanded and renovated the wall substantially over the following millennia.',
      'The Ming-era sections visitors see today were largely built between 1368 and 1644 CE using fired bricks and cut stone — far more durable materials than the packed earth used by earlier builders. ' +
        'Watchtowers spaced roughly every 500 metres allowed soldiers to relay fire and smoke signals across vast distances in minutes. ' +
        'Some sections incorporated natural barriers like cliffs and rivers to minimise construction effort.',
      "The wall was never a single unbroken line but a network of walls, forts, and beacon towers collectively serving as border infrastructure. " +
        "It regulated trade, controlled migration, and collected customs duties as much as it repelled invaders. " +
        "The Silk Road's northern branch ran alongside stretches of the wall, making it a commercial artery as well as a defensive one.",
      "Today the wall is a UNESCO World Heritage Site, though rapid tourism and weathering have eroded many sections beyond recognition. " +
        "Conservation programmes at Badaling and Mutianyu have stabilised key segments, while remote stretches remain in ruin. " +
        "Satellite imagery has revealed previously uncharted sections, and the total mapped length continues to grow with new surveys.",
    ],
    facts: [
      'The total mapped length of all wall sections combined is approximately 21,196 km — long enough to circle the Earth halfway.',
      "At its peak during the Ming dynasty, an estimated 1 million soldiers were garrisoned along the wall's length.",
      'Some stretches near Badaling rise to 8.5 metres in height with a walkway wide enough for five horses abreast.',
      'The wall was built by hundreds of thousands of labourers, including soldiers, peasants, and prisoners.',
      'Contrary to popular belief, the Great Wall is not visible to the naked eye from low Earth orbit — the claim has been debunked by astronauts.',
      "Sticky rice mortar mixed with limestone was used in the Ming sections, giving the joints remarkable strength that has survived centuries.",
    ],
    gallery: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/The_Great_Wall_of_China_at_Jinshanling-edit.jpg/1280px-The_Great_Wall_of_China_at_Jinshanling-edit.jpg',
        caption: 'The Great Wall at Jinshanling, winding across the forested hills of Hebei province.',
        credit: 'Wikimedia Commons (CC BY-SA 3.0)',
      },
    ],
  },
  {
    id: 'petra',
    name: 'Petra',
    parentId: 'earth',
    latitude: 30.3285,
    longitude: 35.4444,
    country: 'Jordan',
    built: 'c. 4th century BCE – 2nd century CE',
    category: 'Rock-cut city',
    description:
      'Petra is a spectacular archaeological city in southern Jordan, carved directly into rose-red sandstone cliffs by the Nabataean civilisation over two thousand years ago. ' +
      'Known as the "Rose City" for the colour of its stone, it served as the thriving capital of the Nabataean Kingdom and a vital crossroads of ancient trade routes.',
    learn: [
      'The Nabataeans, a nomadic Arab people, established Petra as their capital around the 4th century BCE, exploiting its natural defences — a narrow gorge called the Siq provided the only easy entrance. ' +
        'They grew wealthy by controlling the spice and incense trade between Arabia, Egypt, and the Mediterranean. ' +
        "The city's sophisticated water management system, including dams, cisterns, and ceramic pipes, allowed a population of roughly 20,000 to thrive in an arid desert valley.",
      'The most iconic structure, Al-Khazneh (the Treasury), was carved directly into the cliff face and stands roughly 40 metres tall. ' +
        "It likely served as a royal tomb for King Aretas IV rather than a storehouse, despite its popular name. " +
        "Petra contains over 800 individual rock-cut tombs, temples, and dwellings, many adorned with elaborate Hellenistic-style facades that blend Greek, Roman, and indigenous Nabataean aesthetics.",
      "Rome annexed the Nabataean Kingdom in 106 CE, but Petra remained an important provincial city for over a century. " +
        "A devastating earthquake in 363 CE damaged the water supply infrastructure and triggered a gradual decline. " +
        "By the early Islamic period the city was largely abandoned, and its location faded from Western knowledge until Swiss explorer Johann Ludwig Burckhardt rediscovered it in 1812.",
      "Petra is now Jordan's most-visited tourist site and a UNESCO World Heritage Site designated in 1985. " +
        "Ongoing archaeological excavations continue to uncover new structures, including a massive ceremonial platform discovered via satellite imagery in 2016. " +
        "Conservation is a pressing challenge; flash floods, salt crystallisation, and tourist foot traffic threaten the fragile sandstone carvings.",
    ],
    facts: [
      "Petra's main entrance gorge, the Siq, is approximately 1.2 km long and in places only 3 metres wide.",
      'Al-Khazneh (the Treasury) stands 40 metres tall — roughly the height of a 13-storey building.',
      'Only about 15 % of the ancient city has been excavated; the vast majority lies underground.',
      'The Nabataeans channelled seasonal floodwaters into cisterns capable of holding millions of litres to sustain the city year-round.',
      'Petra appears in the climax of the 1989 film Indiana Jones and the Last Crusade, boosting global tourism dramatically.',
      'At its height in the 1st century BCE, Petra may have had a population of 30,000 people.',
    ],
  },
  {
    id: 'christ-redeemer',
    name: 'Christ the Redeemer',
    parentId: 'earth',
    latitude: -22.9519,
    longitude: -43.2105,
    country: 'Brazil',
    built: '1922–1931 CE',
    category: 'Statue',
    description:
      'Christ the Redeemer is an iconic Art Deco statue of Jesus Christ standing atop Corcovado Mountain in Rio de Janeiro, Brazil, with outstretched arms spanning 28 metres. ' +
      'At 30 metres tall on a 8-metre pedestal, it gazes over the city and Guanabara Bay and has become the most recognised symbol of Brazil.',
    learn: [
      "The idea for a large religious monument on Corcovado was first proposed in the 1850s but gained traction in the early 20th century amid Brazil's growing Catholic identity. " +
        "A national competition in 1921 selected a design by engineer Heitor da Silva Costa, which was later refined by French sculptor Paul Landowski who sculpted the face and hands. " +
        "Construction officially began on 4 April 1922 — the centenary of Brazilian independence — and was completed in 1931.",
      "The statue is built from reinforced concrete clad in approximately 6 million soapstone tiles, chosen for their workability and weather resistance. " +
        "Soapstone tiles were cut in France and assembled like a mosaic by workers on the mountain. " +
        "The outstretched arms span 28 metres and the total weight of the structure, including the pedestal, is around 1,145 metric tonnes.",
      "Christ the Redeemer sits at 710 metres above sea level at the peak of Corcovado within the Tijuca Forest national park. " +
        "The elevated position means the statue is struck by lightning an average of six times per year, necessitating periodic repairs to the fingers, eyebrows, and head. " +
        "A cogwheel train railway constructed in 1884 — originally for transporting materials — still carries visitors to the summit.",
      "The statue was declared a UNESCO World Heritage Site as part of the Rio de Janeiro cultural landscape in 2012. " +
        "It was named one of the New Seven Wonders of the World in 2007 following a global vote. " +
        "The monument is maintained by the Archdiocese of Rio de Janeiro and undergoes regular restoration, most recently in 2010 and 2020.",
    ],
    facts: [
      'The statue weighs approximately 635 metric tonnes, with the entire structure including the pedestal reaching 1,145 tonnes.',
      'About 6 million small soapstone tiles cover the exterior surface of the figure.',
      'Lightning strikes the statue roughly 6 times per year, requiring regular repairs to the extremities.',
      "The cogwheel railway to Corcovado summit was inaugurated in 1884, over four decades before the statue was built.",
      'On a clear day the view from the viewing platform extends approximately 75 km in all directions.',
      "Christ the Redeemer's face was sculpted in Paris by Romanian sculptor Gheorghe Leonida, then shipped to Brazil.",
    ],
    gallery: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Christ_the_Redeemer_-_Cristo_Redentor.jpg/800px-Christ_the_Redeemer_-_Cristo_Redentor.jpg',
        caption: 'Christ the Redeemer atop Corcovado Mountain overlooking Rio de Janeiro.',
        credit: 'Wikimedia Commons (CC BY-SA 3.0)',
      },
    ],
  },
  {
    id: 'machu-picchu',
    name: 'Machu Picchu',
    parentId: 'earth',
    latitude: -13.1631,
    longitude: -72.5450,
    country: 'Peru',
    built: 'c. 1450–1572 CE',
    category: 'Citadel',
    description:
      'Machu Picchu is a 15th-century Inca citadel perched on a narrow ridge at 2,430 metres above sea level in the Andes of southern Peru, surrounded by cloud forest and dramatic mountain peaks. ' +
      'Its extraordinary dry-stone architecture, terraced agriculture, and astronomical alignments reflect the height of Inca engineering and spiritual sophistication.',
    learn: [
      "Machu Picchu was most likely built around 1450 CE as a royal estate or sacred retreat for the Inca emperor Pachacuti. " +
        "The site was occupied for roughly a century before being abandoned, probably in connection with the Spanish conquest in the 1530s, though the exact reason for its abandonment remains debated. " +
        "American historian Hiram Bingham III brought the site to international attention in 1911 when local farmer Melchor Arteaga led him to the ruins.",
      "The construction method used at Machu Picchu is called ashlar — stones are cut to fit together so precisely that no mortar is required. " +
        "The largest stones weigh over 50 tonnes and were quarried on-site or hauled up steep slopes using ramps, ropes, and human labour. " +
        "The entire complex contains over 200 structures, including temples, palaces, and residential compounds, arranged around a central plaza.",
      "Machu Picchu demonstrates a sophisticated understanding of astronomy; the Intihuatana stone functions as a solar clock or astronomical calendar, and windows in the Temple of the Sun align perfectly with the sunrise during the June solstice. " +
        "Roughly 60 % of the construction effort went into underground drainage and terracing infrastructure, which has kept the site largely free of catastrophic landslides for over 500 years. " +
        "Agricultural terraces (andenes) created microclimates that allowed a variety of crops to grow at altitude.",
      "UNESCO designated Machu Picchu a World Heritage Site in 1983, and it received New Seven Wonders status in 2007. " +
        "Visitor numbers have grown to over 1.5 million annually, prompting Peru to introduce timed entry slots and daily caps to protect the fragile site. " +
        "Ongoing archaeological work continues to refine our understanding of the site's purpose and the lives of its ancient inhabitants.",
    ],
    facts: [
      'Machu Picchu sits at 2,430 metres above sea level, embedded between peaks that reach over 3,000 metres.',
      'Not a single drop of mortar was used in the construction — stones were shaped to interlock with extraordinary precision.',
      'The Intihuatana stone has never been broken; the similarly named stone at Pisac was damaged by a film crew in 2000.',
      'Roughly 60 % of the total construction effort at the site went into subsurface drainage systems invisible to visitors.',
      'Hiram Bingham carried out three expeditions between 1911 and 1915, removing thousands of artefacts to Yale — many were returned to Peru only in 2012.',
      'Over 100 distinct flight of stairs connect the different levels of the citadel, with the most dramatic rising 100 individual stone steps.',
    ],
    gallery: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu%2C_Peru.jpg/1280px-Machu_Picchu%2C_Peru.jpg',
        caption: 'Machu Picchu at dawn, with Huayna Picchu peak rising behind the citadel.',
        credit: 'Wikimedia Commons (CC BY-SA 3.0)',
      },
    ],
  },
  {
    id: 'chichen-itza',
    name: "Chichén Itzá",
    parentId: 'earth',
    latitude: 20.6829,
    longitude: -88.5686,
    country: 'Mexico',
    built: 'c. 600–1200 CE',
    category: 'Step pyramid',
    description:
      "Chichén Itzá is a pre-Columbian Maya city on Mexico's Yucatán Peninsula whose towering step pyramid El Castillo has become one of the most photographed archaeological monuments in the Americas. " +
      "The site served as a major political and economic hub of the Maya civilisation and blends diverse regional architectural styles.",
    learn: [
      "Chichén Itzá rose to prominence between roughly 600 and 900 CE, and reached its political peak between 900 and 1200 CE when it became one of the largest cities in the Maya world. " +
        "The city's name means 'at the mouth of the well of the Itza' — a reference to the sacred cenotes (natural sinkholes) that provided fresh water and served as sites of ritual offerings. " +
        "Large quantities of human remains, jade, and gold objects have been recovered from the Sacred Cenote, indicating it was used for sacrificial ceremonies.",
      "El Castillo (Temple of Kukulcan) is a pyramid 24 metres tall with 91 steps on each of its four sides plus the platform at the top — totalling 365 steps, matching the solar year. " +
        "On the spring and autumn equinoxes, the late-afternoon sun casts a shadow that creates the optical illusion of a feathered serpent descending the northern staircase — an event that draws tens of thousands of visitors. " +
        "Acoustic studies of El Castillo have revealed that clapping in front of the pyramid produces an echo resembling the chirp of the quetzal bird, possibly an intentional design.",
      "Chichén Itzá also features a Great Ball Court, the largest known in Mesoamerica at 168 metres long, where a game called pok-a-tok was played. " +
        "Stone rings set 8 metres high on the walls mark the goals, and bas-reliefs show players in elaborate protective gear. " +
        "The observatory structure known as El Caracol has window alignments that track astronomical events including Venus's movements.",
      "The site was declared a UNESCO World Heritage Site in 1988 and voted one of the New Seven Wonders in 2007. " +
        "Archaeological work has discovered a smaller pyramid inside El Castillo and a cenote directly beneath it, revealed by ground-penetrating radar surveys in 2015–2016. " +
        "Visitor numbers now exceed 2 million annually, making conservation of the fragile limestone structures an ongoing challenge.",
    ],
    facts: [
      "El Castillo has 365 steps in total — one for each day of the solar year — built by a civilisation with a sophisticated calendar system.",
      "The Great Ball Court at Chichén Itzá is 168 metres long, making it the largest such court ever found in Mesoamerica.",
      "Ground-penetrating radar in 2015 detected a hidden cenote (underground water chamber) directly beneath El Castillo pyramid.",
      "On each equinox, the shadow on El Castillo's staircase creates the illusion of a serpent 37 metres long descending to Earth.",
      "Over 30,000 offerings including human skulls, jade, and gold have been dredged from the Sacred Cenote since excavations began in 1904.",
      "Acoustic researchers found that handclaps near El Castillo produce a chirp-like echo that mimics the call of the quetzal bird.",
    ],
  },
  {
    id: 'colosseum',
    name: 'Colosseum',
    parentId: 'earth',
    latitude: 41.8902,
    longitude: 12.4922,
    country: 'Italy',
    built: '70–80 CE',
    category: 'Amphitheatre',
    description:
      "The Colosseum is a massive elliptical amphitheatre in central Rome built by emperors of the Flavian dynasty, capable of seating between 50,000 and 80,000 spectators for gladiatorial contests, animal hunts, and public spectacles. " +
      "Constructed between 70 and 80 CE, it remains the largest amphitheatre ever built and is a defining symbol of Roman engineering and Imperial power.",
    learn: [
      "Emperor Vespasian began construction of the Colosseum around 70 CE on the site of Nero's artificial lake, symbolically reclaiming land the previous emperor had seized for private use. " +
        "His son Titus inaugurated the completed structure in 80 CE with 100 days of games that reportedly featured 9,000 animals and thousands of gladiatorial bouts. " +
        "A further storey was added under Emperor Domitian, bringing it to its current four-storey height.",
      "The structure measures 188 by 156 metres at its outer perimeter and rises 48 metres. " +
        "An elaborate system of 80 vaulted arcades ringed the exterior, creating efficient crowd flow for rapid entry and exit — a concept modern stadium architects still emulate. " +
        "Beneath the arena floor lay the hypogeum, a labyrinth of tunnels, cages, and lifts used to raise animals and scenery dramatically through trapdoors into the arena.",
      "The Colosseum could apparently be flooded for staged naval battles (naumachiae) in its early years, before the hypogeum was constructed. " +
        "A massive retractable awning called the velarium, operated by a crew of sailors from the Misenum naval base, shielded spectators from the sun. " +
        "Seating was rigidly stratified: the emperor's box was at the best vantage point, with senators, knights, ordinary citizens, and women each allocated distinct sections.",
      "Earthquakes in 847 and 1349 CE caused significant structural collapses, and for centuries the ruins were quarried for building material — the Palazzo Venezia and St. Peter's Basilica both used stone salvaged from it. " +
        "Today the Colosseum is Italy's most-visited monument, attracting about 6 million visitors per year. " +
        "A major multi-decade restoration project is underway to stabilise the structure and restore the arena floor, which was largely removed by 19th-century archaeologists.",
    ],
    facts: [
      'At its maximum capacity the Colosseum could seat between 50,000 and 80,000 spectators.',
      'The 80 entrance arches allowed the crowd to be fully seated in under 15 minutes — a feat matched by few modern stadia.',
      'The hypogeum beneath the arena contained 32 animal pens and 80 vertical shafts used to hoist scenery and beasts into the arena.',
      "Construction consumed an estimated 100,000 cubic metres of travertine limestone, held together by 300 tonnes of iron clamps.",
      "The Roman numeral 'L' (50) was removed from the original entrance numbering, making 79 the effective maximum gate count.",
      'Earthquakes in 847 and 1349 CE destroyed roughly two-thirds of the outer south wall, which was never rebuilt.',
    ],
    gallery: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/1280px-Colosseo_2020.jpg',
        caption: 'The Colosseum in Rome, showing the surviving north and west exterior walls.',
        credit: 'Wikimedia Commons (CC BY-SA 4.0)',
      },
    ],
  },
  {
    id: 'taj-mahal',
    name: 'Taj Mahal',
    parentId: 'earth',
    latitude: 27.1751,
    longitude: 78.0421,
    country: 'India',
    built: '1632–1653 CE',
    category: 'Mausoleum',
    description:
      "The Taj Mahal is a breathtaking white-marble mausoleum on the southern bank of the Yamuna River in Agra, India, commissioned by Mughal Emperor Shah Jahan in memory of his beloved wife Mumtaz Mahal who died in 1631. " +
      "Often called the finest example of Mughal architecture, it blends Persian, Islamic, and Indian design traditions in a complex of almost perfect bilateral symmetry.",
    learn: [
      "Shah Jahan commissioned the Taj Mahal in 1632, the year after his third wife Mumtaz Mahal died during childbirth. " +
        "Construction employed an estimated 20,000 artisans drawn from across the Mughal Empire and beyond, including master calligraphers from Persia, mosaicists from Baghdad, and stonecutters from Rajasthan. " +
        "The project took approximately 22 years to complete and consumed resources equivalent to roughly 1 billion US dollars at current values.",
      "The main mausoleum is clad entirely in white Makrana marble sourced from Rajasthan and inlaid with 28 different types of precious and semi-precious stones in floral and geometric patterns — a technique called pietra dura. " +
        "The central dome rises 73 metres and is flanked by four 41-metre minarets deliberately leaning slightly outward to fall away from the tomb if they ever collapsed in an earthquake. " +
        "The symmetry of the complex is near-perfect, with the main gateway, gardens, mosque, and guest house all precisely mirrored about the central axis.",
      "The Charbagh (four-part garden) reflects classical Islamic paradise garden design, bisected by water channels that symbolise the four rivers of heaven described in the Quran. " +
        "The reflecting pool at the centre of the garden is positioned to mirror the dome of the mausoleum and the minarets. " +
        "The complex also includes a mosque and its mirrored jawab (guest house) flanking the tomb, purely for compositional balance — the jawab faces Mecca's wrong direction and was never used for prayer.",
      "UNESCO designated the Taj Mahal a World Heritage Site in 1983, calling it 'the jewel of Muslim art in India.' " +
        "Air pollution from nearby industries has yellowed the marble, prompting restrictions on vehicle traffic and industrial activity within a 500 km radius. " +
        "Mud-pack treatments are applied periodically to draw out pollutants and restore the marble's luminous whiteness.",
    ],
    facts: [
      'It took approximately 20,000 artisans and labourers more than 20 years to complete the entire complex.',
      "The marble changes colour throughout the day — appearing pinkish at dawn, pure white at noon, and golden under moonlight.",
      'Inlaid calligraphy around the arched portals uses a technique of progressively enlarging the script to appear uniform from below.',
      'The four minarets are slightly tilted outward at an angle of about 0.6° so that if they fell, they would topple away from the main tomb.',
      '28 varieties of precious and semi-precious stones — including lapis lazuli, malachite, and carnelian — are set into the marble surfaces.',
      'A mirror image of the tomb is reflected in the 162-metre-long hauz-i-kausar (reflecting pool) in the Charbagh garden.',
    ],
    gallery: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/1280px-Taj_Mahal_%28Edited%29.jpeg',
        caption: 'The Taj Mahal and its reflecting pool at dawn, Agra, India.',
        credit: 'Wikimedia Commons (CC BY-SA 4.0)',
      },
    ],
  },
  {
    id: 'great-pyramid',
    name: 'Great Pyramid of Giza',
    parentId: 'earth',
    latitude: 29.9792,
    longitude: 31.1342,
    country: 'Egypt',
    built: 'c. 2560 BCE',
    category: 'Tomb',
    honorary: true,
    description:
      "The Great Pyramid of Giza is the oldest and largest of the three pyramids in the Giza Necropolis, built as a tomb for Pharaoh Khufu around 2560 BCE. " +
      "The sole surviving member of the classical Seven Wonders of the Ancient World, it held the title of tallest human-made structure on Earth for over 3,800 years.",
    learn: [
      "The Great Pyramid was built during the reign of Pharaoh Khufu (also called Cheops) of the Fourth Dynasty around 2560 BCE. " +
        "Herodotus claimed 100,000 slaves built it over 20 years, but modern archaeological evidence — including workers' villages, administrative records, and medical texts describing workplace injuries — suggests a paid and organised workforce of perhaps 20,000 skilled labourers. " +
        "The workers were organised into named gangs competing for the pharaoh's favour, and they received wages in grain, bread, and beer.",
      "The original pyramid stood 146.5 metres tall and was clad in smooth white Tura limestone, creating a gleaming surface visible from distant desert plains. " +
        "Most of the casing stones were stripped away during the Middle Ages to build Cairo's mosques and fortifications. " +
        "The core is made from approximately 2.3 million stone blocks weighing between 2.5 and 80 tonnes each, sourced from a quarry directly south of the construction site.",
      "The internal chambers — the King's Chamber, Queen's Chamber, and Grand Gallery — are aligned with remarkable astronomical precision. " +
        "Shafts extending from the King's Chamber point toward the stars Orion's Belt and Thuban (the pole star of that era). " +
        "In 2017, muon tomography (cosmic-ray scanning) revealed a previously unknown large void inside the pyramid roughly 30 metres long, whose purpose remains undetermined.",
      "The Giza complex, including the three pyramids, the Great Sphinx, and associated temples, has been a UNESCO World Heritage Site since 1979. " +
        "Ongoing exploration using robotic cameras and scanning technology continues to probe the pyramid's interior without invasive excavation. " +
        "The Great Pyramid was granted honorary status among the New Seven Wonders of the World, as it was the only surviving ancient wonder and needed no vote.",
    ],
    facts: [
      "Originally 146.5 metres tall, the Great Pyramid was the tallest structure on Earth for 3,800 years until Lincoln Cathedral surpassed it around 1311 CE.",
      "Approximately 2.3 million stone blocks were used, with individual stones weighing between 2.5 and 80 tonnes.",
      "A 2017 muon tomography scan revealed a previously unknown void — at least 30 metres long — hidden inside the pyramid.",
      "The base of the pyramid is level to within 2.1 centimetres across its 230-metre sides — remarkable precision for a 4,500-year-old structure.",
      "The four sides of the base are aligned to true north, south, east, and west with an accuracy of less than 0.05 degrees.",
      "Workers were paid in rations: each labourer reportedly received around 10 loaves of bread and a jug of beer per day.",
    ],
    gallery: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Kheops-Pyramid.jpg/1280px-Kheops-Pyramid.jpg',
        caption: "The Great Pyramid of Khufu with the smaller pyramid of Khafre visible behind it.",
        credit: 'Wikimedia Commons (CC BY-SA 3.0)',
      },
    ],
  },
];

export const WONDERS_BY_ID: Record<string, SurfaceSite> = Object.fromEntries(
  WONDERS.map((w) => [w.id, w]),
);

export function getWonder(id: string): SurfaceSite | undefined {
  return WONDERS_BY_ID[id];
}
