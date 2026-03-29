// ============================================
// FLAPPY WATCH GAME
// Frame-rate independent gameplay with coins, sound, and badge shop
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useFlappyStore, AVAILABLE_BADGES } from '@/stores/flappyStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Trophy, RotateCcw, Play, Crown, Coins, ShoppingCart, Lock, Check } from 'lucide-react';

// ============================================
// GAME CONSTANTS
// ============================================
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const WATCH_SIZE = 45;
const PIPE_WIDTH = 70;
const PIPE_GAP = 170;
const COIN_SIZE = 30;

// Physics
const GRAVITY = 0.4;
const JUMP_FORCE = -6.5;
const PIPE_SPEED = 2.5;
const MAX_FALL_SPEED = 8;

// ============================================
// SOUND EFFECTS - Enhanced with better quality
// ============================================
class SoundManager {
  private enabled = true;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  enable() {
    this.enabled = true;
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  disable() {
    this.enabled = false;
  }

  // Jump sound - pleasant upward sweep
  playJump() {
    if (!this.enabled || !this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.15);
  }

  // Coin sound - satisfying "ching" with harmonics
  playCoin() {
    if (!this.enabled || !this.audioContext) return;
    
    // Main chime
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(this.audioContext.destination);
    
    osc1.frequency.setValueAtTime(1200, this.audioContext.currentTime);
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    osc1.start(this.audioContext.currentTime);
    osc1.stop(this.audioContext.currentTime + 0.2);
    
    // Harmonic layer
    setTimeout(() => {
      if (!this.audioContext) return;
      const osc2 = this.audioContext.createOscillator();
      const gain2 = this.audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(this.audioContext.destination);
      
      osc2.frequency.setValueAtTime(1800, this.audioContext.currentTime);
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
      
      osc2.start(this.audioContext.currentTime);
      osc2.stop(this.audioContext.currentTime + 0.15);
    }, 30);
  }

  // Pipe pass sound - quick "ding" chime
  playPipePass() {
    if (!this.enabled || !this.audioContext) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.frequency.setValueAtTime(880, this.audioContext.currentTime);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.25, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.1);
  }

  // Diamond collection - special high-value sound
  playDiamond() {
    if (!this.enabled || !this.audioContext) return;
    
    // Ascending arpeggio
    [800, 1000, 1200, 1600].forEach((freq, i) => {
      setTimeout(() => {
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.3);
      }, i * 60);
    });
  }

  // Die sound - descending tone
  playDie() {
    if (!this.enabled || !this.audioContext) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.4);
    osc.type = 'sawtooth';
    
    gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.4);
  }
}

const soundManager = new SoundManager();

// ============================================
// WATCH MODELS
// ============================================
type WatchModel = 'rolex' | 'omega' | 'patek' | 'ap' | 'cartier';

interface WatchStyle {
  name: string;
  caseColor: string;
  faceColor: string;
  markerColor: string;
  bandColor: string;
  accentColor: string;
}

const WATCH_STYLES: Record<WatchModel, WatchStyle> = {
  rolex: {
    name: 'Rolex Submariner',
    caseColor: '#FFD700',
    faceColor: '#006400',
    markerColor: '#FFD700',
    bandColor: '#D4AF37',
    accentColor: '#FFD700',
  },
  omega: {
    name: 'Omega Speedmaster',
    caseColor: '#C0C0C0',
    faceColor: '#1a1a1a',
    markerColor: '#FFFFFF',
    bandColor: '#808080',
    accentColor: '#FF4500',
  },
  patek: {
    name: 'Patek Philippe',
    caseColor: '#FFD700',
    faceColor: '#F5F5DC',
    markerColor: '#000000',
    bandColor: '#8B4513',
    accentColor: '#FFD700',
  },
  ap: {
    name: 'Audemars Piguet',
    caseColor: '#C0C0C0',
    faceColor: '#000080',
    markerColor: '#FFFFFF',
    bandColor: '#000000',
    accentColor: '#C0C0C0',
  },
  cartier: {
    name: 'Cartier Tank',
    caseColor: '#FFD700',
    faceColor: '#FFFFFF',
    markerColor: '#000000',
    bandColor: '#8B4513',
    accentColor: '#0000FF',
  },
};

// ============================================
// COIN COMPONENT
// ============================================
const Coin: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  return (
    <div
      className="absolute"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${COIN_SIZE}px`,
        height: `${COIN_SIZE}px`,
        zIndex: 5,
      }}
    >
      <svg viewBox="0 0 40 40" className="w-full h-full animate-pulse">
        <circle cx="20" cy="20" r="18" fill="#FFD700" stroke="#B8860B" strokeWidth="2" />
        <circle cx="20" cy="20" r="14" fill="#FFA500" />
        <text x="20" y="26" textAnchor="middle" fill="#8B4513" fontSize="18" fontWeight="bold">$</text>
      </svg>
    </div>
  );
};

// ============================================
// DIAMOND COMPONENT - Worth 50 coins!
// ============================================
const DIAMOND_SIZE = 35;
const Diamond: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  return (
    <div
      className="absolute"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${DIAMOND_SIZE}px`,
        height: `${DIAMOND_SIZE}px`,
        zIndex: 6,
        animation: 'spin 2s linear infinite',
      }}
    >
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <defs>
          <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0F7FA" />
            <stop offset="50%" stopColor="#00BCD4" />
            <stop offset="100%" stopColor="#006064" />
          </linearGradient>
        </defs>
        {/* Diamond shape */}
        <polygon 
          points="20,2 38,20 20,38 2,20" 
          fill="url(#diamondGrad)" 
          stroke="#00ACC1" 
          strokeWidth="1"
        />
        {/* Inner sparkle */}
        <polygon 
          points="20,8 32,20 20,32 8,20" 
          fill="rgba(255,255,255,0.4)" 
        />
        {/* Sparkle lines */}
        <line x1="20" y1="2" x2="20" y2="10" stroke="white" strokeWidth="1" />
        <line x1="20" y1="30" x2="20" y2="38" stroke="white" strokeWidth="1" />
        <line x1="2" y1="20" x2="10" y2="20" stroke="white" strokeWidth="1" />
        <line x1="30" y1="20" x2="38" y2="20" stroke="white" strokeWidth="1" />
      </svg>
    </div>
  );
};

// ============================================
// WATCH COMPONENT
// ============================================
const Watch: React.FC<{ y: number; rotation: number; model: WatchModel }> = ({ 
  y, 
  rotation, 
  model 
}) => {
  const style = WATCH_STYLES[model];
  
  return (
    <div
      className="absolute"
      style={{
        left: '80px',
        top: `${y}px`,
        width: `${WATCH_SIZE}px`,
        height: `${WATCH_SIZE}px`,
        transform: `rotate(${rotation}deg)`,
        zIndex: 10,
        transition: 'none',
      }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <rect x="38" y="0" width="24" height="18" fill={style.bandColor} />
        <rect x="38" y="82" width="24" height="18" fill={style.bandColor} />
        <circle cx="50" cy="50" r="32" fill={style.caseColor} stroke="#333" strokeWidth="2" />
        <circle cx="50" cy="50" r="26" fill={style.faceColor} stroke={style.caseColor} strokeWidth="2" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 50 + 20 * Math.cos(rad);
          const y1 = 50 + 20 * Math.sin(rad);
          const x2 = 50 + 23 * Math.cos(rad);
          const y2 = 50 + 23 * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={style.markerColor} strokeWidth="2" />;
        })}
        <text x="50" y="32" textAnchor="middle" fill={style.accentColor} fontSize="8" fontWeight="bold">♛</text>
        <line x1="50" y1="50" x2="50" y2="34" stroke={style.markerColor} strokeWidth="2" strokeLinecap="round"/>
        <line x1="50" y1="50" x2="60" y2="50" stroke={style.markerColor} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="50" cy="50" r="3" fill={style.accentColor} />
        <rect x="65" y="44" width="10" height="8" fill="white" stroke="#ccc" strokeWidth="0.5" />
        <text x="70" y="50" textAnchor="middle" fill="black" fontSize="6">28</text>
      </svg>
    </div>
  );
};

// ============================================
// PIPE COMPONENT
// ============================================
const Pipe: React.FC<{ x: number; topHeight: number; gap: number }> = ({ x, topHeight, gap }) => {
  return (
    <>
      <div
        className="absolute bg-gradient-to-b from-green-700 to-green-900 border-2 border-green-950"
        style={{ left: `${x}px`, top: 0, width: `${PIPE_WIDTH}px`, height: `${topHeight}px` }}
      >
        <div 
          className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-b from-green-600 to-green-800 border-t-2 border-green-950"
          style={{ width: `${PIPE_WIDTH + 10}px`, marginLeft: '-5px' }}
        />
      </div>
      <div
        className="absolute bg-gradient-to-b from-green-900 to-green-700 border-2 border-green-950"
        style={{ left: `${x}px`, top: `${topHeight + gap}px`, width: `${PIPE_WIDTH}px`, height: `${GAME_HEIGHT - topHeight - gap}px` }}
      >
        <div 
          className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-green-800 to-green-600 border-b-2 border-green-950"
          style={{ width: `${PIPE_WIDTH + 10}px`, marginLeft: '-5px' }}
        />
      </div>
    </>
  );
};

// ============================================
// BADGE SHOP COMPONENT
// ============================================
const BadgeShop: React.FC = () => {
  const { coins, purchaseBadge, hasBadge } = useFlappyStore();
  const [purchaseStatus, setPurchaseStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handlePurchase = (badgeId: string) => {
    const result = purchaseBadge(badgeId);
    if (result.success) {
      setPurchaseStatus({ type: 'success', message: 'Badge purchased successfully!' });
    } else {
      setPurchaseStatus({ type: 'error', message: result.error || 'Purchase failed' });
    }
    setTimeout(() => setPurchaseStatus(null), 3000);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white">
        <CardTitle className="text-xl flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Badge Shop
        </CardTitle>
        <p className="text-yellow-100 text-sm">
          Spend your Flappy Watch coins on exclusive profile badges!
        </p>
      </CardHeader>
      <CardContent className="p-4">
        {purchaseStatus && (
          <Alert className={`mb-4 ${purchaseStatus.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <AlertDescription className={purchaseStatus.type === 'success' ? 'text-green-700' : 'text-red-700'}>
              {purchaseStatus.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between mb-4 p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-600" />
            <span className="font-medium">Your Coins:</span>
          </div>
          <span className="text-2xl font-bold text-yellow-600">{coins.toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {AVAILABLE_BADGES.map((badge) => {
            const owned = hasBadge(badge.id);
            const canAfford = coins >= badge.cost;

            return (
              <div 
                key={badge.id} 
                className={`border rounded-lg p-3 text-center ${owned ? 'bg-green-50 border-green-300' : 'bg-white'}`}
              >
                <img 
                  src={badge.image} 
                  alt={badge.name} 
                  className="w-16 h-16 mx-auto mb-2 object-contain"
                />
                <h4 className="font-bold text-sm">{badge.name}</h4>
                <p className="text-xs text-gray-500 mb-2">{badge.description}</p>
                <div className="flex items-center justify-center gap-1 text-yellow-600 font-bold mb-2">
                  <Coins className="h-4 w-4" />
                  {badge.cost.toLocaleString()}
                </div>
                {owned ? (
                  <Badge className="bg-green-500 text-white">
                    <Check className="h-3 w-3 mr-1" />
                    Owned
                  </Badge>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => handlePurchase(badge.id)}
                    disabled={!canAfford}
                    className={canAfford ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                  >
                    {canAfford ? 'Buy' : <><Lock className="h-3 w-3 mr-1" /> Locked</>}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Badges purchased here will appear on your profile. Coins are earned by collecting them in Flappy Watch!
        </p>
      </CardContent>
    </Card>
  );
};

// ============================================
// MAIN GAME COMPONENT
// ============================================
export const FlappyWatchPage: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  
  const { currentUser, isAuthenticated, updateFlappyStats, getFlappyLeaderboard, getFlappyTotalLeaderboard } = useAuthStore();
  const { coins, addCoins } = useFlappyStore();

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu');
  const [score, setScore] = useState(0);
  const [selectedWatch, setSelectedWatch] = useState<WatchModel>('rolex');
  const [sessionCoins, setSessionCoins] = useState(0); // Coins collected this session
  
  // Physics refs
  const watchYRef = useRef(GAME_HEIGHT / 2);
  const watchVelocityRef = useRef(0);
  const watchRotationRef = useRef(0);
  const pipesRef = useRef<Array<{ x: number; topHeight: number; passed: boolean }>>([]);
  const coinsRef = useRef<Array<{ x: number; y: number; collected: boolean }>>([]);
  const diamondRef = useRef<{ x: number; y: number; collected: boolean } | null>(null);
  const scoreRef = useRef(0);
  const sessionCoinsRef = useRef(0);
  const lastPipeCountRef = useRef(0); // Track pipes for diamond spawning
  
  // Display states
  const [watchY, setWatchY] = useState(GAME_HEIGHT / 2);
  const [watchRotation, setWatchRotation] = useState(0);
  const [pipes, setPipes] = useState<Array<{ x: number; topHeight: number; passed: boolean }>>([]);
  const [gameCoins, setGameCoins] = useState<Array<{ x: number; y: number; collected: boolean }>>([]);
  const [diamond, setDiamond] = useState<{ x: number; y: number; collected: boolean } | null>(null);

  // Leaderboards
  const [highScoreLeaderboard, setHighScoreLeaderboard] = useState(() => getFlappyLeaderboard());
  const [totalScoreLeaderboard, setTotalScoreLeaderboard] = useState(() => getFlappyTotalLeaderboard());
  
  // Get personal high score from leaderboard (more reliable than currentUser)
  const personalHighScore = currentUser 
    ? highScoreLeaderboard.find(entry => entry.userId === currentUser.id)?.score || 0
    : 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setHighScoreLeaderboard(getFlappyLeaderboard());
      setTotalScoreLeaderboard(getFlappyTotalLeaderboard());
    }, 2000);
    return () => clearInterval(interval);
  }, [getFlappyLeaderboard, getFlappyTotalLeaderboard, currentUser]);

  const resetGame = useCallback(() => {
    watchYRef.current = GAME_HEIGHT / 2;
    watchVelocityRef.current = 0;
    watchRotationRef.current = 0;
    pipesRef.current = [];
    coinsRef.current = [];
    diamondRef.current = null;
    scoreRef.current = 0;
    sessionCoinsRef.current = 0;
    lastPipeCountRef.current = 0;
    setScore(0);
    setSessionCoins(0);
    setWatchY(GAME_HEIGHT / 2);
    setWatchRotation(0);
    setPipes([]);
    setGameCoins([]);
    setDiamond(null);
    setGameState('menu');
  }, []);

  const startGame = useCallback(() => {
    watchYRef.current = GAME_HEIGHT / 2;
    watchVelocityRef.current = 0;
    watchRotationRef.current = 0;
    pipesRef.current = [{ x: GAME_WIDTH, topHeight: 150 + Math.random() * 200, passed: false }];
    coinsRef.current = [];
    diamondRef.current = null;
    scoreRef.current = 0;
    sessionCoinsRef.current = 0;
    lastPipeCountRef.current = 0;
    setScore(0);
    setSessionCoins(0);
    setWatchY(GAME_HEIGHT / 2);
    setWatchRotation(0);
    setPipes(pipesRef.current);
    setGameCoins([]);
    setDiamond(null);
    setGameState('playing');
    soundManager.playJump();
  }, []);

  const jump = useCallback(() => {
    if (gameState === 'playing') {
      watchVelocityRef.current = JUMP_FORCE;
      watchRotationRef.current = -20;
      soundManager.playJump();
    }
  }, [gameState]);

  const handleInput = useCallback(() => {
    if (gameState === 'menu' || gameState === 'gameOver') {
      startGame();
    } else {
      jump();
    }
  }, [gameState, startGame, jump]);

  const handleGameOver = useCallback(() => {
    soundManager.playDie();
    setGameState('gameOver');
    if (isAuthenticated && currentUser) {
      updateFlappyStats(currentUser.id, scoreRef.current);
      setTimeout(() => {
        setHighScoreLeaderboard(getFlappyLeaderboard());
        setTotalScoreLeaderboard(getFlappyTotalLeaderboard());
      }, 100);
    }
  }, [isAuthenticated, currentUser, updateFlappyStats, getFlappyLeaderboard, getFlappyTotalLeaderboard]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    let lastTime = performance.now();
    let accumulator = 0;
    const FIXED_TIMESTEP = 1000 / 60;
    let coinSpawnTimer = 0;

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      accumulator += deltaTime;
      coinSpawnTimer += deltaTime;

      while (accumulator >= FIXED_TIMESTEP) {
        // Apply gravity
        watchVelocityRef.current += GRAVITY;
        if (watchVelocityRef.current > MAX_FALL_SPEED) {
          watchVelocityRef.current = MAX_FALL_SPEED;
        }
        
        watchYRef.current += watchVelocityRef.current;
        
        // Floor/Ceiling collision
        if (watchYRef.current < 0) {
          watchYRef.current = 0;
          watchVelocityRef.current = 0;
        }
        if (watchYRef.current > GAME_HEIGHT - WATCH_SIZE) {
          handleGameOver();
          return;
        }
        
        // Update rotation
        const targetRotation = Math.min(45, watchVelocityRef.current * 2.5);
        watchRotationRef.current += (targetRotation - watchRotationRef.current) * 0.1;
        
        // Update pipes
        pipesRef.current = pipesRef.current
          .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
          .filter(pipe => pipe.x > -PIPE_WIDTH);
        
        // Spawn new pipe
        const lastPipe = pipesRef.current[pipesRef.current.length - 1];
        if (!lastPipe || lastPipe.x < GAME_WIDTH - 220) {
          pipesRef.current.push({
            x: GAME_WIDTH,
            topHeight: 80 + Math.random() * (GAME_HEIGHT - PIPE_GAP - 160),
            passed: false,
          });
        }

        // Spawn coins - more coins as score increases
        // Base spawn rate: 2-4 seconds, decreases as score increases
        const scoreBonus = Math.min(scoreRef.current * 100, 2000); // Up to 2 seconds faster
        const baseSpawnTime = 4000 - scoreBonus;
        const spawnThreshold = Math.max(1000, baseSpawnTime); // Minimum 1 second
        
        if (coinSpawnTimer > spawnThreshold) {
          // Number of coins to spawn increases with score
          // Score 0-5: 1-2 coins, Score 5-15: 2-3 coins, Score 15+: 3-5 coins
          let coinCount = 1;
          if (scoreRef.current >= 15) {
            coinCount = 3 + Math.floor(Math.random() * 3); // 3-5 coins
          } else if (scoreRef.current >= 5) {
            coinCount = 2 + Math.floor(Math.random() * 2); // 2-3 coins
          } else {
            coinCount = 1 + Math.floor(Math.random() * 2); // 1-2 coins
          }
          
          // Spawn coins in a cluster
          const baseY = 80 + Math.random() * (GAME_HEIGHT - 160);
          for (let i = 0; i < coinCount; i++) {
            coinsRef.current.push({
              x: GAME_WIDTH + (i * 40), // Space coins 40px apart horizontally
              y: baseY + (Math.random() * 60 - 30), // Slight vertical variation
              collected: false,
            });
          }
          coinSpawnTimer = 0;
        }

        // Update coins
        coinsRef.current = coinsRef.current
          .map(coin => ({ ...coin, x: coin.x - PIPE_SPEED }))
          .filter(coin => coin.x > -COIN_SIZE && !coin.collected);
        
        // Check collisions and scoring
        const watchLeft = 80;
        const watchRight = 80 + WATCH_SIZE - 10;
        const watchTop = watchYRef.current + 5;
        const watchBottom = watchYRef.current + WATCH_SIZE - 5;
        
        // Pipe collisions
        for (const pipe of pipesRef.current) {
          const pipeLeft = pipe.x;
          const pipeRight = pipe.x + PIPE_WIDTH;
          const pipeBottom = pipe.topHeight;
          const pipeTop = pipe.topHeight + PIPE_GAP;
          
          if (
            watchRight > pipeLeft &&
            watchLeft < pipeRight &&
            (watchTop < pipeBottom || watchBottom > pipeTop)
          ) {
            handleGameOver();
            return;
          }
          
          if (!pipe.passed && pipeRight < watchLeft) {
            pipe.passed = true;
            scoreRef.current += 1;
            soundManager.playPipePass(); // Ching sound when passing pipe!
            
            // Check if we should spawn a diamond (every 25th pipe)
            if (scoreRef.current > 0 && scoreRef.current % 25 === 0) {
              diamondRef.current = {
                x: GAME_WIDTH + 100, // Spawn a bit ahead
                y: 100 + Math.random() * (GAME_HEIGHT - 200),
                collected: false,
              };
            }
          }
        }

        // Update diamond position
        if (diamondRef.current && !diamondRef.current.collected) {
          diamondRef.current.x -= PIPE_SPEED;
          // Remove if off screen
          if (diamondRef.current.x < -DIAMOND_SIZE) {
            diamondRef.current = null;
          }
        }

        // Diamond collection (worth 50 coins!)
        if (diamondRef.current && !diamondRef.current.collected) {
          const diamondLeft = diamondRef.current.x;
          const diamondRight = diamondRef.current.x + DIAMOND_SIZE;
          const diamondTop = diamondRef.current.y;
          const diamondBottom = diamondRef.current.y + DIAMOND_SIZE;
          
          if (
            watchRight > diamondLeft &&
            watchLeft < diamondRight &&
            watchBottom > diamondTop &&
            watchTop < diamondBottom
          ) {
            diamondRef.current.collected = true;
            sessionCoinsRef.current += 50; // 50 coins for diamond!
            addCoins(50);
            soundManager.playDiamond(); // Special diamond sound!
          }
        }

        // Coin collection
        for (const coin of coinsRef.current) {
          if (coin.collected) continue;
          
          const coinLeft = coin.x;
          const coinRight = coin.x + COIN_SIZE;
          const coinTop = coin.y;
          const coinBottom = coin.y + COIN_SIZE;
          
          if (
            watchRight > coinLeft &&
            watchLeft < coinRight &&
            watchBottom > coinTop &&
            watchTop < coinBottom
          ) {
            coin.collected = true;
            sessionCoinsRef.current += 1;
            addCoins(1);
            soundManager.playCoin();
          }
        }
        
        accumulator -= FIXED_TIMESTEP;
      }
      
      setWatchY(watchYRef.current);
      setWatchRotation(watchRotationRef.current);
      setPipes([...pipesRef.current]);
      setGameCoins([...coinsRef.current]);
      setDiamond(diamondRef.current ? { ...diamondRef.current } : null);
      setScore(scoreRef.current);
      setSessionCoins(sessionCoinsRef.current);
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, handleGameOver, addCoins]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleInput();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Flappy Watch</h1>
              <p className="text-gray-600">Tap or press spacebar for small jumps!</p>
            </div>
            {/* Stats Display */}
            <div className="flex items-center gap-4">
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border">
                <div className="text-2xl font-bold text-yellow-500">{personalHighScore}</div>
                <p className="text-xs text-gray-500">Your Best</p>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border">
                <div className="text-2xl font-bold text-yellow-600 flex items-center gap-1">
                  <Coins className="h-5 w-5" />
                  {coins.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">Total Coins</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2">
            <Card className="mb-4">
              <CardContent className="p-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Choose Your Watch</label>
                <Select value={selectedWatch} onValueChange={(v) => setSelectedWatch(v as WatchModel)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(WATCH_STYLES).map(([key, style]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">⌚</span>
                          {style.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-800 to-green-900 text-white py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-2xl">⌚</span>
                    Score: {score}
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-yellow-300">
                      <Coins className="h-4 w-4" />
                      <span className="font-bold">{sessionCoins}</span>
                    </div>
                    {gameState === 'playing' && <Badge className="bg-yellow-500 text-black">Playing</Badge>}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div
                  ref={gameRef}
                  className="relative bg-gradient-to-b from-sky-300 to-sky-100 cursor-pointer select-none touch-none mx-auto"
                  style={{ width: '100%', maxWidth: GAME_WIDTH, height: GAME_HEIGHT }}
                  onClick={handleInput}
                  onTouchStart={(e) => { e.preventDefault(); handleInput(); }}
                >
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-10 left-10 w-20 h-10 bg-white/40 rounded-full" />
                    <div className="absolute top-24 right-16 w-16 h-8 bg-white/30 rounded-full" />
                    <div className="absolute top-40 left-1/3 w-24 h-12 bg-white/25 rounded-full" />
                  </div>

                  {pipes.map((pipe, index) => (
                    <Pipe key={index} x={pipe.x} topHeight={pipe.topHeight} gap={PIPE_GAP} />
                  ))}

                  {gameCoins.map((coin, index) => (
                    !coin.collected && <Coin key={index} x={coin.x} y={coin.y} />
                  ))}

                  {diamond && !diamond.collected && (
                    <Diamond x={diamond.x} y={diamond.y} />
                  )}

                  <Watch y={watchY} rotation={watchRotation} model={selectedWatch} />

                  {gameState === 'menu' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                      <div className="text-6xl mb-4">⌚</div>
                      <h2 className="text-3xl font-bold text-white mb-2">Flappy Watch</h2>
                      <p className="text-white/80 mb-2">{WATCH_STYLES[selectedWatch].name}</p>
                      <p className="text-white/60 mb-4 text-sm">Tap for small jumps!</p>
                      <p className="text-yellow-300 mb-2 text-sm flex items-center gap-1">
                        <Coins className="h-4 w-4" />
                        Collect gold coins for the badge shop!
                      </p>
                      <p className="text-cyan-300 mb-6 text-sm flex items-center gap-1">
                        💎 Diamond every 25 pipes = 50 coins!
                      </p>
                      <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                        <Play className="h-5 w-5 mr-2" />
                        Play Now
                      </Button>
                    </div>
                  )}

                  {gameState === 'gameOver' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                      <h2 className="text-4xl font-bold text-white mb-2">Game Over!</h2>
                      <div className="text-6xl font-bold text-yellow-400 mb-2">{score}</div>
                      <p className="text-white/80 mb-2">Score</p>
                      {sessionCoins > 0 && (
                        <div className="flex items-center gap-1 text-yellow-300 mb-4">
                          <Coins className="h-5 w-5" />
                          <span className="text-xl font-bold">+{sessionCoins} coins!</span>
                        </div>
                      )}
                      {isAuthenticated && score > personalHighScore && score > 0 && (
                        <Badge className="bg-yellow-500 text-black mb-4">
                          <Trophy className="h-4 w-4 mr-1" />
                          New Personal Best!
                        </Badge>
                      )}
                      <Button 
                        size="lg" 
                        onClick={(e) => { e.stopPropagation(); resetGame(); startGame(); }}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <RotateCcw className="h-5 w-5 mr-2" />
                        Play Again
                      </Button>
                    </div>
                  )}

                  {gameState === 'playing' && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-sm animate-pulse">
                      Tap to jump! Coins & 💎 every 25 pipes!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">How to Play</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-gray-600">
                <p>1. Tap the screen or press <strong>Spacebar</strong> for small jumps</p>
                <p>2. Tap multiple times for controlled ascent</p>
                <p>3. Avoid the green pipes</p>
                <p>4. Collect gold coins for the badge shop!</p>
                <p>5. Each pipe passed = 1 point (with satisfying "ching" sound!)</p>
                <p>6. 💎 <strong>Diamond every 25 pipes = 50 coins!</strong></p>
                <p className="text-sm text-blue-600">Tip: Small, frequent taps give you better control!</p>
              </CardContent>
            </Card>

            {/* Badge Shop */}
            <BadgeShop />
          </div>

          {/* Leaderboards */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Global High Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {highScoreLeaderboard.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No scores yet. Be the first!</p>
                  ) : (
                    highScoreLeaderboard.map((entry, index) => (
                      <div key={entry.userId} className={`flex items-center gap-3 p-2 rounded-lg ${entry.userId === currentUser?.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                        <div className={`font-bold w-6 text-center ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-600'}`}>
                          {index === 0 ? <Crown className="h-4 w-4" /> : index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.avatar} />
                          <AvatarFallback>{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-sm truncate">{entry.username}</span>
                        <span className="font-bold">{entry.score}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-blue-500" />
                  Total Score Leaders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {totalScoreLeaderboard.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No scores yet. Be the first!</p>
                  ) : (
                    totalScoreLeaderboard.map((entry, index) => (
                      <div key={entry.userId} className={`flex items-center gap-3 p-2 rounded-lg ${entry.userId === currentUser?.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                        <div className={`font-bold w-6 text-center ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-600'}`}>
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.avatar} />
                          <AvatarFallback>{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-sm truncate">{entry.username}</span>
                        <span className="font-bold text-blue-600">{entry.totalScore}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlappyWatchPage;
