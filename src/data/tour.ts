import type { TourStop } from '../types';

export const TOUR_STOPS: TourStop[] = [
  {
    id: 'tour-sun',
    targetId: 'sun',
    title: 'The Sun — Heart of the Solar System',
    narration:
      "We begin our journey at the Sun, a middle-aged yellow dwarf star 1.39 million kilometres across that accounts for 99.86 % of all the mass in the Solar System. " +
      "Its core reaches 15 million degrees Celsius, fusing 600 million tonnes of hydrogen into helium every single second. " +
      "Every planet, moon, and asteroid you are about to visit owes its warmth and its very orbit to this blazing nuclear furnace.",
    dwellSeconds: 12,
    jumpToDate: '2024-01-01T12:00:00Z',
  },
  {
    id: 'tour-mercury',
    targetId: 'mercury',
    title: 'Mercury — A World of Extremes',
    narration:
      "Closest to the Sun, Mercury is a battered, airless world only slightly larger than our Moon, completing a full orbit in just 88 Earth days. " +
      "Without an atmosphere to redistribute heat, surface temperatures swing from 430 degrees Celsius at noon to minus 180 at night — the largest thermal range of any planet. " +
      "NASA's MESSENGER spacecraft revealed vast volcanic plains and a surprisingly large iron core that makes up 85 % of the planet's radius.",
    dwellSeconds: 10,
  },
  {
    id: 'tour-venus',
    targetId: 'venus',
    title: 'Venus — The Runaway Greenhouse',
    narration:
      "Venus is Earth's twin in size yet a world of crushing extremes: its thick carbon dioxide atmosphere creates a runaway greenhouse effect that heats the surface to 465 degrees Celsius — hot enough to melt lead. " +
      "Clouds of sulphuric acid enshroud the planet in a perpetual orange haze, and the atmospheric pressure at the surface is equivalent to 900 metres underwater on Earth. " +
      "Remarkably, Venus rotates so slowly and in reverse that the Sun rises in the west and sets in the east.",
    dwellSeconds: 10,
  },
  {
    id: 'tour-earth',
    targetId: 'earth',
    title: 'Earth — The Pale Blue Dot',
    narration:
      "Home. Earth is the only world we know of where liquid water covers 71 % of the surface, where oxygen-rich air sustains complex life, and where civilisations have risen to build wonders visible from orbit. " +
      "Our planet sits in the 'Goldilocks zone' — just the right distance from the Sun for temperatures that keep water liquid. " +
      "From here you can explore all seven of the New Wonders of the World pinned to the globe below.",
    dwellSeconds: 13,
  },
  {
    id: 'tour-moon',
    targetId: 'moon',
    title: "The Moon — Earth's Faithful Companion",
    narration:
      "The Moon is Earth's only natural satellite and the only other world where humans have stood, with twelve astronauts walking its surface between 1969 and 1972. " +
      "Its gravitational pull stabilises Earth's axial tilt, preventing wild climate swings, and drives the tides that have shaped coastal ecosystems for billions of years. " +
      "Recent lunar missions have confirmed water ice deposits in permanently shadowed craters near the poles — a potential resource for future crewed outposts.",
    dwellSeconds: 11,
  },
  {
    id: 'tour-mars',
    targetId: 'mars',
    title: 'Mars — The Red Planet',
    narration:
      "Mars is a cold, dusty world with a thin carbon dioxide atmosphere, but it holds some of the Solar System's most dramatic landscapes: Olympus Mons, the tallest volcano, rises 22 kilometres, and Valles Marineris, a canyon system, stretches 4,000 kilometres — long enough to cross the United States four times. " +
      "Ancient river valleys and lake beds indicate that liquid water once flowed freely on its surface. " +
      "Today the Perseverance rover is collecting rock samples that may one day be returned to Earth to search for signs of ancient life.",
    dwellSeconds: 12,
  },
  {
    id: 'tour-jupiter',
    targetId: 'jupiter',
    title: 'Jupiter — King of the Planets',
    narration:
      "Jupiter is so massive it could swallow all other planets in the Solar System combined and still have room to spare — its diameter is 11 times that of Earth. " +
      "The Great Red Spot, a storm wider than Earth that has raged for at least 350 years, is just one of hundreds of turbulent atmospheric features swirling in banded jet streams. " +
      "Jupiter's powerful magnetic field and its four large Galilean moons — each a world unto itself — make it a solar system within a solar system.",
    dwellSeconds: 12,
  },
  {
    id: 'tour-europa',
    targetId: 'europa',
    title: 'Europa — Ocean Beneath the Ice',
    narration:
      "Europa is one of the most exciting destinations in the search for extraterrestrial life: beneath its cracked, icy shell lies a global saltwater ocean estimated to contain twice as much liquid water as all of Earth's oceans combined. " +
      "Tidal flexing caused by Jupiter's immense gravity keeps that ocean liquid and likely warm enough near the seafloor to support hydrothermal chemistry. " +
      "NASA's Europa Clipper, launched in 2024, is en route to conduct close flybys and assess whether this hidden sea could be habitable.",
    dwellSeconds: 11,
  },
  {
    id: 'tour-saturn',
    targetId: 'saturn',
    title: 'Saturn — Lord of the Rings',
    narration:
      "Saturn's magnificent ring system spans 282,000 kilometres but is remarkably thin — in places barely 10 metres deep — made of billions of ice and rock particles ranging from dust grains to boulders the size of houses. " +
      "Saturn is the least dense planet in the Solar System; it would float in water if you could find a bathtub large enough. " +
      "The Cassini spacecraft spent 13 years orbiting Saturn and revealed active geysers on the moon Enceladus, hinting at a subsurface ocean with conditions potentially suitable for life.",
    dwellSeconds: 13,
  },
  {
    id: 'tour-uranus',
    targetId: 'uranus',
    title: 'Uranus — The Tilted Ice Giant',
    narration:
      "Uranus is the oddity of the outer Solar System, rolling on its side with an axial tilt of 98 degrees — likely the result of a catastrophic collision with an Earth-sized body billions of years ago. " +
      "This extreme tilt means each pole experiences 42 years of continuous sunlight followed by 42 years of darkness. " +
      "Uranus is classed as an ice giant because its interior is dominated by a slushy mixture of water, methane, and ammonia ices rather than the metallic hydrogen found in Jupiter and Saturn.",
    dwellSeconds: 10,
  },
  {
    id: 'tour-neptune',
    targetId: 'neptune',
    title: 'Neptune — The Windy Blue World',
    narration:
      "Neptune is the most distant true planet in the Solar System, lying 4.5 billion kilometres from the Sun and receiving only 0.1 % of the sunlight that reaches Earth. " +
      "Yet it generates its own internal heat and hosts the fastest sustained winds in the Solar System, with gusts reaching 2,100 kilometres per hour in the Great Dark Spot observed by Voyager 2 in 1989. " +
      "Neptune's large moon Triton orbits backwards relative to the planet's rotation — almost certainly a captured Kuiper Belt object with geysers of nitrogen gas erupting from its frozen surface.",
    dwellSeconds: 11,
  },
  {
    id: 'tour-wonders',
    targetId: 'earth',
    title: "Earth's Wonders — A Human Legacy",
    narration:
      "We return to Earth to celebrate the ingenuity and ambition of human civilisation, visible in the New Seven Wonders of the World pinned across the globe below. " +
      "From the rose-red cliffs of Petra to the soaring dome of the Taj Mahal, each site represents a pinnacle of its era's engineering, faith, and artistry. " +
      "Zoom in on any marker to explore its story — and remember that every wonder was built by people who, like us, looked up at the same stars we have just visited.",
    dwellSeconds: 14,
  },
];
