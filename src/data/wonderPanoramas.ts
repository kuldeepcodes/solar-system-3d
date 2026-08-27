export interface WonderPanorama {
  url: string;
  title: string;
  credit: string;
  width: number;
  height: number;
  bytes: number;
  /** Where the viewer is standing. */
  vantage: 'exterior' | 'interior' | 'approach' | 'aerial';
}

export const WONDER_PANORAMAS: Record<string, WonderPanorama[]> = {
  'great-wall': [
    {
      // Greg Zaal via Poly Haven — Mutianyu section of the Great Wall
      // Original: 8192×4096, CC0; thumbnail requested at 4096 px → served at 3840 px
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Mutianyu_%E2%80%93_Panorama_%28Greg_Zaal_via_Poly_Haven%29.jpg/3840px-Mutianyu_%E2%80%93_Panorama_%28Greg_Zaal_via_Poly_Haven%29.jpg',
      title: 'On top of the Great Wall at Mutianyu',
      credit: 'Greg Zaal (Poly Haven), CC0, via Wikimedia Commons',
      width: 3840,
      height: 1920,
      bytes: 2124036,
      vantage: 'exterior',
    },
  ],

  'petra': [
    {
      // Dosseman — aerial view of Al-Khazneh (Treasury) from Jabal al-Khubtha
      // Original: 7624×3998 (ratio 1.907); thumbnail at 3840 px wide
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Petra_Al_Khazneh_from_Jabal_al-Khubtha_2263_panorama.jpg/3840px-Petra_Al_Khazneh_from_Jabal_al-Khubtha_2263_panorama.jpg',
      title: 'Al-Khazneh (The Treasury) at Petra viewed from Jabal al-Khubtha',
      credit: 'Dosseman, CC BY-SA 4.0, via Wikimedia Commons',
      width: 3840,
      height: 2014,
      bytes: 2384317,
      vantage: 'aerial',
    },
  ],

  'christ-redeemer': [],

  'machu-picchu': [
    {
      // jaderbavaresco via Mapillary — inside the Machu Picchu archaeological site
      // Original: 4096×2048 (2:1); thumbnail at 3840 px wide
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Mapillary_%2838thnbClp0kOZUc5WNDfYK%29_%28jaderbavaresco%29_2023-12-29_09H44M00S603_%281027682721864884_via_GoPro_GoPro_Max%29.jpg/3840px-Mapillary_%2838thnbClp0kOZUc5WNDfYK%29_%28jaderbavaresco%29_2023-12-29_09H44M00S603_%281027682721864884_via_GoPro_GoPro_Max%29.jpg',
      title: 'Machu Picchu ruins — on-site 360° view',
      credit: 'jaderbavaresco via Mapillary, CC BY-SA 4.0, via Wikimedia Commons',
      width: 3840,
      height: 1920,
      bytes: 1070063,
      vantage: 'exterior',
    },
    {
      // jaderbavaresco via Mapillary — second vantage, December 2023
      // Original: 4096×2048 (2:1); thumbnail at 3840 px wide
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Mapillary_%2838thnbClp0kOZUc5WNDfYK%29_%28jaderbavaresco%29_2023-12-29_09H44M19S706_%28399392899248357_via_GoPro_GoPro_Max%29.jpg/3840px-Mapillary_%2838thnbClp0kOZUc5WNDfYK%29_%28jaderbavaresco%29_2023-12-29_09H44M19S706_%28399392899248357_via_GoPro_GoPro_Max%29.jpg',
      title: 'Machu Picchu ruins — second 360° vantage',
      credit: 'jaderbavaresco via Mapillary, CC BY-SA 4.0, via Wikimedia Commons',
      width: 3840,
      height: 1920,
      bytes: 1180617,
      vantage: 'approach',
    },
  ],

  'chichen-itza': [],

  'colosseum': [
    {
      // Greg Zaal and Rico Cilliers via Poly Haven — standing in the Colosseum arena
      // Original: 8192×4096 (2:1 equirectangular), CC0; thumbnail at 3840 px wide
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Colosseum_%E2%80%93_Panorama_%28Greg_Zaal_and_Rico_Cilliers_via_Poly_Haven%29.jpg/3840px-Colosseum_%E2%80%93_Panorama_%28Greg_Zaal_and_Rico_Cilliers_via_Poly_Haven%29.jpg',
      title: 'Inside the Colosseum arena, looking out at the stands',
      credit: 'Greg Zaal and Rico Cilliers (Poly Haven), CC0, via Wikimedia Commons',
      width: 3840,
      height: 1920,
      bytes: 1912714,
      vantage: 'interior',
    },
  ],

  'taj-mahal': [
    {
      // Arul Prakasam T — 360° view of the Taj Mahal complex
      // Original: 2048×1024 (2:1 equirectangular), CC BY-SA 4.0; served at original size
      url: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Taj_Mahal_360%C2%B0_View.jpg',
      title: 'Taj Mahal complex — 360° view from the grounds',
      credit: 'Arul Prakasam T, CC BY-SA 4.0, via Wikimedia Commons',
      width: 2048,
      height: 1024,
      bytes: 744309,
      vantage: 'exterior',
    },
  ],

  'great-pyramid': [
    {
      // Daniel Mayer (mav) — stitched panorama of the Giza plateau with the Great Pyramid
      // Original: 2474×1275 (ratio 1.941), CC BY-SA 4.0; served at original size
      url: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Giza_Plateau_-_Great_Pyramid_stitch1.jpg',
      title: 'Giza Plateau panorama with the Great Pyramid of Khufu',
      credit: 'Daniel Mayer (mav), CC BY-SA 4.0, via Wikimedia Commons',
      width: 2474,
      height: 1275,
      bytes: 676641,
      vantage: 'exterior',
    },
    {
      // Schoschi — panoramic view across the eastern mastaba field at Giza
      // Original: 4873×2349 (ratio 2.074), CC BY 4.0; thumbnail at 3840 px wide
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Eastern_mastaba_field_at_Giza%2C_4th_dynasty_%2839%2B40%29.jpg/3840px-Eastern_mastaba_field_at_Giza%2C_4th_dynasty_%2839%2B40%29.jpg',
      title: 'Eastern mastaba field at Giza, 4th dynasty',
      credit: 'Schoschi, CC BY 4.0, via Wikimedia Commons',
      width: 3840,
      height: 1851,
      bytes: 2173541,
      vantage: 'exterior',
    },
  ],
};

export function panoramasFor(siteId: string): WonderPanorama[] {
  return WONDER_PANORAMAS[siteId] ?? [];
}

export function hasPanorama(siteId: string): boolean {
  return (WONDER_PANORAMAS[siteId]?.length ?? 0) > 0;
}

export function panoramaBytes(siteId: string): number {
  return (WONDER_PANORAMAS[siteId] ?? []).reduce((sum, p) => sum + p.bytes, 0);
}
