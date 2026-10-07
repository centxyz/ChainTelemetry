import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_IDS, fetchMarkets, portfolioSummary, sparklinePoints } from './market.js';
import './App.css';

const money = (value, currency) => new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: Math.abs(value) < 1 ? 6 : 2 }).format(value);
const compact = (value, currency) => new Intl.NumberFormat(undefined, { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 2 }).format(value);
const HOLDINGS_KEY = 'chaintelemetry:holdings';

export default function App() {
  const [currency, setCurrency] = useState('USD');
  const [markets, setMarkets] = useState([]);
  const [holdings, setHoldings] = useState(() => { try { return JSON.parse(localStorage.getItem(HOLDINGS_KEY) || localStorage.getItem('candlecurrent:holdings') || localStorage.getItem('cryptopulse:holdings')) || {}; } catch { return {}; } });
  const [query, setQuery] = useState(''); const [sort, setSort] = useState('marketCap');
  const [state, setState] = useState({ loading: true, error: '', updated: null });

  const refresh = useCallback(async () => {
    setState(current => ({ ...current, loading: true, error: '' }));
    try { setMarkets(await fetchMarkets({ ids: DEFAULT_IDS, currency })); setState({ loading: false, error: '', updated: new Date() }); }
    catch (error) { setState(current => ({ ...current, loading: false, error: error.message })); }
  }, [currency]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { localStorage.setItem(HOLDINGS_KEY, JSON.stringify(holdings)); }, [holdings]);

  const shown = useMemo(() => markets.filter(market => `${market.name} ${market.symbol}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'change24h' ? b.change24h - a.change24h : sort === 'price' ? b.price - a.price : b.marketCap - a.marketCap), [markets, query, sort]);
  const portfolio = useMemo(() => portfolioSummary(markets, holdings), [markets, holdings]);
  const positive = portfolio.dailyChange >= 0;

  return <div className="app"><header><div className="brand"><i />CHAIN<span>TELEMETRY</span></div><div className="status"><b className={state.error ? 'offline' : ''} />{state.error ? 'FEED INTERRUPTED' : 'LIVE MARKET FEED'}</div><select value={currency} onChange={event => setCurrency(event.target.value)} aria-label="Currency"><option>USD</option><option>CAD</option><option>EUR</option><option>GBP</option></select><button onClick={refresh} disabled={state.loading}>{state.loading ? 'Syncing…' : 'Refresh'}</button></header>
    <main><section className="overview"><div><span className="kicker">PERSONAL MARKET TERMINAL</span><h1>Track the market.<br/><em>Know your exposure.</em></h1></div><div className="portfolio"><span>PORTFOLIO VALUE</span><strong>{money(portfolio.total, currency)}</strong><small className={positive ? 'up' : 'down'}>{positive ? '+' : ''}{money(portfolio.dailyChange, currency)} today</small></div></section>
      {state.error && <div className="alert"><span>{state.error}</span><button onClick={refresh}>Try again</button></div>}
      <section className="controls"><input placeholder="Search tracked assets" value={query} onChange={event => setQuery(event.target.value)} /><select value={sort} onChange={event => setSort(event.target.value)} aria-label="Sort markets"><option value="marketCap">Market cap</option><option value="price">Price</option><option value="change24h">24h change</option></select><span>{state.updated ? `Updated ${state.updated.toLocaleTimeString()}` : 'Awaiting first update'}</span></section>
      <section className="table"><div className="row headings"><span>Asset</span><span>Price</span><span>24H</span><span>7D trend</span><span>Market cap</span><span>Your units</span></div>
        {!shown.length && !state.loading && <div className="empty">{state.error ? 'Existing portfolio data remains local. Refresh when the feed recovers.' : 'No tracked asset matches this search.'}</div>}
        {shown.map(market => <div className="row" key={market.id}><div className="asset">{market.image ? <img src={market.image} alt=""/> : <i/>}<div><b>{market.name}</b><small>{market.symbol}</small></div></div><div><b>{money(market.price, currency)}</b><small>{money(market.low24h, currency)}–{money(market.high24h, currency)}</small></div><div className={market.change24h >= 0 ? 'up' : 'down'}>{market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%</div><div><svg viewBox="0 0 160 44" preserveAspectRatio="none" className={market.change7d >= 0 ? 'line-up' : 'line-down'}><polyline points={sparklinePoints(market.sparkline)} /></svg><small>{market.change7d >= 0 ? '+' : ''}{market.change7d.toFixed(2)}%</small></div><div><b>{compact(market.marketCap, currency)}</b><small>Vol {compact(market.volume, currency)}</small></div><label className="units"><input type="number" min="0" step="any" value={holdings[market.id] || ''} placeholder="0" onChange={event => setHoldings(current => ({ ...current, [market.id]: event.target.value }))}/><small>{money((Number(holdings[market.id]) || 0) * market.price, currency)}</small></label></div>)}
      </section><p className="disclaimer">Market data from CoinGecko. Prices may be delayed. Portfolio values stay in this browser and are informational, not financial advice.</p>
    </main></div>;
}
