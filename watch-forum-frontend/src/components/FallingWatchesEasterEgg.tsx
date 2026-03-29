// ============================================
// FALLING WATCHES EASTER EGG
// Hidden feature: Click 20+ times anywhere to trigger
// Watches fall down the screen as a fun relief system
// ============================================

import React, { useState, useEffect } from 'react';

interface FallingWatch {
  id: number;
  x: number;
  y: number;
  rotation: number;
  speed: number;
  rotationSpeed: number;
  emoji: string;
  size: number;
}

const WATCH_EMOJIS = ['⌚', '⏱️', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'];

export const FallingWatchesEasterEgg: React.FC = () => {
  const [, setClickCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [fallingWatches, setFallingWatches] = useState<FallingWatch[]>([]);
  const [showHint, setShowHint] = useState(false);

  // Track clicks across the page
  useEffect(() => {
    let clickTimer: ReturnType<typeof setTimeout>;
    let hintTimer: ReturnType<typeof setTimeout>;

    const handleClick = () => {
      setClickCount(prev => {
        const newCount = prev + 1;
        
        // Show hint after 15 clicks
        if (newCount === 15) {
          setShowHint(true);
          hintTimer = setTimeout(() => setShowHint(false), 3000);
        }
        
        // Activate after 20 clicks
        if (newCount >= 20 && !isActive) {
          setIsActive(true);
          // Reset click count after activation
          setTimeout(() => setClickCount(0), 5000);
        }
        
        // Reset click count if no clicks for 3 seconds
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
          setClickCount(0);
          setShowHint(false);
        }, 3000);
        
        return newCount;
      });
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      clearTimeout(clickTimer);
      clearTimeout(hintTimer);
    };
  }, [isActive]);

  // Generate falling watches when activated
  useEffect(() => {
    if (!isActive) return;

    // Create initial batch of watches
    const initialWatches: FallingWatch[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -50 - Math.random() * 500,
      rotation: Math.random() * 360,
      speed: 2 + Math.random() * 4,
      rotationSpeed: (Math.random() - 0.5) * 4,
      emoji: WATCH_EMOJIS[Math.floor(Math.random() * WATCH_EMOJIS.length)],
      size: 20 + Math.random() * 30,
    }));

    setFallingWatches(initialWatches);

    // Animation loop
    const animationInterval = setInterval(() => {
      setFallingWatches(prev => {
        const updated = prev.map(watch => ({
          ...watch,
          y: watch.y + watch.speed,
          rotation: watch.rotation + watch.rotationSpeed,
        })).filter(watch => watch.y < window.innerHeight + 100);

        // Add new watches if running low
        if (updated.length < 20 && Math.random() > 0.7) {
          updated.push({
            id: Date.now(),
            x: Math.random() * window.innerWidth,
            y: -50,
            rotation: Math.random() * 360,
            speed: 2 + Math.random() * 4,
            rotationSpeed: (Math.random() - 0.5) * 4,
            emoji: WATCH_EMOJIS[Math.floor(Math.random() * WATCH_EMOJIS.length)],
            size: 20 + Math.random() * 30,
          });
        }

        return updated;
      });
    }, 16);

    // Stop after 8 seconds
    const stopTimer = setTimeout(() => {
      setIsActive(false);
      setFallingWatches([]);
    }, 8000);

    return () => {
      clearInterval(animationInterval);
      clearTimeout(stopTimer);
    };
  }, [isActive]);

  if (!isActive && !showHint) return null;

  return (
    <>
      {/* Hint Message */}
      {showHint && !isActive && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] bg-yellow-400 text-black px-4 py-2 rounded-full font-bold animate-bounce shadow-lg">
          Keep clicking... ⌚
        </div>
      )}

      {/* Falling Watches */}
      {isActive && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          {fallingWatches.map(watch => (
            <div
              key={watch.id}
              className="absolute"
              style={{
                left: `${watch.x}px`,
                top: `${watch.y}px`,
                transform: `rotate(${watch.rotation}deg)`,
                fontSize: `${watch.size}px`,
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                opacity: 0.9,
              }}
            >
              {watch.emoji}
            </div>
          ))}
          
          {/* Fun message */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-full text-lg font-bold animate-pulse">
            🎉 WATCH RAIN! 🎉
          </div>
        </div>
      )}
    </>
  );
};

export default FallingWatchesEasterEgg;
