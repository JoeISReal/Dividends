// Singleton chart instance that persists across tab switches
import { TradingEngine } from '../game/tradingEngine';
import { ChartEngineV2 } from '../game/chartEngineV2';

let globalTradingEngine = null;
let globalChartEngine = null;

export function getChartEngines() {
    if (!globalTradingEngine || !globalChartEngine) {
        globalTradingEngine = new TradingEngine();
        globalChartEngine = new ChartEngineV2(globalTradingEngine);
    }
    return {
        trading: globalTradingEngine,
        chart: globalChartEngine
    };
}
