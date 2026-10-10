import { WaypostNote } from '../types';
import { imageStorage } from './imageStorage';

/**
 * Curated initial demo notes around Malappuram & Kozhikode, Kerala.
 * Provides both unlocked notes (<150m) and locked notes (>150m) around Malappuram.
 */
export async function createDemoNotesWithImages(): Promise<WaypostNote[]> {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Generate illustrative Kerala photo blobs in IndexedDB
  const img1 = await imageStorage.saveImage(
    await imageStorage.createSamplePhotoBlob('Kottakunnu Sunset Walk', '#1B4931', '🌄'),
    'kottakunnu-sunset.svg'
  );

  const img2 = await imageStorage.saveImage(
    await imageStorage.createSamplePhotoBlob('Piping Hot Sulaimani', '#B85B14', '☕'),
    'sulaimani-tea.svg'
  );

  const img3 = await imageStorage.saveImage(
    await imageStorage.createSamplePhotoBlob('Old Calicut Sea Pier', '#1A446C', '🌊'),
    'calicut-pier.svg'
  );

  const img4 = await imageStorage.saveImage(
    await imageStorage.createSamplePhotoBlob('Ancient Banyan Roots', '#4A5B23', '🌳'),
    'mananchira-banyan.svg'
  );

  const demoNotes: WaypostNote[] = [
    {
      id: 'demo_kottakunnu_gazebo',
      title: 'Breeze at Kottakunnu Garden',
      text: 'If you sit on the stone bench overlooking the valley at 6pm, the hill breeze carries the distant dusk bells and calls. Someone etched "Slow down, traveler" into the rock.',
      category: 'Stories',
      latitude: 11.0725, // ~45m from default (11.0722, 76.0740) -> Unlocked!
      longitude: 76.0743,
      locationName: 'Kottakunnu Valley Outlook, Malappuram',
      createdAt: new Date(now - 3 * 3600 * 1000).toISOString(),
      expiresAt: new Date(now + 2 * dayMs).toISOString(),
      expiryDuration: '3d',
      imageIds: [img1],
      authorId: 'usr_fathima_m',
      authorName: 'Fathima Noor',
      authorAvatar: '🌿',
      isDemo: true,
      likeCount: 24,
    },
    {
      id: 'demo_downhill_sulaimani',
      title: 'Fresh cardamom Sulaimani',
      text: 'The small tea stall by the downhill bend serves fresh mint-cardamom Sulaimani in glass tumblers. If the monsoon rain catches you, take shelter under their blue tarp.',
      category: 'Kindness',
      latitude: 11.0718, // ~70m from default -> Unlocked!
      longitude: 76.0745,
      locationName: 'Downhill Tea Corner, Malappuram',
      createdAt: new Date(now - 1 * 3600 * 1000).toISOString(),
      expiresAt: new Date(now + 22 * 3600 * 1000).toISOString(),
      expiryDuration: '24h',
      imageIds: [img2],
      authorId: 'usr_arjun_k',
      authorName: 'Arjun Das',
      authorAvatar: '☕',
      isDemo: true,
      likeCount: 41,
    },
    {
      id: 'demo_sm_street_halwa',
      title: 'Warm black halwa aroma',
      text: 'Walk behind the spice cart near the cross-junction. Look for the copper cauldron stirring fresh black halwa with crushed cashews and cardamom pods.',
      category: 'Food',
      latitude: 11.0715, // ~110m from default -> Unlocked!
      longitude: 76.0733,
      locationName: 'Malappuram Bazaar Approach',
      createdAt: new Date(now - 6 * 3600 * 1000).toISOString(),
      expiresAt: new Date(now + 6 * dayMs).toISOString(),
      expiryDuration: '7d',
      imageIds: [],
      authorId: 'usr_suhail_v',
      authorName: 'Suhail V.',
      authorAvatar: '🍯',
      isDemo: true,
      likeCount: 17,
    },
    {
      id: 'demo_mananchira_banyan',
      title: 'Roots of the sacred banyan',
      text: 'You don\'t have to map out the entire road ahead before taking the next step. Rest beneath the canopy; the monsoon always passes in time.',
      category: 'Advice',
      latitude: 11.0754, // ~380m from default -> Locked!
      longitude: 76.0768,
      locationName: 'Heritage Banyan Tree',
      createdAt: new Date(now - 1 * dayMs).toISOString(),
      expiresAt: new Date(now + 4 * dayMs).toISOString(),
      expiryDuration: '7d',
      imageIds: [img4],
      authorId: 'usr_ananya_menon',
      authorName: 'Ananya Menon',
      authorAvatar: '🍃',
      isDemo: true,
      likeCount: 68,
    },
    {
      id: 'demo_calicut_sea_pier',
      title: 'Rusting pillars of the old pier',
      text: 'The iconic century-old iron pillars stand resolute against Arabian sea waves. Watch the fishing boats return with the evening tide.',
      category: 'Travel',
      latitude: 11.0772, // ~580m from default -> Locked!
      longitude: 76.0708,
      locationName: 'Old Watchtower Lookout',
      createdAt: new Date(now - 14 * 3600 * 1000).toISOString(),
      expiresAt: new Date(now + 2 * dayMs).toISOString(),
      expiryDuration: '3d',
      imageIds: [img3],
      authorId: 'usr_nihal_explorer',
      authorName: 'Nihal K.',
      authorAvatar: '🧭',
      isDemo: true,
      likeCount: 35,
    },
    {
      id: 'demo_nilambur_brass_compass',
      title: 'A brass marker hidden in the roots',
      text: 'Between the two giant teak trunks by the stream bank, an antique surveyor\'s brass compass rose is anchored into the granite bedrock.',
      category: 'Odd Little Things',
      latitude: 11.0805, // ~950m from default -> Locked!
      longitude: 76.0782,
      locationName: 'North Stream Crossing',
      createdAt: new Date(now - 18 * 3600 * 1000).toISOString(),
      expiresAt: new Date(now + 18 * 3600 * 1000).toISOString(),
      expiryDuration: '24h',
      imageIds: [],
      authorId: 'usr_rahul_teak',
      authorName: 'Rahul P.',
      authorAvatar: '✨',
      isDemo: true,
      likeCount: 53,
    },
  ];

  return demoNotes;
}
