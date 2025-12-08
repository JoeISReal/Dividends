import React, { useState, useEffect } from 'react';
import { useGameStore } from './state/gameStore';
import { AppShell } from './AppShell';
import StreamCard from './components/StreamCard';
import UpgradeCard from './components/UpgradeCard';
import ManagersTab from './components/ManagersTab';
import HelpTab from './components/HelpTab';
import DegenArenaPage from './pages/DegenArenaPage';

export default function App() {
  // Zustand store hooks
  const balance = useGameStore((s) => s.balance);
  const yps = useGameStore((s) => s.yps);
  const streams = useGameStore((s) => s.streams);
  const managers = useGameStore((s) => s.managers);
  const managerCosts = useGameStore((s) => s.managerCosts);
  const upgrades = useGameStore((s) => s.upgrades);
  const multipliers = useGameStore((s) => s.multipliers);

  // Actions
  const buyStream = useGameStore((s) => s.buyStream);
  const hireManager = useGameStore((s) => s.hireManager);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const addBalance = useGameStore((s) => s.addBalance);

  const [activeTab, setActiveTab] = useState('streams');
  const [buyAmount, setBuyAmount] = useState(1);

  // Global YPS ticker - generates passive income
  useEffect(() => {
    const interval = setInterval(() => {
      const currentYps = useGameStore.getState().yps;
      if (currentYps > 0) {
        addBalance(currentYps / 10); // Smooth tick every 100ms
      }
    }, 100);

    return () => clearInterval(interval);
  }, [addBalance]);

  // Manager automation - hired managers auto-level streams
  useEffect(() => {
    const interval = setInterval(() => {
      const currentManagers = useGameStore.getState().managers;
      Object.entries(currentManagers).forEach(([streamKey, isHired]) => {
        if (isHired) {
          buyStream(streamKey, 1);
        }
      });
    }, 1000); // Managers buy every second

    return () => clearInterval(interval);
  }, [buyStream]);

  // Stream purchase handler
  const handleBuyStream = (streamKey) => {
    const quantity = buyAmount === 'MAX' ? 10 : Number(buyAmount);
    buyStream(streamKey, quantity);
  };

  // Collect stream (manual click for non-automated streams)
  const handleCollectStream = (streamKey) => {
    const stream = streams[streamKey];
    if (!stream || stream.level === 0) return;

    const earnedYield = stream.baseYps * stream.level * multipliers.prestige * multipliers.global;
    addBalance(earnedYield);
  };

  // Manager hire handler
  const handleHireManager = (streamKey) => {
    hireManager(streamKey);
  };

  // Upgrade purchase handler
  const handleBuyUpgrade = (upgradeType) => {
    buyUpgrade(upgradeType);
  };

  // Dummy live degens for right sidebar
  const dummyDegens = [
    { name: "PaperHands", mul: 0.27 },
    { name: "DiamondHands", mul: 3.20 },
    { name: "WhaleWatcher", mul: 4.28 },
    { name: "DipBuyer", mul: 0.89 },
    { name: "MoonBoy420", mul: 2.15 },
    { name: "HODL_Master", mul: 1.67 },
  ];

  // Render center content based on active tab
  let centerContent;
  let liveDegens = dummyDegens;

  if (activeTab === 'streams') {
    centerContent = (
      <>
        <div className="main-header">
          <div className="main-title">Streams</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 10, 25, 100, 'MAX'].map(amt => (
              <button
                key={amt}
                className={buyAmount === amt ? "pill pill--gold" : "pill"}
                onClick={() => setBuyAmount(amt)}
                style={{
                  cursor: "pointer",
                  padding: "8px 14px",
                  fontWeight: 600,
                  background: buyAmount === amt
                    ? 'linear-gradient(135deg, var(--gold-light), var(--gold))'
                    : 'rgba(255, 255, 255, 0.08)',
                  color: buyAmount === amt ? '#1D1D1D' : 'var(--text-high)',
                  border: buyAmount === amt
                    ? '1px solid var(--gold-light)'
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  transition: 'all 0.15s ease',
                  boxShadow: buyAmount === amt ? '0 0 12px rgba(247, 209, 109, 0.25)' : 'none'
                }}
              >
                {amt}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
          {Object.entries(streams).map(([key, stream]) => {
            // Map stream data to format expected by StreamCard
            const streamData = {
              id: key,
              name: key.charAt(0).toUpperCase() + key.slice(1),
              icon: getStreamIcon(key),
              owned: stream.level,
              baseCost: stream.baseCost,
              baseYield: stream.baseYps,
              baseTime: 3, // Default 3 seconds
              costScale: 1.15,
              hasManager: managers[key],
              unlocks: [], // Simplified - no unlocks for now
            };

            return (
              <StreamCard
                key={key}
                stream={streamData}
                onBuy={() => handleBuyStream(key)}
                buyAmount={buyAmount}
                onCollect={() => handleCollectStream(key)}
              />
            );
          })}
        </div>
      </>
    );
  } else if (activeTab === 'managers') {
    // Convert managers to array format for ManagersTab
    const managersArray = Object.entries(managers).map(([key, isHired]) => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1) + ' Manager',
      cost: managerCosts[key],
      hired: isHired,
      automatesStream: key,
    }));

    centerContent = (
      <ManagersTab
        managers={managersArray}
        ownedManagers={Object.entries(managers).filter(([_, hired]) => hired).map(([key]) => key)}
        balance={balance}
        onBuy={handleHireManager}
      />
    );
  } else if (activeTab === 'upgrades') {
    // Create upgrade catalog
    const upgradesCatalog = [
      {
        key: 'click',
        name: 'Faster Clicks',
        description: 'Double your click yield',
        cost: Math.floor(500 * Math.pow(2, upgrades.clickLevel)),
        level: upgrades.clickLevel,
        effect: `x${multipliers.click}`,
      },
      {
        key: 'global',
        name: 'R&D Investment',
        description: 'Increase all stream profits by 10%',
        cost: Math.floor(50000 * Math.pow(1.5, upgrades.globalLevel)),
        level: upgrades.globalLevel,
        effect: `x${multipliers.global.toFixed(2)}`,
      },
    ];

    centerContent = (
      <>
        <div className="main-header">
          <div className="main-title">Upgrades</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
          {upgradesCatalog.map(u => (
            <UpgradeCard
              key={u.key}
              upgrade={u}
              onBuy={() => handleBuyUpgrade(u.key)}
              ownedLevel={u.level}
            />
          ))}
        </div>
      </>
    );
  } else if (activeTab === 'degen-arena') {
    centerContent = <DegenArenaPage />;
    liveDegens = dummyDegens;
  } else if (activeTab === 'leaderboard') {
    centerContent = (
      <>
        <div className="main-header">
          <div className="main-title">🏆 Leaderboard</div>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          gap: '20px'
        }}>
          <div style={{
            fontSize: '72px',
            opacity: 0.3
          }}>🏆</div>
          <div style={{
            fontSize: '32px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--gold-light), var(--gold))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Coming Soon
          </div>
          <div style={{
            fontSize: '16px',
            color: 'var(--text-low)',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            Compete with other degens for the top spot!<br />
            Track your rank, biggest wins, and total profits.
          </div>
        </div>
      </>
    );
  } else {
    centerContent = <HelpTab />;
  }

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      centerContent={centerContent}
      liveDegens={liveDegens}
    />
  );
}

// Helper function to get stream icons
function getStreamIcon(streamKey) {
  const icons = {
    shitpost: '💩',
    engagement: '📿',
    pump: '🚀',
    nft: '🖼️',
    algo: '🤖',
    sentiment: '🔮',
  };
  return icons[streamKey] || '💰';
}

