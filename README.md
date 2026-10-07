# ChainTelemetry

ChainTelemetry is a live cryptocurrency market terminal and private browser-based portfolio tracker. It retrieves current market data from CoinGecko, charts seven-day movement, tracks local asset quantities, and calculates current value and approximate daily movement without sending portfolio holdings to a server.

## Features

- Live price, 24-hour range, volume, market cap, and 24-hour/7-day change
- Compact seven-day sparkline for every tracked asset
- USD, CAD, EUR, and GBP display currencies
- Search and sorting by market cap, price, or daily change
- Local portfolio quantities and live value calculation
- Explicit loading, API rate-limit, timeout, and malformed-response handling
- Responsive terminal interface; holdings remain in browser `localStorage`

## Run

```bash
git clone https://github.com/centxyz/ChainTelemetry.git
cd ChainTelemetry
npm install
npm run dev
```

CoinGecko's public endpoint may impose rate limits. ChainTelemetry surfaces feed errors and preserves local holdings rather than inventing prices.

## Verify

```bash
npm test
npm run build
```

Tests cover API normalization, query construction, error handling, portfolio calculations, and sparkline geometry.

## Privacy and disclaimer

Only the selected asset identifiers and display currency are sent to CoinGecko. Portfolio quantities remain in the current browser. Market data can be delayed and is informational, not financial advice.

## License

MIT © cent
