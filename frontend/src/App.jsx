import React, { useState, useEffect } from 'react';
import { useGameStore } from './state/gameStore';
import { calculateIncome } from './game/incomeEngineFixed';
import useGameLoop from './game/useGameLoop';
import { getStreamDescription, getUpgradeDescription } from './data/descriptions';

import { AppShell } from './AppShell';
import StreamCard from './components/StreamCard';
import UpgradeCard from './components/UpgradeCard';
import ManagersTab from './components/ManagersTab';
import HelpTab from './components/HelpTab';
import CommunityTab from './components/CommunityTab';
import LeaderboardTab from './components/LeaderboardTab';
import DegenArenaPage from './pages/DegenArenaPage';
import TradeHistoryPage from './pages/TradeHistoryPage';
import NotificationToast from './components/NotificationToast';

export default function App() {
  // Zustand store hooks
  const balance = useGameStore((s) => s.balance);
  const yps = useGameStore((s) => s.yps);
  const streams = useGameStore((s) => s.streams || {});
  const managers = useGameStore((s) => s.managers || {});
  const managerCosts = useGameStore((s) => s.managerCosts || {});
  const upgrades = useGameStore((s) => s.upgrades || {});
  const multipliers = useGameStore((s) => s.multipliers || {});

  // Actions
  const buyStream = useGameStore((s) => s.buyStream);
  const hireManager = useGameStore((s) => s.hireManager);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const addBalance = useGameStore((s) => s.addBalance);

  const [activeTab, setActiveTab] = useState('streams');
  const [buyAmount, setBuyAmount] = useState(1);

  // Core Game Loop (Passive Income + Offline Earnings)
  useGameLoop(100);

  // Manager automation - hired managers auto-level streams
  useEffect(() => {
    const interval = setInterval(() => {
      const currentManagers = useGameStore.getState().managers;
      if (currentManagers) {
        Object.entries(currentManagers).forEach(([streamKey, isHired]) => {
          if (isHired) {
            buyStream(streamKey, 1);
          }
        });
      }
    }, 1000); // Managers buy every second

    return () => clearInterval(interval);
  }, [buyStream]);

  // Leaderboard Auto-Sync (Every 10s)
  useEffect(() => {
    const interval = setInterval(() => {
      const auth = useGameStore.getState().auth;
      if (auth.isAuthenticated) {
        useGameStore.getState().syncScore();
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

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
            const desc = getStreamDescription(key);
            // Map stream data to format expected by StreamCard
            const streamData = {
              id: key,
              name: desc.name,
              description: desc.description,
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
    const managersArray = Object.entries(managers).map(([key, isHired]) => {
      const desc = getStreamDescription(key);
      return {
        id: key,
        name: desc.managerName,
        description: desc.managerDescription,
        cost: managerCosts[key],
        hired: isHired,
        automatesStream: key,
      };
    });

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
    const clickDesc = getUpgradeDescription('click');
    const globalDesc = getUpgradeDescription('global');

    const upgradesCatalog = [
      {
        key: 'click',
        name: clickDesc.name,
        desc: clickDesc.description,
        cost: Math.floor(500 * Math.pow(2, upgrades.clickLevel)),
        level: upgrades.clickLevel,
        effect: `x${multipliers.click}`,
      },
      {
        key: 'global',
        name: globalDesc.name,
        desc: globalDesc.description,
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
    centerContent = <LeaderboardTab />;
  } else if (activeTab === 'community') {
    centerContent = <CommunityTab />;
  } else {
    centerContent = <HelpTab />;
  }

  return (
    <>
      <AppShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        centerContent={centerContent}
        liveDegens={liveDegens}
      />
      <NotificationToast />
    </>
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

