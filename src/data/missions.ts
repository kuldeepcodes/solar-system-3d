import type { MissionRoute } from '../types';

export const MISSION_ROUTES: MissionRoute[] = [
  {
    id: 'apollo-11-moon',
    name: 'Apollo 11 — Earth to Moon',
    fromId: 'earth',
    toId: 'moon',
    realCruiseDays: 3,
    spacecraft: 'Apollo 11 CSM Columbia',
    description:
      'Launched on 16 July 1969, Apollo 11 reached lunar orbit after approximately 76 hours of trans-lunar coast, delivering Neil Armstrong and Buzz Aldrin to the first crewed Moon landing on 20 July 1969.',
  },
  {
    id: 'perseverance-mars',
    name: 'Perseverance — Earth to Mars',
    fromId: 'earth',
    toId: 'mars',
    realCruiseDays: 203,
    spacecraft: 'Mars 2020 Perseverance Rover',
    description:
      'Perseverance launched on 30 July 2020 and arrived at Jezero Crater on 18 February 2021 after a 203-day Hohmann-like transfer, deploying the Ingenuity helicopter which completed over 70 flights on Mars.',
  },
  {
    id: 'magellan-venus',
    name: 'Magellan — Earth to Venus',
    fromId: 'earth',
    toId: 'venus',
    realCruiseDays: 291,
    spacecraft: 'Magellan',
    description:
      'NASA\'s Magellan probe launched on 4 May 1989 and reached Venus on 10 August 1990 after 291 days, then spent four years radar-mapping 98 % of the Venusian surface at resolutions down to 120 metres.',
  },
  {
    id: 'messenger-mercury',
    name: 'MESSENGER — Earth to Mercury',
    fromId: 'earth',
    toId: 'mercury',
    realCruiseDays: 2397,
    spacecraft: 'MESSENGER',
    description:
      'MESSENGER launched on 3 August 2004 and entered Mercury orbit on 18 March 2011 — a 6.6-year journey requiring one flyby of Earth, two of Venus, and three of Mercury to shed enough velocity to be captured by the innermost planet.',
  },
  {
    id: 'juno-jupiter',
    name: 'Juno — Earth to Jupiter',
    fromId: 'earth',
    toId: 'jupiter',
    realCruiseDays: 1795,
    spacecraft: 'Juno',
    description:
      "Juno launched on 5 August 2011 and arrived at Jupiter on 4 July 2016 after 1,795 days and a deep-space Earth gravity assist in October 2013, entering a polar orbit that revealed Jupiter's complex internal structure and dynamic auroras.",
  },
  {
    id: 'cassini-saturn',
    name: 'Cassini-Huygens — Earth to Saturn',
    fromId: 'earth',
    toId: 'saturn',
    realCruiseDays: 2454,
    spacecraft: 'Cassini-Huygens',
    description:
      'Cassini-Huygens launched on 15 October 1997 and arrived at Saturn on 1 July 2004 after nearly 6.7 years and four gravity assists (Venus twice, Earth, Jupiter), then explored the Saturn system for 13 years before a controlled dive into the atmosphere on 15 September 2017.',
  },
  {
    id: 'new-horizons-pluto',
    name: 'New Horizons — Earth to Pluto',
    fromId: 'earth',
    toId: 'pluto',
    realCruiseDays: 3463,
    spacecraft: 'New Horizons',
    description:
      'New Horizons launched on 19 January 2006 — the fastest spacecraft ever at launch, at 58,536 km/h — and flew past Pluto on 14 July 2015 after 3,463 days, revealing a heart-shaped nitrogen-ice plain and mountains of water ice rising 3,500 metres.',
  },
  {
    id: 'voyager-2-neptune',
    name: 'Voyager 2 — Earth to Neptune',
    fromId: 'earth',
    toId: 'neptune',
    realCruiseDays: 4383,
    spacecraft: 'Voyager 2',
    description:
      'Voyager 2 launched on 20 August 1977 and reached Neptune on 25 August 1989 after 12 years — the only spacecraft to visit Neptune — exploiting a rare planetary alignment for a grand tour gravity-assist trajectory past Jupiter, Saturn, and Uranus.',
  },
  {
    id: 'dawn-ceres',
    name: 'Dawn — Earth to Ceres',
    fromId: 'earth',
    toId: 'ceres',
    realCruiseDays: 2629,
    spacecraft: 'Dawn',
    description:
      'Dawn launched on 27 September 2007 and arrived at Ceres on 6 March 2015 after 2,629 days, having first orbited the asteroid Vesta for 14 months; it was the first spacecraft to orbit two extraterrestrial bodies and discovered bright salt deposits in Occator Crater.',
  },
  {
    id: 'europa-clipper',
    name: 'Europa Clipper — Earth to Europa',
    fromId: 'earth',
    toId: 'europa',
    realCruiseDays: 2036,
    spacecraft: 'Europa Clipper',
    description:
      "Europa Clipper launched on 14 October 2024 and is expected to arrive at Jupiter's moon Europa in April 2030 after about 2,036 days, using gravity assists at Mars and Earth; it will conduct 49 close flybys to investigate the moon's subsurface ocean for habitability.",
  },
];

export const MISSIONS_BY_ID: Record<string, MissionRoute> = Object.fromEntries(
  MISSION_ROUTES.map((m) => [m.id, m]),
);
