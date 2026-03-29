// ============================================
// FLAPPY WATCH STORE
// Game coins and badge shop
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// GAME BADGE TYPES
// ============================================
export interface GameBadge {
  id: string;
  name: string;
  description: string;
  image: string;
  cost: number;
}

export interface UserGameBadge {
  badgeId: string;
  purchasedAt: string;
}

interface FlappyState {
  coins: number;
  userBadges: UserGameBadge[];
  
  // Actions
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  purchaseBadge: (badgeId: string) => { success: boolean; error?: string };
  hasBadge: (badgeId: string) => boolean;
  getPurchasedBadges: () => string[];
}

// ============================================
// AVAILABLE BADGES IN SHOP
// ============================================
export const AVAILABLE_BADGES: GameBadge[] = [
  {
    id: 'yawn',
    name: 'Sleepy',
    description: 'For when you need a nap',
    image: '/badges/yawn.png',
    cost: 10,
  },
  {
    id: 'sheep',
    name: 'Sheep',
    description: 'Counting sheep...',
    image: '/badges/sheep.png',
    cost: 100,
  },
  {
    id: 'gaming-controller',
    name: 'Gamer',
    description: 'For the gaming enthusiasts',
    image: '/badges/gaming-controller.png',
    cost: 1000,
  },
  {
    id: 'gold-coin',
    name: 'Coin Collector',
    description: 'A shiny gold coin badge',
    image: '/badges/gold-coin.png',
    cost: 500,
  },
  {
    id: 'funny-dog',
    name: 'Dog Lover',
    description: 'Man\'s best friend badge',
    image: '/badges/funny-dog.png',
    cost: 5000,
  },
  {
    id: 'black-cat',
    name: 'Cat Person',
    description: 'For the feline enthusiasts',
    image: '/badges/black-cat.png',
    cost: 10000,
  },
  {
    id: 'rolex-datejust',
    name: 'Datejust',
    description: 'The classic Rolex Datejust',
    image: '/badges/rolex-datejust.png',
    cost: 8000,
  },
  {
    id: 'rolex-submariner',
    name: 'Submariner',
    description: 'The legendary dive watch',
    image: '/badges/rolex-submariner.png',
    cost: 12000,
  },
  {
    id: 'rolex-daytona',
    name: 'Daytona',
    description: 'The iconic chronograph',
    image: '/badges/rolex-daytona.png',
    cost: 20000,
  },
  {
    id: 'gold-cup',
    name: 'Champion',
    description: 'The ultimate achievement badge',
    image: '/badges/gold-cup.png',
    cost: 100000,
  },
];

export const useFlappyStore = create<FlappyState>()(
  persist(
    (set, get) => ({
      coins: 0,
      userBadges: [],

      // ============================================
      // ADD COINS (when collecting in game)
      // ============================================
      addCoins: (amount) => {
        set(state => ({ coins: state.coins + amount }));
      },

      // ============================================
      // SPEND COINS
      // ============================================
      spendCoins: (amount) => {
        const { coins } = get();
        if (coins >= amount) {
          set({ coins: coins - amount });
          return true;
        }
        return false;
      },

      // ============================================
      // PURCHASE BADGE
      // ============================================
      purchaseBadge: (badgeId) => {
        const { coins, spendCoins, hasBadge } = get();
        
        // Check if already owned
        if (hasBadge(badgeId)) {
          return { success: false, error: 'You already own this badge' };
        }
        
        // Find badge
        const badge = AVAILABLE_BADGES.find(b => b.id === badgeId);
        if (!badge) {
          return { success: false, error: 'Badge not found' };
        }
        
        // Check if enough coins
        if (coins < badge.cost) {
          return { success: false, error: `Not enough coins. You need ${badge.cost.toLocaleString()} coins.` };
        }
        
        // Purchase
        if (spendCoins(badge.cost)) {
          const newBadge: UserGameBadge = {
            badgeId,
            purchasedAt: new Date().toISOString(),
          };
          set(state => ({ userBadges: [...state.userBadges, newBadge] }));
          return { success: true };
        }
        
        return { success: false, error: 'Purchase failed' };
      },

      // ============================================
      // CHECK IF USER HAS BADGE
      // ============================================
      hasBadge: (badgeId) => {
        return get().userBadges.some(b => b.badgeId === badgeId);
      },

      // ============================================
      // GET PURCHASED BADGE IDs
      // ============================================
      getPurchasedBadges: () => {
        return get().userBadges.map(b => b.badgeId);
      },
    }),
    {
      name: 'flappy-store',
    }
  )
);

export default useFlappyStore;
