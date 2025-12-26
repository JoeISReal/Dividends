// Stream and Manager descriptions for the game
// Synced with GameData.js IDs

export const streamDescriptions = {
    // 1. Stabilizer
    microbags: {
        name: 'Microbags Miner',
        description: 'Farming dust in forgotten wallets.',
        managerName: "Dust Sweeper",
        managerDescription: "Automates collecting dust from thousands of wallets."
    },
    liquidity_pool: {
        name: 'Liquidity Pool',
        description: 'Providing the exit liquidity.',
        managerName: "LP Provider",
        managerDescription: "Rebalances your pools to minimize impermanent loss."
    },
    dao_treasury: {
        name: 'DAO Treasury',
        description: 'Governance proposals for personal gain.',
        managerName: "Gov Specialist",
        managerDescription: "Writes proposals that always pass. For the community, of course."
    },

    // 2. Volatile
    leverage_frog: {
        name: 'Leverage Frog',
        description: '100x long on a hunch.',
        managerName: "Pepe Trader",
        managerDescription: "Smokes hopium and hits buy. Never sleeps."
    },
    meme_farm: {
        name: 'Meme Farm',
        description: 'Harvesting likes for liquidity.',
        managerName: "Page Admin",
        managerDescription: "Reposts content from Reddit to Twitter 24/7."
    },
    arb_node: {
        name: 'On-chain Arb Node',
        description: 'Front-running the front-runners.',
        managerName: "MEV Bot",
        managerDescription: "Sandwiches transactions automatically. Ruthless efficiency."
    },

    // 3. Synergy
    chart_whisperer: {
        name: 'Chart Whisperer',
        description: 'Drawing triangles on random screenshots.',
        managerName: "TA Guru",
        managerDescription: "Predicts the market moving to the right 100% of the time."
    },
    trading_bot: {
        name: 'Trading Bot Rack',
        description: 'Beep boop money printer.',
        managerName: "Server Tech",
        managerDescription: "Keeps the servers cool and the bots running."
    },
    validator: {
        name: 'Validator Node',
        description: 'Securing the network (and the bag).',
        managerName: "Node Operator",
        managerDescription: "Ensures 99.99% uptime so you never get slashed."
    },

    // 4. Decay
    whale_tracker: {
        name: 'Whale Tracker',
        description: 'Stalking big wallets on Etherscan.',
        managerName: "Chain Detective",
        managerDescription: "Alerts you the moment a whale sneezes."
    },
    cex_pipeline: {
        name: 'CEX Pipeline',
        description: 'Direct line to the exchange listing team.',
        managerName: "Listing Agent",
        managerDescription: "Knows a guy who knows a guy at Binance."
    },
    central_bank: {
        name: 'Central Bank',
        description: 'Just printing it directly.',
        managerName: "Fed Chairman",
        managerDescription: "Money printer go BRRRR automatically."
    }
};

export const upgradeDescriptions = {
    click: {
        name: "Click Power",
        description: "Double your FARM button yield. For when you want to grind manually."
    },
    global: {
        name: "Global Multiplier",
        description: "10% boost to ALL income streams. Compound your gains."
    }
};

export const getStreamDescription = (streamKey) => {
    return streamDescriptions[streamKey] || {
        name: "Unknown Stream",
        description: "A mysterious income source.",
        managerName: "Manager",
        managerDescription: "Manages things automatically."
    };
};

export const getUpgradeDescription = (upgradeType) => {
    return upgradeDescriptions[upgradeType] || {
        name: "Unknown Upgrade",
        description: "Does something, probably."
    };
};
