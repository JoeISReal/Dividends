import React, { useState, useEffect } from 'react';
import { useGameStore } from './state/gameStore';
import useGameLoop from './game/useGameLoop';
import { getStreamDescription, getUpgradeDescription } from './data/descriptions';

import { AppShell } from './AppShell';
import StreamCard from './components/StreamCard';
import UpgradeCard from './components/UpgradeCard';
import ManagersTab from './components/ManagersTab';
import HelpTab from './components/HelpTab';
import CommunityTab from './components/CommunityTab';
import SettingsTab from './components/SettingsTab';
import LeaderboardTab from './components/LeaderboardTab';
import NotificationToast from './components/NotificationToast';
import LoginPage from './pages/LoginPage';
import DegenArenaPage from './pages/DegenArenaPage';
import TradeHistoryPage from './pages/TradeHistoryPage';

import { soundManager } from './game/SoundManager';

export default function App() {
  const auth = useGameStore(s => s.auth);
  const syncScore = useGameStore(s => s.syncScore);

  useEffect(() => {
    soundManager.init();
    const unlockAudio = () => {
      soundManager.resume();
      document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
  }, []);

  // Zustand store hooks
  const balance = useGameStore((s) => s.balance);
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

  // Core Game Loop
  useGameLoop(100);



  // Leaderboard Sync
  useEffect(() => {
    const interval = setInterval(() => {
      const auth = useGameStore.getState().auth;
      if (auth.isAuthenticated) useGameStore.getState().syncScore();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Mandatory Login Check - Rendered AFTER hooks to prevent "fewer hooks" error
  if (!auth.isAuthenticated) {
    return (
      <>
        <LoginPage />
        <NotificationToast />
      </>
    );
  }

  const handleBuyStream = (streamKey) => {
    soundManager.playClick();
    const quantity = buyAmount === 'MAX' ? 10 : Number(buyAmount);
    soundManager.playSuccess();
    buyStream(streamKey, quantity);
  };

  const handleCollectStream = (streamKey) => {
    const stream = streams[streamKey];
    if (!stream || stream.level === 0) return;
    soundManager.playMoney();
    const earnedYield = stream.baseYps * stream.level * multipliers.prestige * multipliers.global;
    addBalance(earnedYield);
  };

  const handleHireManager = (streamKey) => {
    soundManager.playClick();
    soundManager.playSuccess();
    hireManager(streamKey);
  }

  const handleBuyUpgrade = (upgradeType) => {
    soundManager.playClick();
    soundManager.playSuccess();
    buyUpgrade(upgradeType);
  }

  let centerContent;
  let liveDegens = [];

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
                  background: buyAmount === amt ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
                  color: buyAmount === amt ? '#000' : '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
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
            return (
              <StreamCard
                key={key}
                stream={{
                  id: key,
                  name: desc.name,
                  description: desc.description,
                  icon: getStreamIcon(key),
                  owned: stream.level,
                  baseCost: stream.baseCost,
                  baseYield: stream.baseYps,
                  baseTime: 3,
                  costScale: 1.15,
                  hasManager: managers[key],
                  unlocks: [],
                }}
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
  } else if (activeTab === 'leaderboard') {
    centerContent = <LeaderboardTab />;
  } else if (activeTab === 'community') {
    centerContent = <CommunityTab />;
  } else if (activeTab === 'settings') {
    centerContent = <SettingsTab />;
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
