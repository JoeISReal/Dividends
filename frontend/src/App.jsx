import React, { useState, useEffect } from 'react';
import { useGameStore } from './state/gameStore';
import useGameLoop from './game/useGameLoop';
import { STREAMS } from './data/GameData';
import { getStreamDescription, getUpgradeDescription } from './data/descriptions';

import { AppShell } from './AppShell';
import StreamCard from './components/StreamCard';
import OperationsTab from './components/OperationsTab';
import StreamsTab from './components/StreamsTab';
import HelpTab from './components/HelpTab';
import CommunityOps from './pages/CommunityOps';
import SettingsTab from './components/SettingsTab';
import LeaderboardTab from './components/LeaderboardTab';
import NotificationToast from './components/NotificationToast';
import LoginPage from './pages/LoginPage';
import DegenArenaPage from './pages/DegenArenaPage';
import DashboardTab from './components/DashboardTab';
import PrestigeTab from './components/PrestigeTab';
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

  const [activeTab, setActiveTab] = useState('dashboard');
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
  // Create a sorted list for display (Cheapest -> Most Expensive)
  const SORTED_STREAMS = [...STREAMS].sort((a, b) => a.baseCost - b.baseCost);

  if (activeTab === 'dashboard') {
    centerContent = <DashboardTab />;

  } else if (activeTab === 'streams') {
    centerContent = (
      <StreamsTab
        streams={streams}
        managers={managers}
        buyAmount={buyAmount}
        setBuyAmount={setBuyAmount}
        onBuyStream={handleBuyStream}
        onCollectStream={handleCollectStream}
        getStreamIcon={getStreamIcon}
      />
    );

  } else if (activeTab === 'operations') {
    // Operations Tab (Managers + Upgrades)

    // Prop: Managers List
    const managersArray = SORTED_STREAMS.map((s) => {
      const key = s.id;
      const desc = getStreamDescription(key);
      const isHired = managers[key];
      return {
        id: key,
        name: desc.managerName,
        description: desc.managerDescription,
        cost: managerCosts[key],
        hired: isHired,
        automatesStream: key,
        streamName: desc.name,
      };
    });

    centerContent = (
      <OperationsTab
        managers={managersArray}
        ownedManagers={Object.entries(managers).filter(([_, hired]) => hired).map(([key]) => key)}
        balance={balance}
        onHireManager={handleHireManager}
        upgrades={upgrades}
        multipliers={multipliers}
        onBuyUpgrade={handleBuyUpgrade}
      />
    );

  } else if (activeTab === 'degen-arena') {
    centerContent = <DegenArenaPage />;
  } else if (activeTab === 'leaderboard') {
    centerContent = <LeaderboardTab />;
  } else if (activeTab === 'community') {
    centerContent = <CommunityOps />;
  } else if (activeTab === 'settings') {
    centerContent = <SettingsTab />;
  } else if (activeTab === 'help') {
    centerContent = <HelpTab />;
  } else if (activeTab === 'prestige') {
    centerContent = <PrestigeTab />;
  } else {
    centerContent = <DashboardTab />; // Default fallback
  }

  return (
    <>
      <AppShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        centerContent={centerContent}
      />
      <NotificationToast />
    </>
  );
}

function getStreamIcon(streamKey) {
  const icons = {
    microbags: '🧹',
    liquidity_pool: '💧',
    dao_treasury: '🏛️',
    leverage_frog: '🐸',
    meme_farm: '😂',
    arb_node: '⚡',
    chart_whisperer: '📐',
    trading_bot: '🤖',
    validator: '🛡️',
    whale_tracker: '🐋',
    cex_pipeline: '🏦',
    central_bank: '🖨️',
  };
  return icons[streamKey] || '💰';
}
