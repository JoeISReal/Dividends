export const STREAMS = [
    { id: 'microbags', name: 'Microbags Miner', baseCost: 10, baseYield: 1, costMultiplier: 1.07, description: 'Farming dust in forgotten wallets.' },
    { id: 'chart_whisperer', name: 'Chart Whisperer', baseCost: 100, baseYield: 5, costMultiplier: 1.10, description: 'Drawing triangles on random screenshots.' },
    { id: 'leverage_frog', name: 'Leverage Frog', baseCost: 1100, baseYield: 32, costMultiplier: 1.12, description: '100x long on a hunch.' },
    { id: 'meme_farm', name: 'Meme Farm', baseCost: 12000, baseYield: 120, costMultiplier: 1.13, description: 'Harvesting likes for liquidity.' },
    { id: 'whale_tracker', name: 'Whale Tracker', baseCost: 130000, baseYield: 450, costMultiplier: 1.14, description: 'Stalking big wallets on Etherscan.' },
    { id: 'trading_bot', name: 'Trading Bot Rack', baseCost: 1400000, baseYield: 1500, costMultiplier: 1.15, description: 'Beep boop money printer.' },
    { id: 'cex_pipeline', name: 'CEX Pipeline', baseCost: 20000000, baseYield: 5000, costMultiplier: 1.15, description: 'Direct line to the exchange listing team.' },
    { id: 'arb_node', name: 'On-chain Arb Node', baseCost: 330000000, baseYield: 18000, costMultiplier: 1.15, description: 'Front-running the front-runners.' },
    { id: 'liquidity_pool', name: 'Liquidity Pool', baseCost: 5100000000, baseYield: 65000, costMultiplier: 1.15, description: 'Providing the exit liquidity.' },
    { id: 'validator', name: 'Validator Node', baseCost: 75000000000, baseYield: 250000, costMultiplier: 1.15, description: 'Securing the network (and the bag).' },
    { id: 'dao_treasury', name: 'DAO Treasury', baseCost: 1000000000000, baseYield: 1000000, costMultiplier: 1.15, description: 'Governance proposals for personal gain.' },
    { id: 'central_bank', name: 'Central Bank', baseCost: 14000000000000, baseYield: 5000000, costMultiplier: 1.15, description: 'Just printing it directly.' }
];

export const UPGRADES = [
    { id: 'click_1', name: 'Faster Clicks', type: 'multiplier', target: 'global', value: 2, cost: 500, description: 'Global yield x2' },
    { id: 'micro_1', name: 'Better GPUs', type: 'multiplier', target: 'microbags', value: 2, cost: 1000, description: 'Microbags yield x2' },
    { id: 'chart_1', name: 'Ruler Upgrade', type: 'multiplier', target: 'chart_whisperer', value: 2, cost: 5000, description: 'Chart Whisperer yield x2' },
    { id: 'frog_1', name: 'Bigger Leverage', type: 'multiplier', target: 'leverage_frog', value: 2, cost: 25000, description: 'Leverage Frog yield x2' },
    { id: 'global_1', name: 'Bull Run', type: 'multiplier', target: 'global', value: 3, cost: 1000000, description: 'Global yield x3' },
    { id: 'speed_1', name: 'Fiber Optic', type: 'speed', target: 'all', value: 2, cost: 5000000, description: 'All production speed x2' }
];

export const EVENTS = [
    { id: 'airdrop', name: 'Airdrop Boom', type: 'yield_boost', value: 3, duration: 30, probability: 0.3, description: 'Global Yield x3 for 30s!' },
    { id: 'fomo', name: 'FOMO Surge', type: 'cost_reduction', value: 0.8, duration: 15, probability: 0.3, description: 'Costs reduced by 20% for 15s!' },
    { id: 'correction', name: 'Market Correction', type: 'bad_luck', value: 0, duration: 10, probability: 0.1, description: 'Production halted for 10s!' },
    { id: 'exploit', name: 'Bot Exploit', type: 'instant_grant', value: 300, duration: 0, probability: 0.3, description: 'Instant 5 minutes of production!' }
];
