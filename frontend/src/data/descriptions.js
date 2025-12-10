// Stream and Manager descriptions for the game
export const streamDescriptions = {
    shitpost: {
        name: "Shitpost Stream",
        description: "Low-effort memes and hot takes. The foundation of any degen empire.",
        managerName: "Meme Lord",
        managerDescription: "A professional shitposter who never sleeps. Automatically generates engagement 24/7."
    },
    engagement: {
        name: "Engagement Farm",
        description: "Reply guys, quote tweets, and strategic ratio attempts. Pure engagement farming.",
        managerName: "Engagement Farmer",
        managerDescription: "Knows every algorithm trick. Will farm engagement while you sleep."
    },
    pump: {
        name: "Pump Coordinator",
        description: "Coordinate pumps, create FOMO, and ride the green candles to Valhalla.",
        managerName: "Pump Captain",
        managerDescription: "Has a sixth sense for pumps. Automatically coordinates moon missions."
    },
    nft: {
        name: "NFT Flipper",
        description: "Flip JPEGs, ape into mints, and pray for royalties. WAGMI or NGMI.",
        managerName: "NFT Degen",
        managerDescription: "Professional floor sweeper. Flips NFTs faster than you can say 'right-click save'."
    },
    algo: {
        name: "Algo Trading Bot",
        description: "Automated trading strategies, backtested on hopium and copium.",
        managerName: "Quant Wizard",
        managerDescription: "PhD in losing money efficiently. Runs algos that definitely won't blow up your account."
    },
    sentiment: {
        name: "Sentiment Analysis",
        description: "Read the vibes, analyze the hopium, and front-run the narrative shifts.",
        managerName: "Vibe Checker",
        managerDescription: "Can smell a rug from miles away. Analyzes sentiment while you touch grass."
    }
};

export const upgradeDescriptions = {
    click: {
        name: "Click Power",
        description: "Double your FARM button yield. For when you want to grind manually like it's 2010."
    },
    global: {
        name: "Global Multiplier",
        description: "10% boost to ALL income streams. The closest thing to free money in this economy."
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
