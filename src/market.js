export const DEFAULT_IDS = ['bitcoin', 'ethereum', 'solana', 'chainlink', 'uniswap'];

export async function fetchMarkets({ ids = DEFAULT_IDS, currency = 'usd', fetchImpl = globalThis.fetch, timeoutMs = 10000 } = {}) {
  if (!Array.isArray(ids) || !ids.length || ids.length > 50) throw new Error('Choose between 1 and 50 assets');
  if (!/^[a-z]{3,5}$/i.test(currency)) throw new Error('Currency must be a 3–5 letter code');
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
  const query = new URLSearchParams({ vs_currency: currency.toLowerCase(), ids: ids.join(','), order: 'market_cap_desc', sparkline: 'true', price_change_percentage: '24h,7d' });
  try {
    const response = await fetchImpl(`https://api.coingecko.com/api/v3/coins/markets?${query}`, { headers: { accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(response.status === 429 ? 'Market API rate limit reached; retry shortly' : `Market API returned HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Market API returned an invalid response');
    return data.map(normalizeMarket);
  } catch (error) {
    if (error.name === 'AbortError') throw new Error(`Market request timed out after ${timeoutMs}ms`);
    throw error;
  } finally { clearTimeout(timer); }
}

export function normalizeMarket(item) {
  if (!item || typeof item.id !== 'string' || !Number.isFinite(item.current_price)) throw new Error('Market item is missing required fields');
  return {
    id: item.id, symbol: String(item.symbol || '').toUpperCase(), name: item.name || item.id, image: item.image || '',
    price: item.current_price, marketCap: Number(item.market_cap) || 0, volume: Number(item.total_volume) || 0,
    change24h: Number(item.price_change_percentage_24h) || 0,
    change7d: Number(item.price_change_percentage_7d_in_currency) || 0,
    high24h: Number(item.high_24h) || 0, low24h: Number(item.low_24h) || 0,
    sparkline: Array.isArray(item.sparkline_in_7d?.price) ? item.sparkline_in_7d.price.filter(Number.isFinite) : []
  };
}

export function portfolioSummary(markets, holdings) {
  const positions = markets.map(market => {
    const amount = Math.max(0, Number(holdings[market.id]) || 0);
    return { id: market.id, symbol: market.symbol, amount, value: amount * market.price, dailyChange: amount * market.price * market.change24h / 100 };
  }).filter(position => position.amount > 0);
  return { positions, total: positions.reduce((sum, position) => sum + position.value, 0), dailyChange: positions.reduce((sum, position) => sum + position.dailyChange, 0) };
}

export function sparklinePoints(values, width = 160, height = 44) {
  if (!values.length) return '';
  const min = Math.min(...values); const max = Math.max(...values); const span = max - min || 1;
  return values.map((value, index) => `${(index / Math.max(1, values.length - 1) * width).toFixed(1)},${(height - ((value - min) / span * height)).toFixed(1)}`).join(' ');
}
