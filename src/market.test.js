import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchMarkets, portfolioSummary, sparklinePoints } from './market.js';

const raw = { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 100, market_cap: 2000, total_volume: 300, price_change_percentage_24h: 5, price_change_percentage_7d_in_currency: -2, high_24h: 110, low_24h: 90, sparkline_in_7d: { price: [90, 100, 95] } };
describe('market model', () => {
  it('loads and normalizes live API payloads', async () => {
    let requested = '';
    const fetchImpl = async url => { requested = url; return { ok: true, json: async () => [raw] }; };
    const result = await fetchMarkets({ ids: ['bitcoin'], currency: 'cad', fetchImpl });
    assert.equal(result[0].symbol, 'BTC'); assert.equal(result[0].change7d, -2); assert.match(requested, /vs_currency=cad/);
  });
  it('surfaces rate limiting and malformed payloads', async () => {
    await assert.rejects(fetchMarkets({ fetchImpl: async () => ({ ok: false, status: 429 }) }), /rate limit/);
    await assert.rejects(fetchMarkets({ fetchImpl: async () => ({ ok: true, json: async () => ({}) }) }), /invalid response/);
  });
  it('calculates portfolio value and daily movement', () => {
    const market = { id: 'bitcoin', symbol: 'BTC', price: 100, change24h: 5 };
    assert.deepEqual(portfolioSummary([market], { bitcoin: 2 }), { positions: [{ id: 'bitcoin', symbol: 'BTC', amount: 2, value: 200, dailyChange: 10 }], total: 200, dailyChange: 10 });
  });
  it('creates bounded sparkline coordinates', () => {
    assert.equal(sparklinePoints([10, 20], 100, 40), '0.0,40.0 100.0,0.0');
    assert.equal(sparklinePoints([]), '');
  });
});
