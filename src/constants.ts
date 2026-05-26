import { NPC, Quest, TileState, TileType } from './types';

export const CARD_BG = 'bg-[#fcf8f2] border-2 border-[#8b5a2b] shadow-[4px_4px_0px_0px_#4a2f13]';
export const TEXT_COZY = 'text-[#4a2f13]';

export const INITIAL_NPCS: Record<string, NPC> = {
  budi: {
    id: 'budi',
    name: 'Pak Budi',
    role: 'Petani Senior',
    avatarColor: '#10b981', // Emerald green
    spriteX: 0,
    spriteY: 0,
    personality: 'Bijaksana dan tenang, menyukai hasil tanam organik khususnya Wortel asli.',
    friendship: 10,
    hasTalkedToday: false,
    hasGiftedToday: false,
    dialogueProgress: 0,
    position: { x: 12, y: 3 },
    favoriteItems: ['Wortel', 'Labu'],
    hatedItems: ['Sampah Danau'],
    greetDialogue: [
      'Halo anak muda. Selamat datang di Lembah Hijau. Sudahkah kamu cangkul tanah hari ini?',
      'Ingat, tanaman butuh air setiap hari agar tumbuh subur saat tengah malam tiba.',
      'Jika kamu butuh benih baru, tanyakan pada Siti di toko kota sebelah timur.',
    ],
    friendDialogue: [
      'Kamu bekerja keras seperti aku waktu muda dulu. Ini membuatku sangat bangga.',
      'Wortel adalah rahasia mataku tetap tajam di usia tua ini!',
      'Tanah lembah ini adalah tanah terbaik. Rawatlah dengan cinta, nak.',
    ],
    giftAcceptDialogue: 'Wah, luar biasa! Ini barang favoritku. Terima kasih banyak atas perhatianmu, anak muda!',
    giftRejectDialogue: 'Aduh... apa ini? Aku tidak suka barang kotor seperti ini. Tolong bawa pergi.',
  },
  siti: {
    id: 'siti',
    name: 'Siti',
    role: 'Penjual Toko Benih',
    avatarColor: '#ec4899', // Pink
    spriteX: 0,
    spriteY: 0,
    personality: 'Gembira, ramah, dan selalu bersemangat membantu pendatang baru.',
    friendship: 15,
    hasTalkedToday: false,
    hasGiftedToday: false,
    dialogueProgress: 0,
    position: { x: 18, y: 4 },
    favoriteItems: ['Labu', 'Bunga Liar', 'Tomat'],
    hatedItems: ['Ikan Mas', 'Sampah Danau'],
    greetDialogue: [
      'Selamat pagi! Butuh benih wortel atau tomat? Toko benihku selalu sedia!',
      'Senyummu mencerahkan hari di Lembah Hijau ini. Jaga kesehatan ya!',
      'Gunakan modal awalmu dengan bijak ya, beli benih yang cepat tumbuh jika buru-gold!',
    ],
    friendDialogue: [
      'Aku senang sekali kamu sering berkunjung ke toko benih ku. Sungguh menyenangkan!',
      'Tahukah kamu? Mimpi terbesarku adalah melihat seluruh lembah dipenuhi tanaman labu raksasa saat musim gugur!',
      'Bunga liar di savana sangat indah, mereka tumbuh liar setiap hari baru.',
    ],
    giftAcceptDialogue: 'Aaaah ini sangat manis! Terima kasih sekali! Ini benar-benar membuat hariku menjadi sangat spesial.',
    giftRejectDialogue: 'Ugh... ini agak bau dan kotor. Aku tidak begitu menyukainya, tapi terima kasih atas usahamu.',
  },
  agus: {
    id: 'agus',
    name: 'Kak Agus',
    role: 'Nelayan Handal',
    avatarColor: '#3b82f6', // Ocean Blue
    spriteX: 0,
    spriteY: 0,
    personality: 'Santai, puitis, dan menghabiskan waktunya menatap keindahan danau.',
    friendship: 10,
    hasTalkedToday: false,
    hasGiftedToday: false,
    dialogueProgress: 0,
    position: { x: 15, y: 13 },
    favoriteItems: ['Ikan Mas', 'Lele', 'Sidat'],
    hatedItems: ['Lobak', 'Wortel'],
    greetDialogue: [
      'Ssst... jangan berisik, airnya sangat tenang hari ini. Ikan-ikan sedang mendekat.',
      'Memancing itu butuh kesabaran. Rasakan getaran jorannya sebelum menarik tali!',
      'Danau di selatan menyimpan banyak misteri. Ada rumor tentang Ikan Purba legendaris yang hidup di dasar terdalam.',
    ],
    friendDialogue: [
      'Oh, kamu lagi. Mau duduk santai di dermaga bersamaku mendengarkan deburan air raksasa?',
      'Ikan Mas adalah simbol keberuntungan bagi kami para pelaut dan nelayan sungai.',
      'Air tidak pernah salah memandu jalannya kehidupan dasar bumi.',
    ],
    giftAcceptDialogue: 'Matursuwun! Ini ikan yang indah sekali. Sisiknya sangat mengkilap. Aku suka!',
    giftRejectDialogue: 'Sayuran? Kurasa perutku hanya toleran pada protein laut segar atau air murni.',
  },
  dewi: {
    id: 'dewi',
    name: 'Dewi',
    role: 'Peneliti & Pelukis',
    avatarColor: '#a855f7', // Purple
    spriteX: 0,
    spriteY: 0,
    personality: 'Pendiam, menyukai buku, lukisan bunga, dan suka mengandalkan imajinasi.',
    friendship: 12,
    hasTalkedToday: false,
    hasGiftedToday: false,
    dialogueProgress: 0,
    position: { x: 6, y: 12 },
    favoriteItems: ['Bunga Liar', 'Bluberi', 'Tomat'],
    hatedItems: ['Lele', 'Sampah Danau'],
    greetDialogue: [
      'Maaf, aku sedang mencatat jenis-jenis rasi spora di sekitar padang rumput ini.',
      'Sinar matahari hari ini sangat bagus untuk melukis tebing tepi danau.',
      'Apakah kamu pernah melihat warna ungu alami yang diekstrak langsung dari kelopak bunga liar?',
    ],
    friendDialogue: [
      'Mungkin kamu bisa menemaniku mencari spesimen bunga liar langka lain kali?',
      'Buku-buku adalah jendela dunia yang tak terbatas, namun berkebun adalah bentuk nyata dari kehidupan seni.',
      'Terima kasih telah menghargai duniaku yang sunyi ini.',
    ],
    giftAcceptDialogue: 'Luar biasa... Warna dan aromanya sangat menenangkan pikiranku. Terima kasih banyak, teman.',
    giftRejectDialogue: 'Aku rasa benda ini tidak cocok untuk koleksi penelitian ataupun bahan seni pelapis ku.',
  },
};

export const FISH_TYPES = [
  { name: 'Lele', rarity: 'Biasa', price: 20, difficulty: 1.2, color: '#334155' },
  { name: 'Ikan Mas', rarity: 'Biasa', price: 25, difficulty: 1.4, color: '#f97316' },
  { name: 'Gurame', rarity: 'Unik', price: 45, difficulty: 1.8, color: '#d97706' },
  { name: 'Sidat', rarity: 'Langka', price: 80, difficulty: 2.3, color: '#1e293b' },
  { name: 'Ikan Purba', rarity: 'Legendaris', price: 250, difficulty: 3.5, color: '#4c1d95' },
  { name: 'Sampah Danau', rarity: 'Sampah', price: 2, difficulty: 0.5, color: '#78716c' },
];

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'quest_1',
    title: 'Salam Perkenalan',
    description: 'Bicaralah dengan semua penduduk kota (Pak Budi, Siti, Kak Agus, dan Dewi) untuk menyapa mereka hari ini.',
    targetNPC: 'siti', // placeholder, custom validation via talks count
    requiredItem: 'Sapaan',
    requiredCount: 4,
    rewardGold: 100,
    completed: false,
    claimed: false,
  },
  {
    id: 'quest_2',
    title: 'Wortel Spesial Pak Budi',
    description: 'Panen dan bawa 3 buah Wortel segar untuk diawetkan di dapur Pak Budi.',
    targetNPC: 'budi',
    requiredItem: 'Wortel',
    requiredCount: 3,
    rewardGold: 150,
    completed: false,
    claimed: false,
  },
  {
    id: 'quest_3',
    title: 'Ikan Mas Keberuntungan',
    description: 'Pancing seekor Ikan Mas dari danau selatan untuk hiasan hoki Kak Agus.',
    targetNPC: 'agus',
    requiredItem: 'Ikan Mas',
    requiredCount: 1,
    rewardGold: 120,
    completed: false,
    claimed: false,
  },
  {
    id: 'quest_4',
    title: 'Kado Bunga untuk Dewi',
    description: 'Carilah 2 buah Bunga Liar yang tumbuh segar di tanah lapang dan hadiahkan ke Dewi.',
    targetNPC: 'dewi',
    requiredItem: 'Bunga Liar',
    requiredCount: 2,
    rewardGold: 80,
    completed: false,
    claimed: false,
  },
];

// Map size configs
export const MAP_COLS = 20;
export const MAP_ROWS = 15;
export const TILE_SIZE = 40; // in pixels. 20 * 40 = 800 width, 15 * 40 = 600 height.

export function generateInitialMap(): TileState[][] {
  const tiles: TileState[][] = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    const row: TileState[] = [];
    for (let c = 0; c < MAP_COLS; c++) {
      let t: TileType = 'grass';
      let decorType = Math.floor(Math.random() * 4);

      // Define zones:
      // Grass edges boundary
      if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) {
        // Wooden fences or walls or deep structures
        t = 'wall';
      }
      // Top row town houses boundary
      else if (r === 2 && c >= 10 && c <= 13) {
        t = 'wall'; // Budi's house base
      } else if (r === 2 && c >= 16 && c <= 19) {
        t = 'wall'; // Siti's shop base
      }
      // House doors
      else if (r === 3 && c === 11) {
        t = 'door'; // Budi's door
      } else if (r === 3 && c === 18) {
        t = 'door'; // Siti's door
      }
      // Southern Lake region (r >= 10) on the right side
      else if (r >= 10 && c >= 11) {
        t = 'water';
        // Give some pier tiles extending into the water
        if (r === 11 && c >= 13 && c <= 17) {
          t = 'pier';
        } else if (r >= 11 && r <= 13 && c === 15) {
          t = 'pier';
        }
      }
      // Bridges spanning water if any
      else if (r === 10 && c === 15) {
        t = 'bridge';
      }
      // Stone Pathways linking structures
      else if (
        (r === 4 && c >= 8 && c <= 18) || // main horizontal path
        (c === 9 && r >= 3 && r <= 12) || // vertical path crossing
        (r === 10 && c >= 8 && c <= 12) // pathway to lake jetty
      ) {
        t = 'path';
      }
      // Spawn some weeds, logs, stones, wildflowers, and tall grass around
      else if (Math.random() < 0.14) {
        const rand = Math.random();
        if (rand < 0.18) {
          t = 'obstacle_stone';
        } else if (rand < 0.35) {
          t = 'obstacle_wood';
        } else if (rand < 0.50) {
          t = 'flower_spawn'; // wild flower can be picked!
        } else {
          t = 'tall_grass'; // deep tall grass shrub!
        }
      } else if (Math.random() < 0.12) {
        // individual patch of soft tall grass
        t = 'tall_grass';
      }

      row.push({
        x: c,
        y: r,
        type: t,
        crop: null,
        decorType,
      });
    }
    tiles.push(row);
  }
  return tiles;
}
