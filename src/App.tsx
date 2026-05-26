import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Coins,
  Compass,
  Calendar,
  Layers,
  Sparkles,
  ShoppingBag,
  Users,
  Volume2,
  VolumeX,
  RefreshCw,
  HelpCircle,
  HelpCircle as QuestionIcon,
  Award,
  BookOpen,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Hand,
  CheckCircle,
  ChevronRight,
  Trash2,
  GitCommit,
  Clock
} from 'lucide-react';
import {
  ActiveCrop,
  CROPS,
  CropData,
  DialogState,
  GameState,
  InventoryItem,
  NPC,
  NPCId,
  Quest,
  TileState,
  TileType,
  ToolType
} from './types';
import {
  INITIAL_NPCS,
  FISH_TYPES,
  INITIAL_QUESTS,
  generateInitialMap,
  MAP_COLS,
  MAP_ROWS,
  TILE_SIZE,
  CARD_BG,
  TEXT_COZY
} from './constants';

// Sound effect generator using Web Audio API
class RetroSoundEffects {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playTone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal: number = 0.1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gainNode.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  playAction(action: 'hoe' | 'water' | 'refill' | 'plant' | 'harvest' | 'bite' | 'reel' | 'success' | 'talk' | 'click' | 'morning' | 'clear') {
    switch (action) {
      case 'click':
        this.playTone(600, 0.05, 'sine', 0.05);
        break;
      case 'hoe':
        // Low brown thud
        this.playTone(180, 0.15, 'triangle', 0.2);
        setTimeout(() => this.playTone(100, 0.1, 'sine', 0.15), 50);
        break;
      case 'water':
        // Shhh white-noise-like sound
        this.playTone(800, 0.15, 'sine', 0.08);
        this.playTone(1200, 0.1, 'sine', 0.04);
        break;
      case 'refill':
        // Bubble splash sound
        this.playTone(400, 0.1, 'sine', 0.1);
        setTimeout(() => this.playTone(550, 0.1, 'sine', 0.12), 60);
        setTimeout(() => this.playTone(700, 0.12, 'sine', 0.15), 120);
        break;
      case 'plant':
        // Rustle plant tone
        this.playTone(320, 0.1, 'triangle', 0.1);
        setTimeout(() => this.playTone(480, 0.08, 'sine', 0.08), 50);
        break;
      case 'harvest':
        // Happy pop
        this.playTone(440, 0.08, 'sine', 0.15);
        setTimeout(() => this.playTone(660, 0.12, 'sine', 0.2), 60);
        break;
      case 'clear':
        // Snap/cut sound
        this.playTone(300, 0.05, 'sawtooth', 0.05);
        setTimeout(() => this.playTone(150, 0.08, 'triangle', 0.1), 30);
        break;
      case 'bite':
        // Piercing warning ping!
        this.playTone(880, 0.15, 'sawtooth', 0.15);
        setTimeout(() => this.playTone(1020, 0.15, 'sawtooth', 0.15), 100);
        break;
      case 'reel':
        // Whir sound
        this.playTone(450, 0.08, 'sine', 0.05);
        break;
      case 'success':
        // Beautiful retro victory arpeggio!
        this.playTone(523.25, 0.1, 'sine', 0.15); // C5
        setTimeout(() => this.playTone(659.25, 0.1, 'sine', 0.15), 80); // E5
        setTimeout(() => this.playTone(783.99, 0.1, 'sine', 0.15), 160); // G5
        setTimeout(() => this.playTone(1046.5, 0.25, 'sine', 0.2), 240); // C6
        break;
      case 'talk':
        // cute dialogue blip
        this.playTone(400 + Math.random() * 100, 0.06, 'triangle', 0.08);
        break;
      case 'morning':
        // Gentle bell arpeggio
        this.playTone(554.37, 0.2, 'sine', 0.12);
        setTimeout(() => this.playTone(659.25, 0.2, 'sine', 0.12), 200);
        setTimeout(() => this.playTone(880.00, 0.35, 'sine', 0.15), 400);
        break;
    }
  }
}

const sounds = new RetroSoundEffects();

export default function App() {
  // Load initial states or restore from LocalStorage
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('lembah_hijau_rpg_state_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure map is restored properly
        if (parsed.tiles && parsed.npcs) {
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse saved state, bootstrapping new game', e);
      }
    }

    // Default Bootstrap Inventory
    const defaultInventory: InventoryItem[] = [
      { id: 'hoe', name: 'Cangkul', type: 'tool', count: 1, description: 'Alat wajib untuk mencangkul rumput hijau menjadi tanah gembur siap tanam.', value: 0 },
      { id: 'water_can', name: 'Alat Penyiram', type: 'tool', count: 5, description: 'Menampung air tanah segar. Mandiri siram benih pagi/sore.', value: 0 },
      { id: 'fishing_rod', name: 'Alat Pancing', type: 'tool', count: 1, description: 'Alat pancing klasik. Berdirilah ditepi danau selatan untuk memancing.', value: 0 },
      { id: 'scythe', name: 'Sabit Sabit', type: 'tool', count: 1, description: 'Praktis menebaskan semak, dahan kayu liar, dan batu lapuk.', value: 0 },
      { id: 'seed_tomat', name: 'Benih Tomat', type: 'seed', count: 5, description: 'Butuh 3 hari tumbuh. Panen buah tomat ranum merah.', value: 10 },
      { id: 'seed_wortel', name: 'Benih Wortel', type: 'seed', count: 5, description: 'Butuh 2 hari tumbuh. Wortel renyah kegemaran Pak Budi.', value: 5 },
    ];

    return {
      timeMinutes: 360, // 6:00 am
      day: 1,
      season: 'Musim Semi',
      gold: 400,
      playerName: 'Saka',
      playerPosition: { x: 4, y: 7 }, // spawn in farm
      playerDirection: 'down',
      inventory: defaultInventory,
      selectedToolIdx: 0,
      npcs: INITIAL_NPCS,
      tiles: generateInitialMap(),
      activeQuest: INITIAL_QUESTS[0], // first quest
      completedQuestsCount: 0,
    };
  });

  // UI state overlays
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab ] = useState<'inventory' | 'shop' | 'social' | 'quests'>('inventory');
  const [shopNPC, setShopNPC] = useState<NPC | null>(null);
  const [activeDialog, setActiveDialog] = useState<{ npcId: NPCId; index: number; text: string } | null>(null);
  const [activeNotification, setActiveNotification ] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);

  // Farming actions log
  const [wateringCapacity, setWateringCapacity] = useState(5); // Out of 5 max

  // Fishing state engine
  const [fishingState, setFishingState] = useState<'idle' | 'casting' | 'waiting' | 'bite' | 'minigame' | 'caught' | 'failed'>('idle');
  const [fishingTimer, setFishingTimer] = useState<number | null>(null);
  const [fishingSuccessProgress, setFishingSuccessProgress] = useState(50); // slider game: match bar
  const [fishSliderTarget, setFishSliderTarget] = useState(40); // target position (0-100)
  const [fishSliderPlayer, setFishSliderPlayer] = useState(50); // player green slider bar
  const [caughtFishName, setCaughtFishName] = useState<string | null>(null);

  // Smooth walk canvas helper
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isPlayerWalking, setIsPlayerWalking] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const walkAnimFrame = useRef<number>(0);

  // Smooth continuous walk refs
  const playerPosRef = useRef({ x: gameState.playerPosition.x, y: gameState.playerPosition.y });
  const playerDirRef = useRef<'up' | 'down' | 'left' | 'right'>(gameState.playerDirection);
  const keysPressedRef = useRef<Record<string, boolean>>({});

  // Synchronize visual coordinate refs on external state resets
  useEffect(() => {
    const dx = Math.abs(playerPosRef.current.x - gameState.playerPosition.x);
    const dy = Math.abs(playerPosRef.current.y - gameState.playerPosition.y);
    if (dx > 1.1 || dy > 1.1) {
      playerPosRef.current = { x: gameState.playerPosition.x, y: gameState.playerPosition.y };
    }
    playerDirRef.current = gameState.playerDirection;
  }, [gameState.playerPosition, gameState.playerDirection]);

  // Auto save when gameState updates
  useEffect(() => {
    localStorage.setItem('lembah_hijau_rpg_state_v1', JSON.stringify(gameState));
  }, [gameState]);

  // Show auto notifications
  const triggerNotification = (msg: string) => {
    setActiveNotification(msg);
    setTimeout(() => {
      setActiveNotification((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Sound toggler wrapper
  const handleToggleMute = () => {
    const isMutedNow = sounds.toggleMute();
    setIsMuted(isMutedNow);
    triggerNotification(isMutedNow ? 'Suara dimatikan 🔇' : 'Suara diaktifkan 🔊');
  };

  // Day & Night Time cycle core ticking
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => {
        let newMinutes = prev.timeMinutes + 2; // Each tick adds 2 minutes
        let newDay = prev.day;
        let newTiles = [...prev.tiles.map(row => [...row])];
        let newNpcs = { ...prev.npcs };

        if (newMinutes >= 1440) { // 24 hours
          newMinutes = 360; // Reset to 6:00 AM new day
          newDay += 1;
          sounds.playAction('morning');

          // Deep grow crops at midnight new day
          newTiles = newTiles.map((row) =>
            row.map((tile) => {
              if (tile.crop) {
                const data = CROPS[tile.crop.cropId];
                if (data) {
                  const alreadyWatered = tile.crop.watered;
                  let newStage = tile.crop.stage;
                  let newDaysPlanted = tile.crop.daysPlanted + 1;

                  if (alreadyWatered && newStage < 3) {
                    // check progress ratio
                    const daysPerStage = Math.max(1, Math.round(data.growthDays / 3));
                    if (newDaysPlanted % daysPerStage === 0) {
                      newStage = Math.min(3, newStage + 1);
                    }
                  }

                  return {
                    ...tile,
                    type: tile.type === 'tilled_watered' ? 'tilled' : tile.type, // dry up tomorrow
                    crop: {
                      ...tile.crop,
                      stage: newStage,
                      daysPlanted: newDaysPlanted,
                      watered: false, // reset water
                    },
                  };
                }
              }

              // Also dry regular tiles tomorrow
              if (tile.type === 'tilled_watered') {
                return { ...tile, type: 'tilled' };
              }
              // Maybe random spawn wildflowers on grass tomorrow with small chance
              if (tile.type === 'grass' && Math.random() < 0.05) {
                return { ...tile, type: 'flower_spawn' };
              }

              return tile;
            })
          );

          // Reset Daily Talk-Gift tags for townsfolk
          Object.keys(newNpcs).forEach((k) => {
            const id = k as NPCId;
            newNpcs[id] = {
              ...newNpcs[id],
              hasTalkedToday: false,
              hasGiftedToday: false,
            };
          });

          // Custom message notification for next day
          setTimeout(() => {
            triggerNotification(`🌅 Pagi yang cerah! Hari ke-${newDay} dimulai. Tanamanmu mendapat nutrisi baru!`);
          }, 100);
        }

        return {
          ...prev,
          timeMinutes: newMinutes,
          day: newDay,
          tiles: newTiles,
          npcs: newNpcs,
        };
      });
    }, 4000); // 4 seconds = 2 minutes in game time

    return () => clearInterval(interval);
  }, []);

  // Handle active tool selection change
  const currentItem = gameState.inventory[gameState.selectedToolIdx];

  // NPC Gifting interaction
  const handleGiftNPC = (npcId: NPCId, itemIdx: number) => {
    sounds.playAction('click');
    const npc = gameState.npcs[npcId];
    const item = gameState.inventory[itemIdx];

    if (!item || item.type === 'tool' || item.count < 1) {
      triggerNotification('Pilih item konsumsi/tangkapan dari kantong belanja untuk kado.');
      return;
    }

    if (npc.hasGiftedToday) {
      setActiveDialog({
        npcId,
        index: 0,
        text: `"${npc.name}: Oh! Terima kasih kembali, tapi aku sudah menerima kadomu hari ini. Simpanlah untuk besok ya!"`,
      });
      return;
    }

    const isLoved = npc.favoriteItems.includes(item.name);
    const isHated = npc.hatedItems.includes(item.name);

    let friendshipBonus = 10;
    let dialogueResponse = npc.giftAcceptDialogue;

    if (isLoved) {
      friendshipBonus = 25;
      dialogueResponse = `💖 ${npc.giftAcceptDialogue} (Kukembalikan kasih sayang ini!)`;
    } else if (isHated) {
      friendshipBonus = -12;
      dialogueResponse = `💢 ${npc.giftRejectDialogue} (...Sepertinya dia kurang menyukainya)`;
    }

    // Deduct count
    const updatedInventory = gameState.inventory.map((inv, idx) => {
      if (idx === itemIdx) {
        return { ...inv, count: inv.count - 1 };
      }
      return inv;
    }).filter(inv => inv.count > 0 || inv.type === 'tool');

    // Update state
    setGameState((prev) => {
      const updatedNPC = {
        ...prev.npcs[npcId],
        friendship: Math.max(0, Math.min(100, prev.npcs[npcId].friendship + friendshipBonus)),
        hasGiftedToday: true,
      };

      // Check Quest Condition
      let updatedQuest = prev.activeQuest ? { ...prev.activeQuest } : null;
      if (
        updatedQuest &&
        !updatedQuest.completed &&
        updatedQuest.targetNPC === npcId &&
        updatedQuest.requiredItem === item.name
      ) {
        // Quest update
        updatedQuest.completed = true;
        triggerNotification(`🎯 Tugas Selesai! Kamu telah menyerahkan ${item.name} ke ${npc.name}!`);
      }

      return {
        ...prev,
        npcs: {
          ...prev.npcs,
          [npcId]: updatedNPC,
        },
        inventory: updatedInventory,
      };
    });

    setActiveDialog({
      npcId,
      index: 0,
      text: dialogueResponse,
    });
  };

  // Conversation Dialogue engine
  const handleTalkNPC = (npcId: NPCId) => {
    sounds.playAction('talk');
    const npc = gameState.npcs[npcId];
    const isFriend = npc.friendship >= 40;

    let randIdx = Math.floor(Math.random() * npc.greetDialogue.length);
    let spokenText = npc.greetDialogue[randIdx];

    if (isFriend) {
      randIdx = Math.floor(Math.random() * npc.friendDialogue.length);
      spokenText = `🌸 ${npc.friendDialogue[randIdx]}`;
    }

    // Set dialog view
    setActiveDialog({
      npcId,
      index: randIdx,
      text: `"${npc.name}: ${spokenText}"`,
    });

    // Check quest 1 (talk to everyone)
    if (!npc.hasTalkedToday) {
      setGameState((prev) => {
        const updatedNPCS = {
          ...prev.npcs,
          [npcId]: {
            ...prev.npcs[npcId],
            hasTalkedToday: true,
            friendship: Math.min(100, prev.npcs[npcId].friendship + 5), // greet adds 5pts
          },
        };

        // Check overall conversations count today
        const talkedCount = (Object.values(updatedNPCS) as NPC[]).filter((n) => n.hasTalkedToday).length;

        let updatedQuest = prev.activeQuest ? { ...prev.activeQuest } : null;
        if (updatedQuest && updatedQuest.id === 'quest_1' && !updatedQuest.completed) {
          if (talkedCount >= 4) {
            updatedQuest.completed = true;
            triggerNotification('🎯 Hubungan Sosial! Semua warga kota merespons sapaan hangatmu. Ambil hadiahmu di Jurnal Jurnal!');
          } else {
            triggerNotification(`💬 Kamu menyapa ${npc.name}. (${talkedCount}/4 Warga diajak bicara)`);
          }
        }

        return {
          ...prev,
          npcs: updatedNPCS,
          activeQuest: updatedQuest,
        };
      });
    }

    // Trigger seed shop if it's Siti
    if (npcId === 'siti') {
      sounds.playAction('talk');
      setShopNPC(npc);
      setActiveTab('shop');
    }
  };

  // Seed store transactions: Buy & Sell
  const handleBuySeed = (cropId: string) => {
    const data = CROPS[cropId];
    if (!data) return;

    if (gameState.gold < data.seedPrice) {
      sounds.playAction('click');
      triggerNotification('Uang tidak cukup untuk membeli benih ini! Jual sayuran atau pancing ikan dulu.');
      return;
    }

    sounds.playTone(800, 0.15, 'sine', 0.15); // Kaching
    setGameState((prev) => {
      // Find or add
      const existingIdx = prev.inventory.findIndex((item) => item.id === `seed_${cropId}`);
      let newInv = [...prev.inventory];

      if (existingIdx > -1) {
        newInv[existingIdx] = {
          ...newInv[existingIdx],
          count: newInv[existingIdx].count + 1,
        };
      } else {
        newInv.push({
          id: `seed_${cropId}`,
          name: data.seedName,
          type: 'seed',
          count: 1,
          description: `Tumbuh dalam ${data.growthDays} hari. Sells for ${data.sellPrice}g saat dipanen.`,
          value: Math.floor(data.seedPrice / 2),
        });
      }

      return {
        ...prev,
        gold: prev.gold - data.seedPrice,
        inventory: newInv,
      };
    });

    triggerNotification(`Membeli 1x ${data.seedName} seharga ${data.seedPrice}g! 🌱`);
  };

  const handleSellItem = (itemIdx: number) => {
    const item = gameState.inventory[itemIdx];
    if (!item || item.type === 'tool' || item.count < 1) return;

    sounds.playTone(950, 0.15, 'sine', 0.12); // sell chimes
    const priceEarned = item.value * item.count;

    setGameState((prev) => {
      const filteredInventory = prev.inventory.map((inv, idx) => {
        if (idx === itemIdx) {
          return { ...inv, count: 0 };
        }
        return inv;
      }).filter((inv) => inv.count > 0 || inv.type === 'tool');

      return {
        ...prev,
        gold: prev.gold + priceEarned,
        inventory: filteredInventory,
      };
    });

    triggerNotification(`💰 Berhasil menjual seluruh ${item.name} seharga ${priceEarned}g!`);
  };

  // Quest rewards claimer
  const handleClaimQuestReward = () => {
    const q = gameState.activeQuest;
    if (!q || !q.completed || q.claimed) return;

    sounds.playAction('success');
    setGameState((prev) => {
      // Index of current active quest
      const currentIdx = INITIAL_QUESTS.findIndex((iq) => iq.id === q.id);
      const nextQuest = INITIAL_QUESTS[currentIdx + 1] || null;

      // Add to notifications
      triggerNotification(`🏆 Hadiah Jurnal Diklaim! +${q.rewardGold}g Gold masuk kantong.`);

      return {
        ...prev,
        gold: prev.gold + q.rewardGold,
        activeQuest: nextQuest ? { ...nextQuest, completed: false, claimed: false } : null,
        completedQuestsCount: prev.completedQuestsCount + 1,
      };
    });
  };

  // Action Buttons Map Collision Controller (Hoe, Water, Sowing, Harvesting)
  const performMainAction = (forceAction?: ToolType, forceSelectIdx?: number) => {
    if (fishingState !== 'idle') {
      if (fishingState === 'waiting' || fishingState === 'bite') {
        resolveFishingAttempt();
      }
      return;
    }

    const tool = forceAction || (currentItem?.type === 'tool' ? currentItem.id as ToolType : 'hand');
    const direction = playerDirRef.current;
    const px = Math.round(playerPosRef.current.x);
    const py = Math.round(playerPosRef.current.y);

    // Check targeted tile orientation
    let tx = px;
    let ty = py;

    if (direction === 'up') ty = py - 1;
    else if (direction === 'down') ty = py + 1;
    else if (direction === 'left') tx = px - 1;
    else if (direction === 'right') tx = px + 1;

    // Boundary wrap protection
    if (tx < 0 || tx >= MAP_COLS || ty < 0 || ty >= MAP_ROWS) {
      triggerNotification('Awan tipis membatasimu berpaling keluar perbatasan.');
      return;
    }

    const targetedTile = gameState.tiles[ty][tx];

    // Check interactive actions first (Picking floral spawns, etc.)
    if (targetedTile.type === 'flower_spawn') {
      sounds.playAction('harvest');
      setGameState((prev) => {
        const itemIdx = prev.inventory.findIndex((i) => i.id === 'wildflower');
        let newInv = [...prev.inventory];
        if (itemIdx > -1) {
          newInv[itemIdx].count += 1;
        } else {
          newInv.push({
            id: 'wildflower',
            name: 'Bunga Liar',
            type: 'gift',
            count: 1,
            description: 'Kelopak alam segar berwana ungu muda. Suka dihadiahi ke Siti maupun Dewi.',
            value: 12,
          });
        }

        const newTiles = [...prev.tiles.map(row => [...row])];
        newTiles[ty][tx] = { ...targetedTile, type: 'grass' };

        // Quest condition
        let updatedQuest = prev.activeQuest ? { ...prev.activeQuest } : null;
        if (
          updatedQuest &&
          !updatedQuest.completed &&
          updatedQuest.id === 'quest_4' &&
          updatedQuest.requiredItem === 'Bunga Liar'
        ) {
          const totalFlowersCount = newInv.find((i) => i.id === 'wildflower')?.count || 0;
          if (totalFlowersCount >= updatedQuest.requiredCount) {
            updatedQuest.completed = true;
            triggerNotification('🎯 Pencarian Bunga Liar Selesai! Bawa bunga ini ke Dewi sekarang.');
          }
        }

        return {
          ...prev,
          inventory: newInv,
          tiles: newTiles,
          activeQuest: updatedQuest,
        };
      });
      triggerNotification('Memetik 1x Bunga Liar ungu indah! 🌸');
      return;
    }

    // Harvesting mature crops manually
    if (targetedTile.crop && targetedTile.crop.stage === 3) {
      const cropId = targetedTile.crop.cropId;
      const cropData = CROPS[cropId];
      sounds.playAction('harvest');

      setGameState((prev) => {
        const itemIdx = prev.inventory.findIndex((i) => i.id === cropId);
        let newInv = [...prev.inventory];
        if (itemIdx > -1) {
          newInv[itemIdx].count += 1;
        } else {
          newInv.push({
            id: cropId,
            name: cropData.name,
            type: 'crop',
            count: 1,
            description: `Produk pertanian berkualitas premium segar ${cropData.name}.`,
            value: cropData.sellPrice,
          });
        }

        // Clean crop from tile
        const newTiles = [...prev.tiles.map(row => [...row])];
        newTiles[ty][tx] = { ...targetedTile, crop: null, type: 'tilled' };

        // Quest checking
        let updatedQuest = prev.activeQuest ? { ...prev.activeQuest } : null;
        if (
          updatedQuest &&
          !updatedQuest.completed &&
          updatedQuest.targetNPC === 'budi' &&
          updatedQuest.requiredItem === cropData.name
        ) {
          const matchingCount = newInv.find((i) => i.id === cropId)?.count || 0;
          if (matchingCount >= updatedQuest.requiredCount) {
            updatedQuest.completed = true;
          }
        }

        return {
          ...prev,
          inventory: newInv,
          tiles: newTiles,
          activeQuest: updatedQuest,
        };
      });

      triggerNotification(`Memanen 1x ${cropData.name} segar dari kebun! +${cropData.sellPrice} Gold jika dijual.`);
      return;
    }

    // Cutting tall grass / shrubs
    if (targetedTile.type === 'tall_grass') {
      if (currentItem?.id !== 'scythe') {
        triggerNotification('Gunakan alat Sabit untuk memotong semak / rumput panjang.');
        return;
      }

      sounds.playAction('clear');

      setGameState((prev) => {
        // Drop rate calculation: chance for Serat Jerami, wildflower, or seed!
        let dropName = '';
        let dropId = '';
        let dropType: 'resource' | 'gift' | 'seed' = 'resource';
        let dropDesc = '';
        let dropVal = 1;

        const rand = Math.random();
        if (rand < 0.12) {
          dropName = 'Bunga Liar';
          dropId = 'wildflower';
          dropType = 'gift';
          dropDesc = 'Kelopak alam segar berwarna ungu muda. Suka dihadiahi ke Siti maupun Dewi.';
          dropVal = 12;
        } else if (rand < 0.38) {
          dropName = 'Serat Jerami';
          dropId = 'fiber';
          dropType = 'resource';
          dropDesc = 'Batang jerami kering dari rumput liar tebal, bahan dasar kerajinan.';
          dropVal = 3;
        } else if (rand < 0.48) {
          dropName = 'Benih Wortel';
          dropId = 'seed_wortel';
          dropType = 'seed';
          dropDesc = 'Butuh 2 hari tumbuh. Wortel renyah kegemaran Pak Budi.';
          dropVal = 5;
        }

        let newInv = [...prev.inventory];
        if (dropId) {
          const itemIdx = prev.inventory.findIndex((i) => i.id === dropId);
          if (itemIdx > -1) {
            newInv[itemIdx] = {
              ...newInv[itemIdx],
              count: newInv[itemIdx].count + 1,
            };
          } else {
            newInv.push({
              id: dropId,
              name: dropName,
              type: dropType,
              count: 1,
              description: dropDesc,
              value: dropVal,
            });
          }
        }

        const newTiles = [...prev.tiles.map(row => [...row])];
        newTiles[ty][tx] = { ...targetedTile, type: 'grass' };

        // Handle Quest 4 (Kado Bunga untuk Dewi / search wildflowers) progress if dropped
        let updatedQuest = prev.activeQuest ? { ...prev.activeQuest } : null;
        if (
          updatedQuest &&
          !updatedQuest.completed &&
          updatedQuest.id === 'quest_4' &&
          updatedQuest.requiredItem === 'Bunga Liar' &&
          dropId === 'wildflower'
        ) {
          const totalFlowersCount = newInv.find((i) => i.id === 'wildflower')?.count || 0;
          if (totalFlowersCount >= updatedQuest.requiredCount) {
            updatedQuest.completed = true;
            setTimeout(() => triggerNotification('🎯 Pencarian Bunga Liar Selesai! Bawa bunga ini ke Dewi sekarang.'), 100);
          }
        }

        if (dropId) {
          setTimeout(() => triggerNotification(`Tebasan Sabit! Menemukan 1x ${dropName}. 🌾`), 50);
        } else {
          setTimeout(() => triggerNotification('Menebas rumput panjang! Petak dibersihkan.'), 50);
        }

        return {
          ...prev,
          inventory: newInv,
          tiles: newTiles,
          activeQuest: updatedQuest,
        };
      });
      return;
    }

    // Clearing woody stone obstacles
    if (targetedTile.type === 'obstacle_wood' || targetedTile.type === 'obstacle_stone') {
      if (currentItem?.id !== 'scythe') {
        triggerNotification('Gunakan alat Sabit untuk membersihkan kayu/batu rintangan.');
        return;
      }

      sounds.playAction('clear');
      const isWood = targetedTile.type === 'obstacle_wood';
      const resourceId = isWood ? 'wood' : 'stone';
      const resourceName = isWood ? 'Kayu' : 'Batu';

      setGameState((prev) => {
        const itemIdx = prev.inventory.findIndex((i) => i.id === resourceId);
        let newInv = [...prev.inventory];
        if (itemIdx > -1) {
          newInv[itemIdx].count += 1;
        } else {
          newInv.push({
            id: resourceId,
            name: resourceName,
            type: 'resource',
            count: 1,
            description: `Bahan dasar mentah alami ${resourceName} Lembah Hijau.`,
            value: 4,
          });
        }

        const newTiles = [...prev.tiles.map(row => [...row])];
        newTiles[ty][tx] = { ...targetedTile, type: 'grass' };

        return {
          ...prev,
          inventory: newInv,
          tiles: newTiles,
        };
      });

      triggerNotification(`Pembersihan sukses! Menemukan +1 ${resourceName}. 🪵`);
      return;
    }

    // Social Interact with NPCs if player shares next block
    let foundNpc: NPCId | null = null;
    Object.keys(gameState.npcs).forEach((key) => {
      const npc = gameState.npcs[key as NPCId];
      if (npc.position.x === tx && npc.position.y === ty) {
        foundNpc = key as NPCId;
      }
    });

    if (foundNpc) {
      handleTalkNPC(foundNpc);
      return;
    }

    // Check specific tools implementation
    if (tool === 'hoe' || tool === 'water_can') {
      // HOE Soil Preparation
      if ((tool as string) === 'hoe') {
        if (targetedTile.type === 'grass' || targetedTile.type === 'path') {
          sounds.playAction('hoe');
          setGameState((prev) => {
            const newTiles = [...prev.tiles.map(row => [...row])];
            newTiles[ty][tx] = { ...targetedTile, type: 'tilled' };
            return { ...prev, tiles: newTiles };
          });
          triggerNotification('Mencangkul tanah! Tanah gembur siap ditanami benih.');
        } else {
          triggerNotification('Tanah ini sudah dicangkul atau tidak gembur.');
        }
        return;
      }

      // WATER CAN Treatment
      if ((tool as string) === 'water_can') {
        // Refill at water body
        if (targetedTile.type === 'water') {
          sounds.playAction('refill');
          setWateringCapacity(5);
          triggerNotification('💧 Menimba air! Alat penyiram terisi penuh (5/5).');
          return;
        }

        if (wateringCapacity <= 0) {
          triggerNotification('Alat penyiram kosong! Berdiri dekat petak air danau lalu gunakan alat untuk mengisi ulang air.');
          return;
        }

        if (targetedTile.type === 'tilled') {
          sounds.playAction('water');
          setWateringCapacity((prev) => prev - 1);
          setGameState((prev) => {
            const newTiles = [...prev.tiles.map(row => [...row])];
            newTiles[ty][tx] = {
              ...targetedTile,
              type: 'tilled_watered',
              crop: targetedTile.crop ? { ...targetedTile.crop, watered: true } : null,
            };
            return { ...prev, tiles: newTiles };
          });
          triggerNotification('Tanah disiram hingga basah lembab! Sisa air: ' + (wateringCapacity - 1));
        } else if (targetedTile.type === 'tilled_watered') {
          triggerNotification('Tanah ini sudah terlampau basah untuk hari ini.');
        } else {
          triggerNotification('Siram tanah yang dicangkul agar subur.');
        }
        return;
      }
    }

    // Planting Seeds manually if a seed is active in user toolbar
    if (currentItem && currentItem.type === 'seed' && currentItem.count > 0) {
      if (targetedTile.type === 'tilled' || targetedTile.type === 'tilled_watered') {
        if (targetedTile.crop) {
          triggerNotification('Petak tanah ini sudah memiliki tanaman yang sedang bertumbuh.');
          return;
        }

        const cropId = currentItem.id.replace('seed_', '');
        sounds.playAction('plant');

        setGameState((prev) => {
          // decrement seed count
          const updatedInv = prev.inventory.map((inv, idx) => {
            if (idx === prev.selectedToolIdx) {
              return { ...inv, count: inv.count - 1 };
            }
            return inv;
          }).filter((inv) => inv.count > 0 || inv.type === 'tool');

          const newTiles = [...prev.tiles.map(row => [...row])];
          newTiles[ty][tx] = {
            ...targetedTile,
            crop: {
              cropId,
              stage: 0,
              daysPlanted: 0,
              watered: targetedTile.type === 'tilled_watered',
            },
          };

          return {
            ...prev,
            inventory: updatedInv,
            tiles: newTiles,
          };
        });

        triggerNotification(`Menanam ${currentItem.name} pada petak tanah subur! 🌾`);
        return;
      } else {
        triggerNotification('Tanam benih hanya di tanah bertoreh cangkul!');
        return;
      }
    }

    // FISHING Cast System triggered
    if (currentItem && currentItem.id === 'fishing_rod') {
      if (targetedTile.type === 'water') {
        sounds.playAction('refill');
        setFishingState('casting');
        triggerNotification('🎣 Melempar umpan... Duduk dan bersabarlah memandangi aliran air.');

        // Set timed delays
        const spawnDelay = 2500 + Math.random() * 3200;
        const timerId = window.setTimeout(() => {
          sounds.playAction('bite');
          setFishingState('bite');
          triggerNotification('❗ IKAN MENYAMBAR! Klik "Pancing Joran" (atau tekan Spasi) SEKARANG juga!');
        }, spawnDelay);

        setFishingTimer(timerId);
      } else {
        triggerNotification('Posisikan arah memancing langsung menghadap danau air biru.');
      }
      return;
    }

    // Just standard notice
    triggerNotification('Cobalah mendekati tanah kebun untuk bertani, atau danau selatan untuk memancing.');
  };

  // Fishing timing / mini game result
  const resolveFishingAttempt = () => {
    if (fishingState === 'casting') {
      // manual abort
      if (fishingTimer) clearTimeout(fishingTimer);
      setFishingState('idle');
      triggerNotification('Batal memancing.');
      return;
    }

    if (fishingState === 'waiting') {
      if (fishingTimer) clearTimeout(fishingTimer);
      setFishingState('idle');
      return;
    }

    if (fishingState === 'bite') {
      if (fishingTimer) clearTimeout(fishingTimer);
      // Success reaction! Start fishing minigame
      sounds.playAction('reel');
      setFishingState('minigame');
      setFishingSuccessProgress(50);
      setFishSliderPlayer(50);
      setFishSliderTarget(40 + Math.random() * 40);
      return;
    }
  };

  // Fishing Minigame Tick updater
  useEffect(() => {
    if (fishingState !== 'minigame') return;

    const gameTick = setInterval(() => {
      // Random move target fish slider
      setFishSliderTarget((prev) => {
        const delta = (Math.random() - 0.5) * 15;
        return Math.max(10, Math.min(90, prev + delta));
      });

      // Drag player slider towards keys or decay slowly towards target
      setFishingSuccessProgress((prev) => {
        const gap = Math.abs(fishSliderPlayer - fishSliderTarget);
        let bonus = -4; // degrade if out of range

        if (gap < 12) {
          bonus = 5; // boost if overlapping nicely
          // dynamic whir
          if (Math.random() < 0.3) sounds.playTone(300 + gap * 5, 0.04, 'triangle', 0.05);
        }

        const nextProgress = Math.max(0, Math.min(100, prev + bonus));

        if (nextProgress >= 100) {
          clearInterval(gameTick);
          triggerFishingSuccess();
        } else if (nextProgress <= 0) {
          clearInterval(gameTick);
          setFishingState('failed');
          sounds.playAction('clear');
          setTimeout(() => setFishingState('idle'), 2500);
        }

        return nextProgress;
      });
    }, 120);

    return () => clearInterval(gameTick);
  }, [fishingState, fishSliderPlayer, fishSliderTarget]);

  // Handle catching fish
  const triggerFishingSuccess = () => {
    sounds.playAction('success');

    // Roll random fish depending on tier chances
    const rand = Math.random();
    let indexSelected = 0; // Lele

    if (rand < 0.4) {
      indexSelected = 0; // Lele (40%)
    } else if (rand < 0.7) {
      indexSelected = 1; // Ikan Mas (30%)
    } else if (rand < 0.88) {
      indexSelected = 2; // Gurame (18%)
    } else if (rand < 0.96) {
      indexSelected = 3; // Sidat (8%)
    } else {
      indexSelected = 4; // Ikan Purba (4%)
    }

    const fish = FISH_TYPES[indexSelected];
    setCaughtFishName(fish.name);
    setFishingState('caught');

    // Deposit to bags
    setGameState((prev) => {
      const existingIdx = prev.inventory.findIndex((i) => i.id === `fish_${fish.name.toLowerCase().replace(' ', '_')}`);
      let newInv = [...prev.inventory];

      if (existingIdx > -1) {
        newInv[existingIdx].count += 1;
      } else {
        newInv.push({
          id: `fish_${fish.name.toLowerCase().replace(' ', '_')}`,
          name: fish.name,
          type: 'fish',
          count: 1,
          description: `Ikan kualitas ${fish.rarity} segar ditangkap dari Danau Lembah Hijau.`,
          value: fish.price,
        });
      }

      // Quest 3 Check
      let updatedQuest = prev.activeQuest ? { ...prev.activeQuest } : null;
      if (
        updatedQuest &&
        !updatedQuest.completed &&
        updatedQuest.id === 'quest_3' &&
        updatedQuest.requiredItem === 'Ikan Mas' &&
        fish.name === 'Ikan Mas'
      ) {
        updatedQuest.completed = true;
      }

      return {
        ...prev,
        inventory: newInv,
        activeQuest: updatedQuest,
      };
    });

    triggerNotification(`Horee! Menangkap ${fish.name} (${fish.rarity})! bernilai ${fish.price} Gold.`);
  };

  // Keyboard controls with continuous movement listener integration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (activeDialog) {
        if (e.key === ' ' || e.key === 'Enter') {
          sounds.playAction('click');
          setActiveDialog(null);
        }
        return;
      }

      if (fishingState !== 'idle') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          resolveFishingAttempt();
        }
        return;
      }

      // Number keys 1-5 selectable hotbar buttons mapping
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        if (idx < gameState.inventory.length) {
          sounds.playAction('click');
          setGameState((prev) => ({ ...prev, selectedToolIdx: idx }));
        }
        return;
      }

      const key = e.key.toLowerCase();
      // Add key to our pressed register map
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        keysPressedRef.current[key] = true;
        
        let nextDir: 'up' | 'down' | 'left' | 'right' = playerDirRef.current;
        if (key === 'w' || key === 'arrowup') nextDir = 'up';
        else if (key === 's' || key === 'arrowdown') nextDir = 'down';
        else if (key === 'a' || key === 'arrowleft') nextDir = 'left';
        else if (key === 'd' || key === 'arrowright') nextDir = 'right';
        
        playerDirRef.current = nextDir;
        setGameState((prev) => ({ ...prev, playerDirection: nextDir }));
      }

      // Single action clicks
      if (e.key === ' ' || e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
        e.preventDefault();
        performMainAction();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        keysPressedRef.current[key] = false;
      }
    };

    const handleBlur = () => {
      keysPressedRef.current = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, activeDialog, fishingState, wateringCapacity]);

  // Attempt move coordinates on 2D Board (for virtual touch controls)
  const attemptPlayerMove = (dx: number, dy: number, dir: 'up' | 'down' | 'left' | 'right') => {
    setGameState((prev) => {
      const rx = prev.playerPosition.x + dx;
      const ry = prev.playerPosition.y + dy;

      // Colllision wall grid check
      if (rx < 0 || rx >= MAP_COLS || ry < 0 || ry >= MAP_ROWS) {
        playerDirRef.current = dir;
        return { ...prev, playerDirection: dir };
      }

      const nextTile = prev.tiles[ry][rx];
      const isBlocked =
        nextTile.type === 'wall' ||
        nextTile.type === 'obstacle_stone' ||
        nextTile.type === 'obstacle_wood' ||
        nextTile.type === 'water';

      // Check NPC overlaps positions
      let isNpcBlocking = false;
      (Object.values(prev.npcs) as NPC[]).forEach((npc) => {
        if (npc.position.x === rx && npc.position.y === ry) {
          isNpcBlocking = true;
        }
      });

      if (isBlocked || isNpcBlocking) {
        playerDirRef.current = dir;
        return { ...prev, playerDirection: dir };
      }

      setIsPlayerWalking(true);
      setTimeout(() => setIsPlayerWalking(false), 200);

      // Instantly sync the smooth coordinate ref to snap
      playerPosRef.current = { x: rx, y: ry };
      playerDirRef.current = dir;

      return {
        ...prev,
        playerPosition: { x: rx, y: ry },
        playerDirection: dir,
      };
    });
  };

  // HTML5 canvas graphic representation generator
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Clear and Redraw frame loop
    let requestFrameId: number;

    const renderMap = () => {
      // 1. Update continuous smooth player position each frame
      if (fishingState === 'idle' && !activeDialog) {
        let dx = 0;
        let dy = 0;

        if (keysPressedRef.current['w'] || keysPressedRef.current['arrowup']) dy -= 1;
        if (keysPressedRef.current['s'] || keysPressedRef.current['arrowdown']) dy += 1;
        if (keysPressedRef.current['a'] || keysPressedRef.current['arrowleft']) dx -= 1;
        if (keysPressedRef.current['d'] || keysPressedRef.current['arrowright']) dx += 1;

        if (dx !== 0 || dy !== 0) {
          const length = Math.sqrt(dx * dx + dy * dy);
          let speed = 0.09; // fast buttery smooth frame rate speeds

          // Slow down slightly on tall grass shrubs
          const rpx = Math.round(playerPosRef.current.x);
          const rpy = Math.round(playerPosRef.current.y);
          if (rpx >= 0 && rpx < MAP_COLS && rpy >= 0 && rpy < MAP_ROWS) {
            const currentTile = gameState.tiles[rpy][rpx];
            if (currentTile && currentTile.type === 'tall_grass') {
              speed = 0.058; // slow down by 35%
            }
          }

          const stepX = (dx / length) * speed;
          const stepY = (dy / length) * speed;

          const nX = playerPosRef.current.x + stepX;
          const nY = playerPosRef.current.y + stepY;

          const checkBlockPoint = (testCheckX: number, testCheckY: number) => {
            const halfSize = 0.28;
            const pointsToTest = [
              { x: testCheckX - halfSize, y: testCheckY - halfSize },
              { x: testCheckX + halfSize, y: testCheckY - halfSize },
              { x: testCheckX - halfSize, y: testCheckY + halfSize },
              { x: testCheckX + halfSize, y: testCheckY + halfSize }
            ];

            for (const pt of pointsToTest) {
              const txGrid = Math.floor(pt.x);
              const tyGrid = Math.floor(pt.y);

              if (txGrid < 0 || txGrid >= MAP_COLS || tyGrid < 0 || tyGrid >= MAP_ROWS) {
                return true;
              }

              const testTile = gameState.tiles[tyGrid][txGrid];
              if (
                testTile.type === 'wall' ||
                testTile.type === 'obstacle_stone' ||
                testTile.type === 'obstacle_wood' ||
                testTile.type === 'water'
              ) {
                return true;
              }

              for (const npc of Object.values(gameState.npcs) as NPC[]) {
                if (npc.position.x === txGrid && npc.position.y === tyGrid) {
                  return true;
                }
              }
            }
            return false;
          };

          let didMove = false;
          if (!checkBlockPoint(nX, playerPosRef.current.y)) {
            playerPosRef.current.x = nX;
            didMove = true;
          }
          if (!checkBlockPoint(playerPosRef.current.x, nY)) {
            playerPosRef.current.y = nY;
            didMove = true;
          }

          if (didMove) {
            if (!isPlayerWalking) {
              setIsPlayerWalking(true);
            }
          }

          const nextDir = playerDirRef.current;
          const gridX = Math.round(playerPosRef.current.x);
          const gridY = Math.round(playerPosRef.current.y);

          if (
            gridX !== gameState.playerPosition.x ||
            gridY !== gameState.playerPosition.y ||
            nextDir !== gameState.playerDirection
          ) {
            setGameState((prev) => ({
              ...prev,
              playerPosition: { x: gridX, y: gridY },
              playerDirection: nextDir,
            }));
          }
        } else {
          if (isPlayerWalking) {
            setIsPlayerWalking(false);
          }
        }
      }

      // 2. Clear background base
      ctx.fillStyle = '#1e3a1e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. Render each floor tile
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          const tile = gameState.tiles[r][c];
          const tx = c * TILE_SIZE;
          const ty = r * TILE_SIZE;

          // Drawing patterns
          switch (tile.type) {
            case 'grass':
              ctx.fillStyle = '#55a630'; // Stardew green
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
              // tiny blades of grass
              ctx.fillStyle = '#2b9348';
              if (tile.decorType === 0) {
                ctx.fillRect(tx + 8, ty + 12, 2, 4);
                ctx.fillRect(tx + 24, ty + 20, 2, 4);
              } else if (tile.decorType === 1) {
                ctx.fillRect(tx + 18, ty + 6, 2, 4);
                ctx.fillRect(tx + 10, ty + 24, 2, 4);
              }
              break;

            case 'tall_grass':
              // Deep, lush green shrub block background
              ctx.fillStyle = '#418225';
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

              // Draw high detailed taller grass swaying in wind
              ctx.fillStyle = '#224e10'; // shadow details
              const windSweep = Math.sin((Date.now() / 240) + (c * 0.4) + (r * 0.25)) * 3;

              // Left Blade
              ctx.beginPath();
              ctx.moveTo(tx + 6, ty + TILE_SIZE);
              ctx.quadraticCurveTo(tx + 4 + windSweep * 0.4, ty + 14, tx + 2 + windSweep, ty + 10);
              ctx.quadraticCurveTo(tx + 9, ty + 20, tx + 13, ty + TILE_SIZE);
              ctx.fill();

              // Center Blade - taller
              ctx.fillStyle = '#2c6d1a';
              ctx.beginPath();
              ctx.moveTo(tx + 14, ty + TILE_SIZE);
              ctx.quadraticCurveTo(tx + 16 + windSweep * 0.7, ty + 8, tx + 18 + windSweep, ty + 4);
              ctx.quadraticCurveTo(tx + 21, ty + 18, tx + 24, ty + TILE_SIZE);
              ctx.fill();

              // Right Blade
              ctx.fillStyle = '#59a633'; // light highlight green
              ctx.beginPath();
              ctx.moveTo(tx + 23, ty + TILE_SIZE);
              ctx.quadraticCurveTo(tx + 28 + windSweep * 0.5, ty + 16, tx + 31 + windSweep, ty + 12);
              ctx.quadraticCurveTo(tx + 27, ty + 24, tx + 29, ty + TILE_SIZE);
              ctx.fill();

              // Clover bud flower details
              if (tile.decorType === 2) {
                ctx.fillStyle = '#ffe4e6'; // soft white pink cbuds
                ctx.beginPath();
                ctx.arc(tx + 12 + windSweep * 0.4, ty + 18, 2, 0, Math.PI * 2);
                ctx.arc(tx + 17 + windSweep * 0.4, ty + 15, 2, 0, Math.PI * 2);
                ctx.fill();
              }
              break;

            case 'path':
              ctx.fillStyle = '#dfd3c3'; // light sand tan
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#c7b198';
              ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
              break;

            case 'pier':
              ctx.fillStyle = '#8e5e38'; // dock brown
              ctx.fillRect(tx, ty + 2, TILE_SIZE, TILE_SIZE - 4);
              ctx.fillStyle = '#734827';
              for (let i = 4; i < TILE_SIZE; i += 8) {
                ctx.fillRect(tx + i, ty, 2, TILE_SIZE);
              }
              break;

            case 'bridge':
              ctx.fillStyle = '#8b5a2b';
              ctx.fillRect(tx + 4, ty, TILE_SIZE - 8, TILE_SIZE);
              ctx.fillStyle = '#4a2f13';
              ctx.fillRect(tx + 2, ty, 2, TILE_SIZE);
              ctx.fillRect(tx + TILE_SIZE - 4, ty, 2, TILE_SIZE);
              break;

            case 'water':
              ctx.fillStyle = '#3a86c8';
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

              const waveOffset = Math.sin((Date.now() / 360) + (c * 0.5) + (r * 0.3)) * 4;
              ctx.fillStyle = '#5fa8e4';
              ctx.fillRect(tx + 6 + waveOffset, ty + 12, 8, 2);
              ctx.fillRect(tx + 22 - waveOffset, ty + 24, 10, 2);
              break;

            case 'tilled':
              ctx.fillStyle = '#78350f';
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#451a03';
              ctx.strokeRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);
              break;

            case 'tilled_watered':
              ctx.fillStyle = '#451a03';
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#291002';
              ctx.strokeRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);
              ctx.fillStyle = '#93c5fd';
              ctx.fillRect(tx + 28, ty + 6, 2, 2);
              break;

            case 'wall':
              ctx.fillStyle = '#c2410c';
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#7c2d12';
              ctx.fillRect(tx, ty + TILE_SIZE - 4, TILE_SIZE, 4);
              break;

            case 'door':
              ctx.fillStyle = '#4a2f13';
              ctx.fillRect(tx + 4, ty, TILE_SIZE - 8, TILE_SIZE);
              ctx.fillStyle = '#fbbf24';
              ctx.fillRect(tx + TILE_SIZE - 8, ty + 20, 2, 2);
              break;

            case 'flower_spawn':
              ctx.fillStyle = '#55a630';
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#b7791f';
              ctx.fillRect(tx + 18, ty + 12, 4, 16);
              ctx.fillStyle = '#e879f9';
              ctx.beginPath();
              ctx.arc(tx + 20, ty + 12, 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#fde047';
              ctx.beginPath();
              ctx.arc(tx + 20, ty + 12, 2, 0, Math.PI * 2);
              ctx.fill();
              break;

            case 'obstacle_wood':
              ctx.fillStyle = '#55a630';
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#78350f';
              ctx.fillRect(tx + 8, ty + 12, 24, 16);
              ctx.fillStyle = '#b45309';
              ctx.fillRect(tx + 12, ty + 10, 16, 2);
              ctx.fillStyle = '#d97706';
              ctx.fillRect(tx + 18, ty + 16, 4, 8);
              break;

            case 'obstacle_stone':
              ctx.fillStyle = '#55a630';
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#64748b';
              ctx.beginPath();
              ctx.arc(tx + 20, ty + 22, 12, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#94a3b8';
              ctx.beginPath();
              ctx.arc(tx + 16, ty + 18, 5, 0, Math.PI * 2);
              ctx.fill();
              break;
          }

          // Active Crop Plant graphic overlays
          if (tile.crop) {
            const data = CROPS[tile.crop.cropId];
            if (data) {
              const stage = tile.crop.stage;
              const cx = tx + TILE_SIZE / 2;
              const cy = ty + TILE_SIZE - 4;

              if (stage === 0) {
                // SEED
                ctx.fillStyle = '#a1a1aa'; // little seed bag pack or soil mound
                ctx.fillRect(cx - 4, cy - 4, 8, 4);
              } else if (stage === 1) {
                // SPROUT
                ctx.fillStyle = '#4ade80'; // soft green node
                ctx.fillRect(cx - 2, cy - 10, 4, 10);
                ctx.fillRect(cx - 6, cy - 8, 4, 2); // left leaf
              } else if (stage === 2) {
                // GROWING
                ctx.fillStyle = '#22c55e'; // stouter leafy green bush
                ctx.fillRect(cx - 4, cy - 16, 8, 16);
                ctx.fillStyle = '#16a34a';
                ctx.fillRect(cx - 10, cy - 12, 6, 4);
                ctx.fillRect(cx + 4, cy - 10, 6, 4);
              } else if (stage === 3) {
                // MATURE (READY HARVEST)
                ctx.fillStyle = '#15803d'; // strong green stalk base
                ctx.fillRect(cx - 5, cy - 22, 10, 22);

                // draw the colorful actual produce
                ctx.fillStyle = data.color;
                if (data.id === 'wortel') {
                  // Carrot is rooted down, visual leaf on top
                  ctx.fillStyle = '#f97316';
                  ctx.fillRect(cx - 4, cy - 10, 8, 10);
                  ctx.fillStyle = '#22c55e';
                  ctx.fillRect(cx - 6, cy - 16, 12, 6);
                } else if (data.id === 'tomat') {
                  // Red circles cluster hang on stalk
                  ctx.beginPath();
                  ctx.arc(cx - 4, cy - 12, 4, 0, Math.PI * 2);
                  ctx.arc(cx + 4, cy - 6, 4, 0, Math.PI * 2);
                  ctx.arc(cx, cy - 16, 5, 0, Math.PI * 2);
                  ctx.fill();
                } else if (data.id === 'lobak') {
                  // White radish poking out
                  ctx.fillStyle = '#f1f5f9';
                  ctx.fillRect(cx - 6, cy - 12, 12, 12);
                  ctx.fillStyle = '#22c55e';
                  ctx.fillRect(cx - 4, cy - 18, 8, 6);
                } else if (data.id === 'labu') {
                  // Massive glorious orange pumpkin
                  ctx.fillStyle = '#f59e0b';
                  ctx.beginPath();
                  ctx.ellipse(cx, cy - 8, 10, 8, 0, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#78350f'; // stem root brown
                  ctx.fillRect(cx - 2, cy - 18, 4, 4);
                }
              }
            }
          }
        }
      }

      // Render all Town citizens NPCs
      Object.keys(gameState.npcs).forEach((key) => {
        const npc = gameState.npcs[key as NPCId];
        const nx = npc.position.x * TILE_SIZE;
        const ny = npc.position.y * TILE_SIZE;

        // Sprite Base Outline
        ctx.fillStyle = '#00000030'; // Shadow base subtle
        ctx.beginPath();
        ctx.arc(nx + TILE_SIZE / 2, ny + TILE_SIZE - 4, 10, 0, Math.PI * 2);
        ctx.fill();

        // Sprite Skin/Body
        ctx.fillStyle = npc.avatarColor;
        // Body clothing
        ctx.fillRect(nx + 8, ny + 12, TILE_SIZE - 16, TILE_SIZE - 16);
        // Head Face
        ctx.fillStyle = '#ffedd5'; // Peach human skin
        ctx.fillRect(nx + 10, ny + 2, TILE_SIZE - 20, 10);

        // Customize NPC visuals
        ctx.fillStyle = '#1e293b'; // general hair
        if (npc.id === 'budi') {
          ctx.fillStyle = '#94a3b8'; // geriatric older white-grey hair
          ctx.fillRect(nx + 8, ny + 1, 24, 4);
          ctx.fillStyle = '#f59e0b'; // straw hat brim
          ctx.fillRect(nx + 6, ny - 1, 28, 3);
          ctx.fillRect(nx + 12, ny - 6, 16, 5);
        } else if (npc.id === 'siti') {
          ctx.fillStyle = '#f472b6'; // radiant bubbly bright pink hair
          ctx.fillRect(nx + 8, ny, 24, 4);
          ctx.fillRect(nx + 6, ny + 4, 4, 8); // pig tail left
          ctx.fillRect(nx + 30, ny + 4, 4, 8); // pig tail right
        } else if (npc.id === 'agus') {
          ctx.fillStyle = '#1e3a8a'; // bucket hat blue
          ctx.fillRect(nx + 6, ny + 1, 28, 3);
          ctx.fillRect(nx + 10, ny - 4, 20, 5);
        } else if (npc.id === 'dewi') {
          ctx.fillStyle = '#a855f7'; // purple artsy flowy hair
          ctx.fillRect(nx + 8, ny, 24, 5);
          ctx.fillRect(nx + 8, ny + 5, 4, 10);
        }

        // Eyes indicators looking general Direction
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(nx + 14, ny + 5, 2, 2);
        ctx.fillRect(nx + 24, ny + 5, 2, 2);

        // Name badge floating text tag
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(nx - 4, ny - 28, TILE_SIZE + 8, 14);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, nx + TILE_SIZE / 2, ny - 18);
      });

      // Render Player Saka
      const px = playerPosRef.current.x * TILE_SIZE;
      const py = playerPosRef.current.y * TILE_SIZE;

      // Draw active selection pointer target box box
      const direction = playerDirRef.current;
      const roundedPlayerX = Math.round(playerPosRef.current.x);
      const roundedPlayerY = Math.round(playerPosRef.current.y);

      let targetGridX = roundedPlayerX;
      let targetGridY = roundedPlayerY;
      if (direction === 'up') targetGridY = roundedPlayerY - 1;
      else if (direction === 'down') targetGridY = roundedPlayerY + 1;
      else if (direction === 'left') targetGridX = roundedPlayerX - 1;
      else if (direction === 'right') targetGridX = roundedPlayerX + 1;

      const tx = targetGridX * TILE_SIZE;
      const ty = targetGridY * TILE_SIZE;

      ctx.strokeStyle = '#fef08a'; // yellow highlight bounding pointer
      ctx.lineWidth = 2;
      ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);

      // Player Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE - 4, 12, 0, Math.PI * 2);
      ctx.fill();

      // Bobbing walking step calculator
      const bobY = isPlayerWalking ? Math.sin(Date.now() / 60) * 3 : 0;

      // Player body base clothings (Saka: cozy blue overalls, red inner shirt)
      ctx.fillStyle = '#3b82f6'; // overalls blue
      ctx.fillRect(px + 8, py + 14 + bobY, TILE_SIZE - 16, TILE_SIZE - 18);
      ctx.fillStyle = '#ef4444'; // red sleeves shirt
      ctx.fillRect(px + 6, py + 16 + bobY, 2, 8);
      ctx.fillRect(px + TILE_SIZE - 8, py + 16 + bobY, 2, 8);

      // Shoes
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px + 10, py + TILE_SIZE - 4, 6, 4);
      ctx.fillRect(px + TILE_SIZE - 16, py + TILE_SIZE - 4, 6, 4);

      // Skin head
      ctx.fillStyle = '#ffedd5'; // rosy peach skin tone
      ctx.fillRect(px + 10, py + 4 + bobY, TILE_SIZE - 20, 10);

      // Saka bright orange retro spiky adventurer hair!
      ctx.fillStyle = '#f97316';
      ctx.fillRect(px + 8, py + bobY, 24, 5);
      // fringe hair tips
      ctx.fillRect(px + 8, py + 5 + bobY, 4, 4);
      ctx.fillRect(px + TILE_SIZE - 12, py + 5 + bobY, 4, 4);

      // Render eyes pointing look direction
      ctx.fillStyle = '#1e293b';
      let ex1 = px + 14;
      let ex2 = px + 24;
      let ey = py + 8 + bobY;

      if (direction === 'left') {
        ex1 = px + 11;
        ex2 = px + 18;
      } else if (direction === 'right') {
        ex1 = px + TILE_SIZE - 20;
        ex2 = px + TILE_SIZE - 13;
      }

      ctx.fillRect(ex1, ey, 2, 2);
      ctx.fillRect(ex2, ey, 2, 2);

      // Optional: draw active item held above head
      if (currentItem && currentItem.type !== 'tool' && currentItem.count > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(px + 2, py - 20, TILE_SIZE - 4, 14);
        ctx.strokeStyle = '#8b5a2b';
        ctx.strokeRect(px + 2, py - 20, TILE_SIZE - 4, 14);

        ctx.fillStyle = '#1e293b';
        ctx.font = '7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(currentItem.name, px + TILE_SIZE / 2, py - 10);
      }

      // Fishing Bobber floating marker rendering overlay
      if (fishingState === 'casting' || fishingState === 'waiting' || fishingState === 'bite') {
        let fx = tx + TILE_SIZE / 2;
        let fy = ty + TILE_SIZE / 2;

        ctx.fillStyle = '#ef4444'; // Red bobber
        ctx.beginPath();
        ctx.arc(fx, fy + Math.sin(Date.now() / 250) * 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff'; // White bottom
        ctx.beginPath();
        ctx.arc(fx, fy + 2 + Math.sin(Date.now() / 250) * 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Line to rod attachment
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + TILE_SIZE / 2, py + TILE_SIZE / 2);
        ctx.lineTo(fx, fy);
        ctx.stroke();

        // Warning Alarm sign popup for fish biting alerts
        if (fishingState === 'bite') {
          ctx.fillStyle = '#ef4444'; // Alarm signal text balloon
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py - 18, 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('!', px + TILE_SIZE / 2, py - 14);
        }
      }

      requestFrameId = requestAnimationFrame(renderMap);
    };

    renderMap();
    return () => cancelAnimationFrame(requestFrameId);
  }, [gameState, fishingState, isPlayerWalking]);

  // Translate raw in-game minute to digital human clock
  const getFormattedTime = (totalMinutes: number) => {
    const hrs24 = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    const ampm = hrs24 >= 12 ? 'PM' : 'AM';
    const hrs12 = hrs24 % 12 === 0 ? 12 : hrs24 % 12;

    const padMins = mins.toString().padStart(2, '0');
    return `${hrs12}:${padMins} ${ampm}`;
  };

  const getDayPhase = (totalMinutes: number) => {
    const hrs = totalMinutes / 60;
    if (hrs >= 6 && hrs < 11) return 'Pagi';
    if (hrs >= 11 && hrs < 15) return 'Siang';
    if (hrs >= 15 && hrs < 18) return 'Sore';
    return 'Malam';
  };

  // Reset core save file warning
  const handleResetGame = () => {
    if (window.confirm('Yakin ingin merestart? Semua progres lahan, persahabatan, dan koin akan dihapus kembali ke awal.')) {
      sounds.playAction('clear');
      localStorage.removeItem('lembah_hijau_rpg_state_v1');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#2c1d11] text-[#fcf8f2] flex flex-col font-sans selection:bg-[#c2410c] selection:text-white pb-8">
      
      {/* Dynamic Toast Alerts Container Overlay */}
      {activeNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#fde047] text-[#4a2f13] px-6 py-3 rounded-md border-3 border-[#8b5a2b] shadow-[4px_4px_0px_0px_#4a2f13] flex items-center gap-3 font-bold animate-bounce text-sm max-w-md text-center">
          <Sparkles className="w-5 h-5 shrink-0 text-[#c2410c]" />
          <span>{activeNotification}</span>
        </div>
      )}

      {/* Hero Header Strip bar */}
      <header className="bg-[#4a2f13] border-b-4 border-[#8b5a2b] py-3 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#55a630] border-2 border-[#fef08a] rounded-md flex items-center justify-center shadow-inner">
              <span className="text-xl font-bold text-[#fef08a] animate-pulse">🌾</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#fde047] drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
                Lembah Hijau
              </h1>
              <p className="text-xs text-[#dfd3c3] font-mono">16-Bit Cozy Indie RPG Simulator</p>
            </div>
          </div>

          {/* Time Calendar Information Grid */}
          <div className="flex flex-wrap items-center gap-3 bg-[#241306] px-4 py-2 rounded-lg border-2 border-[#8b5a2b]">
            <div className="flex items-center gap-1 text-[#fde047] font-bold font-mono">
              <Calendar className="w-4 h-4 text-[#ef4444]" />
              <span>HARI {gameState.day}</span>
            </div>
            <span className="text-stone-500">|</span>
            <div className="flex items-center gap-1 text-[#fbcfe8] font-semibold">
              <Layers className="w-4 h-4 text-pink-400" />
              <span>{gameState.season}</span>
            </div>
            <span className="text-stone-500">|</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono bg-stone-900/40 px-2 py-0.5 rounded">
              <Clock className="w-4 h-4" />
              <span>{getFormattedTime(gameState.timeMinutes)} ({getDayPhase(gameState.timeMinutes)})</span>
            </div>
          </div>

          {/* Money Wallet Display */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#fbbf24] text-[#4a2f13] px-4 py-1.5 rounded-full border-2 border-[#fff] font-extrabold shadow-md">
              <Coins className="w-5 h-5 shrink-0 text-[#9a3412]" />
              <span className="font-mono text-base">{gameState.gold} Gold</span>
            </div>

            {/* Muted and Tutorial Shortcuts */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMute}
                className="p-2 bg-[#8b5a2b] hover:bg-[#a16b3f] rounded-lg border-2 border-[#4a2f13] transition"
                title="Toggle Mute"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                onClick={() => setShowTutorial(true)}
                className="p-2 bg-[#8b5a2b] hover:bg-[#a16b3f] rounded-lg border-2 border-[#4a2f13] transition"
                title="Buka Petunjuk Manual"
              >
                <HelpCircle className="w-4 h-4 text-sky-300" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Secondary Main Content View grid */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: THE CANVAS VIEWER PORT & ON SCREEN CONTROLS */}
        <div className="lg:col-span-7 flex flex-col gap-4">

          {/* The Actual Canvas Playing Frame */}
          <div className={`p-2 rounded-xl relative overflow-hidden ${CARD_BG}`}>
            
            {/* Ambient Lighting Shade depending on Time of Day */}
            {getDayPhase(gameState.timeMinutes) === 'Malam' && (
              <div className="absolute inset-0 bg-[#121829]/30 mix-blend-multiply pointer-events-none rounded-lg" />
            )}
            {getDayPhase(gameState.timeMinutes) === 'Sore' && (
              <div className="absolute inset-0 bg-[#e27e2a]/15 mix-blend-color-burn pointer-events-none rounded-lg" />
            )}

            {/* Canvas Base container */}
            <div className="relative w-full aspect-[4/3] bg-emerald-950 rounded-lg border-2 border-[#4a2f13] overflow-hidden">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full h-full block image-render-pixelated bg-[#14532d]"
              />

              {/* FISHING MINIGAME INTERACTIVE OVERLAY */}
              {fishingState === 'minigame' && (
                <div id="fishing_overlay" className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className={`p-6 max-w-sm w-full text-center rounded-xl ${CARD_BG} ${TEXT_COZY}`}>
                    
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 bg-sky-200 border-2 border-[#8b5a2b] rounded-full flex items-center justify-center text-2xl animate-spin">
                        🐟
                      </div>
                    </div>
                    
                    <h3 className="font-extrabold text-lg uppercase tracking-wider text-[#b45309]">MINIGAME MEMANCING</h3>
                    <p className="text-xs mb-4">Pertahankan posisi pancingan (Hijau) tetap berada tepat di atas target ikan!</p>

                    {/* The Meter Track bar */}
                    <div className="h-10 bg-[#e2d4be] border-2 border-[#8b5a2b] rounded-md relative overflow-hidden mb-4">
                      
                      {/* Bouncy Target green slider player */}
                      <div
                        className="absolute h-full bg-emerald-400 opacity-75 border-x-2 border-emerald-600 transition-all duration-75"
                        style={{
                          left: `${fishSliderPlayer - 10}%`,
                          width: '20%'
                        }}
                      />

                      {/* Moving Red Target Fish Icon indicator */}
                      <div
                        className="absolute text-xl top-1 transition-all duration-150"
                        style={{ left: `${fishSliderTarget - 4}%` }}
                      >
                        🐟
                      </div>

                    </div>

                    {/* Progress Success level bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-xs font-mono font-bold mb-1">
                        <span>KEKUATAN TARIKAN (REEL) :</span>
                        <span>{fishingSuccessProgress}%</span>
                      </div>
                      <div className="h-4 bg-stone-300 rounded overflow-hidden border">
                        <div
                          className={`h-full transition-all duration-75 ${
                            fishingSuccessProgress > 60 ? 'bg-emerald-500' : fishingSuccessProgress > 30 ? 'bg-amber-400' : 'bg-rose-500'
                          }`}
                          style={{ width: `${fishingSuccessProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Push hold controller button */}
                    <div className="flex flex-col gap-2">
                      <button
                        onMouseDown={() => {
                          sounds.playTone(350, 0.05, 'triangle', 0.05);
                          setFishSliderPlayer((prev) => Math.max(10, prev - 12));
                        }}
                        onTouchStart={() => {
                          sounds.playTone(350, 0.05, 'triangle', 0.05);
                          setFishSliderPlayer((prev) => Math.max(10, prev - 12));
                        }}
                        className="py-3 px-4 bg-[#b45309] hover:bg-[#9a3412] text-white rounded font-bold uppercase tracking-wider text-xs border-b-4 border-[#78350f] active:border-b-0"
                      >
                        ◀ KIRI
                      </button>
                      <button
                        onMouseDown={() => {
                          sounds.playTone(450, 0.05, 'triangle', 0.05);
                          setFishSliderPlayer((prev) => Math.min(90, prev + 12));
                        }}
                        onTouchStart={() => {
                          sounds.playTone(450, 0.05, 'triangle', 0.05);
                          setFishSliderPlayer((prev) => Math.min(90, prev + 12));
                        }}
                        className="py-3 px-4 bg-[#10b981] hover:bg-[#059669] text-white rounded font-bold uppercase tracking-wider text-xs border-b-4 border-[#047857] active:border-b-0"
                      >
                        KANAN ▶
                      </button>
                    </div>

                    <button
                      onClick={() => setFishingState('idle')}
                      className="mt-4 text-xs font-bold text-rose-700 underline block mx-auto"
                    >
                      Batalkan / Lepas pancing
                    </button>
                  </div>
                </div>
              )}

              {/* FISH CAUGHT MODAL VIEWER */}
              {fishingState === 'caught' && (
                <div id="fish_success_overlay" className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className={`p-6 max-w-sm w-full text-center rounded-xl border-4 border-[#fbbf24] animate-bounce ${CARD_BG} ${TEXT_COZY}`}>
                    
                    <span className="text-5xl block mb-2">🏆</span>
                    <h3 className="font-extrabold text-xl text-[#b45309]">IKAN TERTANGKAP!</h3>
                    
                    <div className="my-4 p-3 bg-amber-50 rounded border border-[#8b5a2b]">
                      <span className="text-3xl block filter drop-shadow">🐟</span>
                      <p className="font-bold text-lg text-[#1e3a8a] mt-1">{caughtFishName}</p>
                      <p className="text-xs text-stone-600 italic">"Ikan segar Lembah Hijau ini telah berhasil didepositkan ke kantong belanjamu. Siti siap menukarnya dengan Gold berlimpah!"</p>
                    </div>

                    <button
                      onClick={() => {
                        sounds.playAction('click');
                        setFishingState('idle');
                        setCaughtFishName(null);
                      }}
                      className="w-full py-2 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded border-b-4 border-[#047857]"
                    >
                      Bagus! Masukkan Kantong
                    </button>
                  </div>
                </div>
              )}

              {/* CONVERSATION SPEECH DIALOG PANEL OVERLAY */}
              {activeDialog && (
                <div id="dialog_overlay" className="absolute bottom-2 left-2 right-2 bg-[#fcf8f2] border-3 border-[#8b5a2b] rounded-lg p-4 text-[#4a2f13] flex flex-col gap-3 shadow-lg z-20">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm px-2.5 py-0.5 bg-[#8b5a2b] text-[#fcf8f2] rounded-md">
                      💬 {gameState.npcs[activeDialog.npcId].name}
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">Tekan [SPASI] / Klik Tutup</span>
                  </div>
                  
                  <p className="font-semibold text-sm leading-relaxed min-h-[40px] text-stone-800">
                    {activeDialog.text}
                  </p>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    
                    {/* Gift Quick select Option overlay */}
                    {gameState.inventory.some((i) => i.type !== 'tool' && i.count > 0) && (
                      <div className="flex items-center gap-1 bg-[#fff] border p-1 rounded">
                        <span className="text-xs text-stone-500 font-bold px-1">Beri Kado:</span>
                        {gameState.inventory.map((item, idx) => {
                          if (item.type !== 'tool' && item.count > 0) {
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleGiftNPC(activeDialog.npcId, idx)}
                                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 border border-[#8b5a2b] text-[10px] font-bold rounded uppercase shrink-0"
                                title={`Sisa: ${item.count} buah`}
                              >
                                {item.name}
                              </button>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        sounds.playAction('click');
                        setActiveDialog(null);
                      }}
                      className="px-4 py-1.5 bg-[#ef4444] hover:bg-rose-600 text-white font-bold rounded text-xs"
                    >
                      Tutup Dialog
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* VIRTUAL ACCESS CONTROLLERS (FOR MOBILE & IFRAME ACCESSIBILITY) */}
          <div className={`p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 ${CARD_BG} ${TEXT_COZY}`}>
            
            {/* virtual Joystick panel */}
            <div className="flex flex-col items-center gap-0.5 shrink-0 bg-[#e2d4be] p-2 rounded-lg border">
              
              <div className="text-[10px] font-bold text-stone-600 uppercase mb-1">NAVIGASI SAKA</div>
              
              <button
                onClick={() => attemptPlayerMove(0, -1, 'up')}
                className="w-10 h-10 bg-[#8b5a2b] hover:bg-[#a16b3f] text-white rounded flex items-center justify-center border-b-4 border-[#4a2f13] active:border-b-0"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              
              <div className="flex gap-4">
                <button
                  onClick={() => attemptPlayerMove(-1, 0, 'left')}
                  className="w-10 h-10 bg-[#8b5a2b] hover:bg-[#a16b3f] text-white rounded flex items-center justify-center border-b-4 border-[#4a2f13] active:border-b-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-[#4a2f13] rounded-full flex items-center justify-center text-white font-bold text-[9px]">Saka</div>
                <button
                  onClick={() => attemptPlayerMove(1, 0, 'right')}
                  className="w-10 h-10 bg-[#8b5a2b] hover:bg-[#a16b3f] text-white rounded flex items-center justify-center border-b-4 border-[#4a2f13] active:border-b-0"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => attemptPlayerMove(0, 1, 'down')}
                className="w-10 h-10 bg-[#8b5a2b] hover:bg-[#a16b3f] text-white rounded flex items-center justify-center border-b-4 border-[#4a2f13] active:border-b-0"
              >
                <ArrowDown className="w-5 h-5" />
              </button>

            </div>

            {/* Core interaction controls buttons */}
            <div className="flex-1 w-full flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => performMainAction()}
                  className="w-full py-4 bg-[#c2410c] hover:bg-[#ea580c] text-white rounded-lg font-bold text-sm tracking-wide border-b-4 border-[#7c2d12] flex items-center justify-center gap-1"
                >
                  <Hand className="w-5 h-5" />
                  <span>ACTION / CARI / GUNAKAN ALAT [SPASI]</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    sounds.playAction('click');
                    setGameState((prev) => {
                      const next = (prev.selectedToolIdx + 1) % prev.inventory.length;
                      return { ...prev, selectedToolIdx: next };
                    });
                  }}
                  className="w-1/2 py-2 bg-stone-700 hover:bg-stone-600 text-stone-100 rounded text-xs font-bold"
                >
                  GANTI ALAT toolbar [TAB]
                </button>
                <button
                  onClick={handleResetGame}
                  className="w-1/2 py-2 bg-rose-950/20 hover:bg-rose-950/40 text-rose-800 rounded text-[10px] font-mono flex items-center justify-center gap-1 border border-rose-800/30"
                >
                  <RefreshCw className="w-3 h-3 text-rose-800" />
                  <span>RESET SELURUH SAVE</span>
                </button>
              </div>
              
              <div className="p-2 bg-[#f4ece1] rounded text-[11px] text-stone-600 leading-relaxed text-center font-semibold">
                💡 <span className="font-extrabold text-[#c2410c]">Keyboard Shortcuts:</span> Berjalan pake <strong>W, A, S, D</strong> atau <strong>Tombol Arah</strong>. Lakukan Aksi berkebun / memancing menggunakan tombol <strong>Spasi</strong> atau <strong>E</strong>.
              </div>
            </div>

          </div>

          {/* SAKA FLOATING DELUXE 5-SLOT HOTBAR VIEW PANEL */}
          <div className={`p-4 rounded-xl ${CARD_BG}`}>
            <h4 className={`text-xs font-extrabold uppercase mb-2 text-center tracking-wider text-amber-900 ${TEXT_COZY}`}>
              Hotbar Utama (Pilih item: Tekan Tombol Angka 1-5 Pintasan)
            </h4>
            <div className="grid grid-cols-5 gap-3 max-w-sm mx-auto">
              {[0, 1, 2, 3, 4].map((index) => {
                const item = gameState.inventory[index];
                const isActive = gameState.selectedToolIdx === index;
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (item) {
                        sounds.playAction('click');
                        setGameState((prev) => ({ ...prev, selectedToolIdx: index }));
                      }
                    }}
                    disabled={!item}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition relative border-3 ${
                      !item
                        ? 'bg-stone-200/40 border-dashed border-stone-300 pointer-events-none'
                        : isActive
                        ? 'bg-[#fef08a] border-[#c2410c] shadow-[3px_3px_0px_0px_#7c2d12] scale-105'
                        : 'bg-white hover:bg-stone-50 border-[#8b5a2b] shadow-[2px_2px_0px_0px_#4a2f13]'
                    }`}
                  >
                    {/* Hotkey Number Badge Indicator */}
                    <span className="absolute top-1 left-1.5 text-[9px] font-mono font-black text-[#8b5a2b]">
                      {index + 1}
                    </span>

                    {item ? (
                      <>
                        {/* Count Multiplier bubble badge */}
                        {item.count > 0 && item.type !== 'tool' && (
                          <span className="absolute bottom-1 right-1 bg-rose-600 text-white text-[9px] font-mono font-black h-4 min-w-[16px] px-0.5 rounded-full flex items-center justify-center">
                            {item.count}
                          </span>
                        )}

                        {/* Pixel Art Stylized Emojis representation */}
                        <span className="text-xl select-none mt-1">
                          {item.id === 'hoe' && '⛏️'}
                          {item.id === 'water_can' && '💧'}
                          {item.id === 'fishing_rod' && '🎣'}
                          {item.id === 'scythe' && '🪓'}
                          {item.id.startsWith('seed_') && '🌱'}
                          {item.id === 'tomat' && '🍅'}
                          {item.id === 'wortel' && '🥕'}
                          {item.id === 'lobak' && '🥬'}
                          {item.id === 'labu' && '🎃'}
                          {item.id === 'wildflower' && '🌸'}
                          {item.id === 'wood' && '🪵'}
                          {item.id === 'stone' && '🪨'}
                          {item.id === 'fiber' && '🌾'}
                          {item.id.startsWith('fish_') && '🐟'}
                        </span>

                        <span className="text-[9px] font-extrabold text-stone-700 text-center truncate w-full mt-1 leading-none">
                          {item.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] text-stone-400 font-bold uppercase italic mt-1 font-mono">KOSONG</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: DIRECTORY OF TABS, SHOPS, QUESTS & BIOGRAPHIES */}
        <div className="lg:col-span-5 flex flex-col gap-4">

          {/* Quick Tab Header selection */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#4a2f13] rounded-lg border-2 border-[#8b5a2b]">
            {[
              { id: 'inventory', icon: ShoppingBag, label: 'Tas' },
              { id: 'shop', icon: Layers, label: 'Toko' },
              { id: 'social', icon: Users, label: 'Hub' },
              { id: 'quests', icon: Award, label: 'Misi' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sounds.playAction('click');
                    setActiveTab(tab.id as any);
                  }}
                  className={`py-2 px-1 rounded-md flex flex-col items-center gap-1 transition-all ${
                    isSelected ? 'bg-[#fcf8f2] text-[#4a2f13] font-bold shadow' : 'text-[#dfd3c3] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] uppercase font-bold">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT SCREEN: INVENTORY DETAILS */}
          {activeTab === 'inventory' && (
            <div className={`p-5 rounded-xl flex-grow flex flex-col h-full justify-between flex-1 ${CARD_BG} ${TEXT_COZY}`}>
              <div>
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="font-extrabold text-lg flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#c2410c]" />
                    <span>KANTONG BELANJA SAKA</span>
                  </h3>
                  <span className="text-xs font-mono bg-[#8b5a2b] text-white px-2 py-0.5 rounded-full font-bold">
                    {gameState.inventory.length} Jenis Barang
                  </span>
                </div>

                {/* Grid listing */}
                <div className="grid grid-cols-1 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {gameState.inventory.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => setGameState((prev) => ({ ...prev, selectedToolIdx: index }))}
                      className={`p-3 rounded-lg border-2 flex items-center justify-between transition cursor-pointer ${
                        gameState.selectedToolIdx === index
                          ? 'bg-[#fffbeb] border-[#c2410c]'
                          : 'bg-[#fff] border-transparent hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center border text-2xl">
                          {item.id === 'hoe' && '⛏️'}
                          {item.id === 'water_can' && '💧'}
                          {item.id === 'fishing_rod' && '🎣'}
                          {item.id === 'scythe' && '🪓'}
                          {item.id.startsWith('seed_') && '🌱'}
                          {item.id === 'tomat' && '🍅'}
                          {item.id === 'wortel' && '🥕'}
                          {item.id === 'lobak' && '🥬'}
                          {item.id === 'labu' && '🎃'}
                          {item.id === 'wildflower' && '🌸'}
                          {item.id === 'wood' && '🪵'}
                          {item.id === 'stone' && '🪨'}
                          {item.id.startsWith('fish_') && '🐟'}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#1e293b] flex items-center gap-2">
                            <span>{item.name}</span>
                            {item.count > 0 && item.type !== 'tool' && (
                              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-extrabold">
                                {item.count} buah
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-stone-500 font-medium mt-0.5">{item.description}</p>
                        </div>
                      </div>

                      {/* Sell Options button if it isn't tool item */}
                      {item.type !== 'tool' && item.count > 0 && (
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSellItem(index);
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-[#4a2f13] font-bold rounded-md text-[10px] border-b-2 border-amber-700 active:border-b-0"
                          >
                            Jual Keseluruhan: <span className="font-mono">{item.value * item.count}g</span>
                          </button>
                          <span className="text-[9px] font-bold text-stone-400">Harga Satuan: {item.value}g</span>
                        </div>
                      )}

                      {item.id === 'water_can' && (
                        <div className="shrink-0 text-right">
                          <span className="text-xs font-mono font-bold text-sky-600 block">Sisa Air: {wateringCapacity}/5</span>
                          <span className="text-[9px] text-stone-400">Gunakan di Danau untuk isi air</span>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              </div>

              {/* Selection footer warning logs */}
              <div className="mt-4 p-3 bg-stone-100 rounded-lg text-xs leading-relaxed text-stone-600 border border-stone-200">
                <p className="font-bold text-[#c2410c]">Status Toolbar:</p>
                <p>Saat Anda mendekati spot interaktif di peta, item aktif yang saat ini Anda pilih (disorot warna emas) akan digunakan secara otomatis saat Anda menekan tombol Aksi.</p>
              </div>

            </div>
          )}

          {/* TAB CONTENT SCREEN: SHOP & SEEDS DEALER (SITI) */}
          {activeTab === 'shop' && (
            <div className={`p-5 rounded-xl flex-grow flex flex-col justify-between flex-1 ${CARD_BG} ${TEXT_COZY}`}>
              <div>
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="font-extrabold text-lg flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-pink-500" />
                    <span>TOKO BENIH KOTA (SITI)</span>
                  </h3>
                  <span className="text-xs text-stone-500 font-bold">Waktu Buka: 06:00 - 22:00</span>
                </div>

                <div className="p-3 bg-pink-50 rounded-lg border border-pink-200 mb-4 flex gap-3 items-center">
                  <div className="w-10 h-10 bg-[#ec4899] rounded-full flex items-center justify-center text-xl shrink-0">👩</div>
                  <p className="text-xs text-[#9d174d] leading-relaxed">
                    <strong>Siti:</strong> "Selamat datang kembali Saka! Silakan pilih benih sayuran premium hasil riset penangkaran lokal Lembah Hijau. Semua siap tanam!"
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-[290px] overflow-y-auto pr-1">
                  {Object.values(CROPS).map((crop) => (
                    <div key={crop.id} className="p-3 rounded-lg bg-[#fff] border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">🌱</span>
                        <div>
                          <h4 className="font-bold text-sm text-[#1e293b]">{crop.seedName}</h4>
                          <p className="text-xs text-stone-500 font-medium">
                            Lama Tumbuh: <span className="text-emerald-600 font-bold">{crop.growthDays} Hari</span> | Panen: {crop.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBuySeed(crop.id)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-lg text-xs border-b-2 border-emerald-700 uppercase"
                        >
                          Beli 1x ({crop.seedPrice}g)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wallet checking footer */}
              <div className="mt-4 p-3 bg-amber-50 rounded border border-amber-200 flex items-center justify-between text-xs">
                <span className="font-bold text-[#b45309]">Sisa Saldo Emas Anda:</span>
                <span className="font-mono font-black text-emerald-700 bg-white px-2.5 py-1 rounded text-sm">{gameState.gold} GOLD</span>
              </div>

            </div>
          )}

          {/* TAB CONTENT SCREEN: TOWNSFOLK SOCIAL DIARY */}
          {activeTab === 'social' && (
            <div className={`p-5 rounded-xl flex-grow flex flex-col justify-between flex-1 ${CARD_BG} ${TEXT_COZY}`}>
              <div>
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="font-extrabold text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    <span>DIARI HUBUNGAN SOSIAL</span>
                  </h3>
                  <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold">
                    {Object.keys(gameState.npcs).length} Tokoh Warga
                  </span>
                </div>

                {/* NPCs heart status listings */}
                <div className="grid grid-cols-1 gap-4 max-h-[350px] overflow-y-auto pr-1">
                  {(Object.values(gameState.npcs) as NPC[]).map((npc) => {
                    const heartCount = Math.floor(npc.friendship / 20); // 5 hearts max
                    return (
                      <div key={npc.id} className="p-4 rounded-lg bg-[#fff] border flex flex-col gap-2">
                        
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center border-2 text-white font-bold"
                              style={{ backgroundColor: npc.avatarColor, borderColor: '#4a2f13' }}
                            >
                              {npc.id === 'budi' && '👴'}
                              {npc.id === 'siti' && '👩'}
                              {npc.id === 'agus' && '⚓'}
                              {npc.id === 'dewi' && '🎨'}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-[#111827] flex items-center gap-1.5">
                                <span>{npc.name}</span>
                                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-md text-stone-500 font-bold">{npc.role}</span>
                              </h4>
                              <p className="text-[10px] text-stone-500 mt-0.5 italic">"{npc.personality}"</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-bold block text-emerald-600">Skor: {npc.friendship}/100</span>
                          </div>
                        </div>

                        {/* Hearts rating system displays */}
                        <div className="flex items-center justify-between border-t border-dashed pt-2.5">
                          <div className="flex gap-1.5 text-stone-300">
                            {[1, 2, 3, 4, 5].map((heartIndex) => (
                              <span
                                key={heartIndex}
                                className={`text-sm transition-all ${
                                  heartIndex <= heartCount ? 'text-rose-500 scale-110 drop-shadow' : 'opacity-25'
                                }`}
                              >
                                ❤️
                              </span>
                            ))}
                          </div>

                          {/* Talk and Gift Indicators for today */}
                          <div className="flex gap-1.5 text-[9px] font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-md ${
                                npc.hasTalkedToday ? 'bg-emerald-100 text-[#0f5132]' : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              {npc.hasTalkedToday ? '✓ Disapa' : 'Sapa Hari Ini'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md ${
                                npc.hasGiftedToday ? 'bg-pink-100 text-[#842029]' : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              {npc.hasGiftedToday ? '🎁 Kado Terkirim' : 'Kirim Kado'}
                            </span>
                          </div>
                        </div>

                        {/* Favorite hints references */}
                        <div className="text-[10px] text-stone-500 flex flex-wrap gap-1 items-center bg-stone-50 p-1.5 rounded">
                          <span className="font-extrabold text-stone-700">Makanan Favorit:</span>
                          {npc.favoriteItems.map((f, i) => (
                            <span key={i} className="bg-orange-100 text-orange-850 px-1 py-0.5 rounded font-black">
                              {f}
                            </span>
                          ))}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* social advice footer comments */}
              <div className="mt-4 p-3 bg-stone-100 text-[11px] text-stone-550 rounded border">
                ✍️ Berbincanglah secara langsung dengan berdiri dihadapan warga kota dan tekan tombol aksi untuk menceritakan kisah Lembah Hijau ini. Berilah kado kesayangan mereka di layar dialog agar persahabatan meningkat cepat!
              </div>

            </div>
          )}

          {/* TAB CONTENT SCREEN: QUEST JOURNAL LOG */}
          {activeTab === 'quests' && (
            <div className={`p-5 rounded-xl flex-grow flex flex-col justify-between flex-1 ${CARD_BG} ${TEXT_COZY}`}>
              <div>
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="font-extrabold text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>JURNAL MISI HARIAN</span>
                  </h3>
                  <span className="text-xs bg-amber-500 text-stone-900 px-2.5 py-0.5 rounded-full font-bold">
                    Diselesaikan: {gameState.completedQuestsCount} Misi
                  </span>
                </div>

                {gameState.activeQuest ? (
                  <div className="p-4 rounded-lg bg-[#fff] border-2 border-dashed border-[#8b5a2b] flex flex-col gap-3 relative overflow-hidden">
                    
                    {/* completed ribbons decorations */}
                    {gameState.activeQuest.completed && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white font-extrabold text-[9px] uppercase px-2 py-1 rotate-3 rounded border">
                        SIAP KLAIM!
                      </div>
                    )}

                    <div>
                      <h4 className="font-extrabold text-base text-[#1e293b] flex items-center gap-2">
                        <span>🎯 {gameState.activeQuest.title}</span>
                      </h4>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        {gameState.activeQuest.description}
                      </p>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-lg border text-[11px] leading-relaxed flex flex-col gap-1.5 text-stone-700">
                      <div>
                        <strong>Target Penerima:</strong> {gameState.npcs[gameState.activeQuest.targetNPC].name} ({gameState.npcs[gameState.activeQuest.targetNPC].role})
                      </div>
                      <div>
                        <strong>Item yang Dibutuhkan:</strong> {gameState.activeQuest.requiredCount}x {gameState.activeQuest.requiredItem}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <span className="font-black text-amber-800 uppercase text-[10px]">Hadiah Gold:</span>
                        <span className="font-mono font-bold bg-[#fff] px-2 py-0.5 border text-emerald-700 rounded-md">+{gameState.activeQuest.rewardGold}g</span>
                      </div>
                    </div>

                    {/* claim action button */}
                    <button
                      disabled={!gameState.activeQuest.completed}
                      onClick={handleClaimQuestReward}
                      className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider border-b-4 flex items-center justify-center gap-1.5 transition ${
                        gameState.activeQuest.completed
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-700 active:border-b-0 cursor-pointer shadow-md'
                          : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>KLAIM SELESAIKAN MISI (AMBIL GOLD)</span>
                    </button>

                  </div>
                ) : (
                  <div className="p-8 text-center bg-stone-50 border-2 border-dashed rounded-lg">
                    <span className="text-4xl block mb-2">🏆</span>
                    <p className="font-bold text-stone-500">Hebat! Semua Misi Hari Ini Telah Selesai.</p>
                    <p className="text-xs text-stone-400 mt-1 italic">Tunggu hari berganti di tengah malam untuk update jurnal misi selanjutnya!</p>
                  </div>
                )}
              </div>

              {/* general information tips block */}
              <div className="mt-4 p-3 bg-stone-100 rounded-lg text-xs leading-relaxed text-stone-550 border">
                🐾 Jurnal misi akan berubah ke tantangan baru jika misi aktif saat ini telah berhasil diselesaikan secara sempurna dan diklaim gold hadiahnya.
              </div>

            </div>
          )}

        </div>

      </main>

      {/* DETAILED GAME TUTORIAL DIALOG MANUAL OVERLAY POPUP */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`p-6 md:p-8 max-w-2xl w-full rounded-2xl border-4 border-[#8b5a2b] shadow-2xl relative max-h-[90vh] overflow-y-auto ${CARD_BG} ${TEXT_COZY}`}>
            
            <button
              onClick={() => {
                sounds.init(); // Warm Audio contextual state
                sounds.playAction('click');
                setShowTutorial(false);
              }}
              className="absolute top-4 right-4 text-xs font-black uppercase text-rose-800 bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-md border border-[#8b5a2b]"
            >
              TUTUP MANUAL & MULAI MAIN (MULAI)
            </button>

            <span className="text-5xl block text-center mb-1">🎮</span>
            <h2 className="text-2xl font-black text-center text-[#c2410c] tracking-tight uppercase">
              Petunjuk Bermain Lembah Hijau
            </h2>
            <p className="text-xs text-stone-605 text-center italic mt-1 pb-4 border-b">
              "Selamat datang Saka di Lembah Hijau. Berdirilah tegak, pimpin petualangan bertani dan bersosialisasi yang damai!"
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              
              <div className="bg-[#fff] p-4 rounded-xl border flex flex-col gap-2">
                <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-[#b45309]">
                  <span>⛏️</span>
                  <span>1. AKSI BERKEBUN & PERTANIAN</span>
                </h3>
                <ul className="text-xs text-stone-600 flex flex-col gap-1.5 list-disc pl-4 leading-relaxed">
                  <li><strong>Cangkul Tanah:</strong> Dekati rumput bebas, pilih <strong>Cangkul</strong> di toolbar dan tekan tombol <strong>Aksi [SPASI]</strong>.</li>
                  <li><strong>Tanam Benih:</strong> Beli benih sayur di Toko Siti, sorot benih aktif di toolbar, dekap tanah cangkul lalu tanam.</li>
                  <li><strong>Siram Air:</strong> Gunakan <strong>Penyiram</strong> pada tanah subur. Jika wadah kosong, isi ulang ditepi Danau biru.</li>
                  <li><strong>Panen:</strong> Saat tengah malam berganti hari, tanaman akan tumbuh dewasa. Dekati lalu ambil dengan tangan kosong!</li>
                </ul>
              </div>

              <div className="bg-[#fff] p-4 rounded-xl border flex flex-col gap-2">
                <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-blue-600">
                  <span>🎣</span>
                  <span>2. AKSI MEMANCING DANAU</span>
                </h3>
                <ul className="text-xs text-stone-600 flex flex-col gap-1.5 list-disc pl-4 leading-relaxed">
                  <li>Pilih joran <strong>Alat Pancing</strong> di toolbar bawah.</li>
                  <li>Menghadaplah langsung ke arah air biru jernih danau di sebelah selatan peta, kemudian tekan tombol <strong>Aksi [SPASI]</strong>.</li>
                  <li>Tunggu dengan sabar tanda seru <strong>"!"</strong> alarm berbunyi.</li>
                  <li>Segera tekan <strong>Spasi</strong> untuk mulai bermain minigame.</li>
                  <li>Tekan tombol KIRI/KANAN di layar minigame agar bar hijau terus mengekor di atas ikan hingga bar penuh!</li>
                </ul>
              </div>

              <div className="bg-[#fff] p-4 rounded-xl border flex flex-col gap-2">
                <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-[#ec4899]">
                  <span>💬</span>
                  <span>3. HUBUNGAN SOSIAL & NPC</span>
                </h3>
                <ul className="text-xs text-stone-600 flex flex-col gap-1.5 list-disc pl-4 leading-relaxed">
                  <li>Dekati penduduk dan arahkan wajah Anda ke depan mereka, kemudian tekan tombol <strong>Aksi [SPASI]</strong>.</li>
                  <li>Beri hadiah berupa sayur segar, buah berry, bunga liar, atau ikan kepada mereka lewat tombol hadiah di bawah dialog.</li>
                  <li>Ketahui kesukaan mereka! Pak Budi menyukai Wortel, Kak Agus menyukai Ikan Mas, dan Siti menyukai Bunga/Labu.</li>
                </ul>
              </div>

              <div className="bg-[#fff] p-4 rounded-xl border flex flex-col gap-2">
                <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-emerald-600">
                  <span>💰</span>
                  <span>4. TOKO BENIH & KLAIM MISI</span>
                </h3>
                <ul className="text-xs text-stone-600 flex flex-col gap-1.5 list-disc pl-4 leading-relaxed">
                  <li>Tab <strong>Toko</strong> aktif otomatis saat kamu menyapa Siti atau bisa diakses manual sepuasnya kapanpun.</li>
                  <li>Jual hasil pertanian atau pancingan langsung di tab <strong>Tas</strong> untuk mendapatkan Gold melimpah.</li>
                  <li>Buka Tab <strong>Misi</strong> untuk melihat target jurnal harian, dan klaim bonus reward emas Anda segera setelah selesai!</li>
                </ul>
              </div>

            </div>

            {/* Tutorial quick starting buttons */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => {
                  sounds.init();
                  sounds.playAction('morning');
                  setShowTutorial(false);
                }}
                className="py-3.5 px-12 bg-emerald-600 hover:bg-emerald-700 text-[#fff] font-black tracking-wide uppercase text-sm rounded-lg border-b-4 border-emerald-850 shadow-md transform hover:scale-105 transition"
              >
                MASUK KE LEMBAH HIJAU & MULAI PETUALANGAN! 🚀
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer credits bar */}
      <footer className="mt-8 text-center text-xs text-[#8b5a2b] font-mono leading-relaxed max-w-2xl mx-auto px-4">
        <p className="font-bold">Lembah Hijau RPG © 2026. Made with ❤️ for AI Studio.</p>
        <p className="mt-1">Built using HTML5 Canvas rendering & dynamic Audio Wave Synthesizer. Enjoy the farming and fishing adventure!</p>
      </footer>

    </div>
  );
}
