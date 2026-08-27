/**
 * Links to third-party virtual tours.
 *
 * These are deliberately *links*, not embedded media. Sites such as
 * Destination360 and AirPano shoot their own panoramas and retain copyright,
 * so reproducing their imagery here would be infringement. Sending visitors to
 * the original source is both lawful and fairer to the photographers.
 *
 * Everything rendered inside this app comes from freely licensed
 * (public domain / CC) sources instead - see `wonderPanoramas.ts` and
 * `wonderPhotos.ts`.
 */
export interface VirtualTour {
  label: string;
  provider: string;
  url: string;
  /** What the visitor gets, so the choice is meaningful. */
  description: string;
}

export const VIRTUAL_TOURS: Record<string, VirtualTour[]> = {
  'great-wall': [
    {
      label: 'The Great Wall in 360°',
      provider: 'Destination360',
      url: 'https://www.destination360.com/asia/china/great-wall-of-china',
      description: 'Browser-based panorama captured on the wall itself.',
    },
    {
      label: 'Great Wall collection',
      provider: 'Google Arts & Culture',
      url: 'https://artsandculture.google.com/search?q=great%20wall%20of%20china',
      description: 'Street View walks, archival photography and essays.',
    },
  ],
  petra: [
    {
      label: 'Petra in 360°',
      provider: 'Destination360',
      url: 'https://www.destination360.com/middle-east/jordan/petra',
      description: 'Panoramas of the Siq and the Treasury facade.',
    },
    {
      label: 'Petra: Wonder of the Desert',
      provider: 'Google Arts & Culture',
      url: 'https://artsandculture.google.com/search?q=petra%20jordan',
      description: 'Street View through the Siq plus curated exhibitions.',
    },
  ],
  'christ-redeemer': [
    {
      label: 'Christ the Redeemer in 360°',
      provider: 'AirPano',
      url: 'https://www.airpano.com/360photo/Rio-de-Janeiro-Brazil/',
      description: 'Aerial panoramas over Corcovado and Guanabara Bay.',
    },
    {
      label: 'Rio de Janeiro collection',
      provider: 'Google Arts & Culture',
      url: 'https://artsandculture.google.com/search?q=christ%20the%20redeemer',
      description: 'Street View from the statue platform.',
    },
  ],
  'machu-picchu': [
    {
      label: 'Machu Picchu in 360°',
      provider: 'AirPano',
      url: 'https://www.airpano.com/360photo/Machu-Picchu-Peru/',
      description: 'Aerial and ground panoramas across the citadel.',
    },
    {
      label: 'Machu Picchu Street View',
      provider: 'Google Arts & Culture',
      url: 'https://artsandculture.google.com/search?q=machu%20picchu',
      description: 'Walk the terraces and plazas in Street View.',
    },
  ],
  'chichen-itza': [
    {
      label: 'Chichén Itzá in 360°',
      provider: 'Destination360',
      url: 'https://www.destination360.com/mexico/yucatan/chichen-itza',
      description: 'Panoramas of El Castillo and the ball court.',
    },
    {
      label: 'Maya heritage collection',
      provider: 'Google Arts & Culture',
      url: 'https://artsandculture.google.com/search?q=chichen%20itza',
      description: 'Street View of the plaza and archaeological essays.',
    },
  ],
  colosseum: [
    {
      label: 'Colosseum in 360°',
      provider: 'Destination360',
      url: 'https://www.destination360.com/europe/italy/rome/colosseum',
      description: 'Panoramas from the arena floor and upper tiers.',
    },
    {
      label: 'Official Colosseum site',
      provider: 'Parco archeologico del Colosseo',
      url: 'https://parcocolosseo.it/en/',
      description: 'Virtual tours and current excavation news.',
    },
  ],
  'taj-mahal': [
    {
      label: 'Taj Mahal in 360°',
      provider: 'AirPano',
      url: 'https://www.airpano.com/360photo/Taj-Mahal-India/',
      description: 'Aerial panoramas over the mausoleum and gardens.',
    },
    {
      label: 'Taj Mahal collection',
      provider: 'Google Arts & Culture',
      url: 'https://artsandculture.google.com/search?q=taj%20mahal',
      description: 'Street View of the grounds and interior detail.',
    },
  ],
  'great-pyramid': [
    {
      label: 'Giza in 360°',
      provider: 'AirPano',
      url: 'https://www.airpano.com/360photo/Egypt-Pyramids-of-Giza/',
      description: 'Aerial panoramas of all three pyramids and the Sphinx.',
    },
    {
      label: 'Giza Project',
      provider: 'Harvard University',
      url: 'https://giza.fas.harvard.edu/',
      description: 'Scholarly 3D reconstructions of the whole plateau.',
    },
  ],
};

export function toursFor(siteId: string): VirtualTour[] {
  return VIRTUAL_TOURS[siteId] ?? [];
}
