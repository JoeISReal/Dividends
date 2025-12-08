# 💸 DIVIDENDS: Degen Wealth

An addictive idle game meets high-stakes trading simulator. Build your passive income empire while gambling it all in the Degen Arena.

![Dividends Game](https://img.shields.io/badge/Status-Production%20Ready-success)
![React](https://img.shields.io/badge/React-18-blue)
![Zustand](https://img.shields.io/badge/Zustand-State%20Management-purple)

## 🎮 Features

### 💰 **Idle Economy**
- **6 Income Streams**: Shitpost, Engagement, Pump, NFT, Algo, Sentiment
- **Manager Automation**: Hire managers to auto-level your streams
- **Prestige System**: Reset for permanent multiplier bonuses
- **Upgrades**: Boost click power and global yield
- **Real-time YPS**: Smooth passive income generation

### 🎰 **Degen Arena**
- **Live Trading**: High-volatility price action with AI bots
- **Rug.fun-Style Chart**: Center-origin candles with smooth camera
- **AI Market Makers**: WhaleGod, DipBuyer, RugPuller, ScalpGoblin
- **Real P/L Tracking**: Breakeven lines and live profit display
- **Integrated Economy**: Wins/losses affect your main balance

### 🎨 **Premium Design**
- **Degen Wealth Theme**: Gold + neon color palette
- **Abstract Background**: Stunning money-themed visuals
- **Smooth Animations**: Micro-interactions throughout
- **Responsive UI**: Clean, modern interface

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dividends.git
cd dividends

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies (optional)
cd ../backend
npm install
```

### Run Development Server

```bash
# Frontend only (recommended for testing)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Full Stack

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📁 Project Structure

```
dividends/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── state/           # Zustand store
│   │   │   └── gameStore.js # Unified game state
│   │   ├── game/            # Game engines
│   │   │   ├── tradingEngine.js
│   │   │   └── chartEngineV2.js
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── styles/          # CSS files
│   │   ├── App.jsx          # Main app
│   │   └── main.jsx         # Entry point
│   └── public/              # Static assets
│
└── backend/                 # Node.js + Express backend
    ├── src/
    │   ├── models/          # Data models
    │   └── modules/         # Game logic
    └── server.js            # API server
```

## 🎯 Game Mechanics

### Income Streams
Each stream generates passive income:
- **Cost**: Increases by 1.15x per level
- **Yield**: Base YPS × Level × Multipliers
- **Automation**: Hire managers for auto-leveling

### Prestige
- Reset all streams and managers
- Gain permanent multiplier bonus
- Bonus = floor(YPS / 50) + 1

### Degen Arena
- Buy positions at current price
- Price moves with AI bot activity
- Sell to realize profit/loss
- Integrated with main balance

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Zustand (state management)
- Vite (build tool)
- Canvas 2D API (chart rendering)
- Pure CSS (no frameworks)

**Backend:**
- Node.js
- Express
- JSON file storage

## 🎨 Design System

The "Degen Wealth" design system features:
- **Gold Wealth**: `#F7D16D` primary, `#C89D4A` secondary
- **Neon Degen**: `#3BFFA1` green, `#13C6C2` teal, `#FF4FA3` pink
- **Dark Base**: `#0C0F15` background, `#151921` cards
- **Typography**: Inter font family
- **Animations**: Gold pulse, neon glow effects

## 📊 State Management

Uses Zustand for unified global state:

```javascript
// Access state anywhere
const balance = useGameStore((s) => s.balance);
const buyStream = useGameStore((s) => s.buyStream);

// Actions update globally
buyStream('shitpost', 10);
```

**Features:**
- Single source of truth
- Real-time updates across all components
- LocalStorage persistence
- Optimized selectors

## 🧪 Testing

```bash
# Run development server
npm run dev

# Test checklist:
# ✓ Buy streams → Balance decreases, YPS increases
# ✓ Hire managers → Streams auto-level
# ✓ Buy upgrades → Multipliers apply
# ✓ Prestige → Reset with bonus
# ✓ Arena trades → Balance updates instantly
```

## 🚢 Deployment

### Frontend (Vercel/Netlify)

```bash
cd frontend
npm run build
# Deploy 'dist' folder
```

### Backend (Heroku/Railway)

```bash
cd backend
# Set PORT environment variable
npm start
```

## 🎮 Gameplay Tips

1. **Early Game**: Focus on Shitpost and Engagement streams
2. **Managers**: Hire managers ASAP for automation
3. **Upgrades**: Balance click vs global upgrades
4. **Prestige**: Wait until YPS > 500 for good bonus
5. **Arena**: Start small, learn the volatility patterns

## 🏆 Coming Soon

- **Leaderboard**: Compete with other players
- **Achievements**: Unlock system
- **Sound Effects**: Audio feedback
- **Social Features**: Share wins

## 📝 License

MIT License - feel free to use this project however you'd like!

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 💬 Support

Found a bug? Have a feature request? Open an issue on GitHub!

---

**Made with 💰 by degens, for degens**
