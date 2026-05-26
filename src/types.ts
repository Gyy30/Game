export type TileType =
  | 'grass'
  | 'tall_grass'
  | 'water'
  | 'dirt'
  | 'tilled'
  | 'tilled_watered'
  | 'bridge'
  | 'pier'
  | 'path'
  | 'wall'
  | 'door'
  | 'flower_spawn'
  | 'obstacle_stone'
  | 'obstacle_wood';

export interface CropData {
  id: string;
  name: string;
  seedName: string;
  seedPrice: number;
  sellPrice: number;
  growthDays: number;
  color: string; // pixel color/style representing growth states
}

export const CROPS: Record<string, CropData> = {
  tomat: {
    id: 'tomat',
    name: 'Tomat',
    seedName: 'Benih Tomat',
    seedPrice: 20,
    sellPrice: 45,
    growthDays: 3,
    color: '#ef4444', // Red
  },
  wortel: {
    id: 'wortel',
    name: 'Wortel',
    seedName: 'Benih Wortel',
    seedPrice: 10,
    sellPrice: 25,
    growthDays: 2,
    color: '#f97316', // Orange
  },
  lobak: {
    id: 'lobak',
    name: 'Lobak',
    seedName: 'Benih Lobak',
    seedPrice: 8,
    sellPrice: 18,
    growthDays: 1,
    color: '#e2e8f0', // White/pinkish
  },
  labu: {
    id: 'labu',
    name: 'Labu',
    seedName: 'Benih Labu',
    seedPrice: 35,
    sellPrice: 85,
    growthDays: 4,
    color: '#fbbf24', // Amber
  },
};

export interface ActiveCrop {
  cropId: string;
  stage: number; // 0 = Seed, 1 = Sprout, 2 = Growing, 3 = Mature (ready to harvest)
  daysPlanted: number;
  watered: boolean;
}

export interface TileState {
  x: number;
  y: number;
  type: TileType;
  crop: ActiveCrop | null;
  decorType?: number; // visual variation
}

export type ToolType = 'hoe' | 'water_can' | 'fishing_rod' | 'scythe' | 'hand';

export interface InventoryItem {
  id: string;
  name: string;
  type: 'seed' | 'crop' | 'fish' | 'resource' | 'gift' | 'tool';
  count: number;
  description: string;
  value: number; // buy or sell value
}

export type NPCId = 'budi' | 'siti' | 'agus' | 'dewi';

export interface DialogState {
  speaker: string;
  text: string;
  options?: { text: string; nextDialogId?: string; action?: string }[];
}

export interface NPC {
  id: NPCId;
  name: string;
  role: string;
  avatarColor: string;
  spriteX: number; // pixel offset
  spriteY: number; // pixel offset
  personality: string;
  friendship: number; // 0 to 100 max, 20 points per heart (5 hearts)
  hasTalkedToday: boolean;
  hasGiftedToday: boolean;
  dialogueProgress: number;
  position: { x: number; y: number }; // default tile position
  favoriteItems: string[]; // item names they love
  hatedItems: string[]; // item names they hate
  greetDialogue: string[];
  friendDialogue: string[];
  giftAcceptDialogue: string;
  giftRejectDialogue: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  targetNPC: NPCId;
  requiredItem: string;
  requiredCount: number;
  rewardGold: number;
  completed: boolean;
  claimed: boolean;
}

export interface GameState {
  timeMinutes: number; // 6:00 to 22:00 (6:00 am to 10:00 pm)
  day: number;
  season: 'Musim Semi' | 'Musim Panas' | 'Musim Gugur';
  gold: number;
  playerName: string;
  playerPosition: { x: number; y: number };
  playerDirection: 'up' | 'down' | 'left' | 'right';
  inventory: InventoryItem[];
  selectedToolIdx: number;
  npcs: Record<NPCId, NPC>;
  tiles: TileState[][];
  activeQuest: Quest | null;
  completedQuestsCount: number;
}
