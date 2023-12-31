# binance-logger

my trading journal cli to help me track my losses

## Setup

```bash
bun install
```

## Usage

```bash
bun run start
```

Example output:

```bash
$ bun index.ts

╔════════════════════════╤══════════════╤══════╤═══════════╤════════╤════════════╤═════════════╗
║ time                   │ symbol       │ side │ price     │ qty    │ commission │ realizedPnl ║
╟────────────────────────┼──────────────┼──────┼───────────┼────────┼────────────┼─────────────╢
║ 9/24/2023, 5:19:16 AM  │ 1000PEPEUSDT │ SELL │ 0.0006664 │ 125000 │ 0.00014271 │ -1.2688     ║
╟────────────────────────┼──────────────┼──────┼───────────┼────────┼────────────┼─────────────╢
║ 9/24/2023, 5:19:16 AM  │ 1000PEPEUSDT │ SELL │ 0.0006663 │ 125000 │ 0.00014269 │ -1.2813     ║
╟────────────────────────┼──────────────┼──────┼───────────┼────────┼────────────┼─────────────╢
║ 9/24/2023, 11:01:37 AM │ BTCUSDT      │ BUY  │ 26589     │ 0.04   │ 0.00181587 │ -0.008      ║
╟────────────────────────┼──────────────┼──────┼───────────┼────────┼────────────┼─────────────╢
║ total                  │              │      │           │        │ 0.0243     │ xxx         ║
╚════════════════════════╧══════════════╧══════╧═══════════╧════════╧════════════╧═════════════╝

number of trades: 90
wins: 17
losses: 35
win-loss ratio: 32.69 %

╔══════════════╤═════════════╤════════╗
║ symbol       │ realizedPnl │ trades ║
╟──────────────┼─────────────┼────────╢
║ 1000PEPEUSDT │ -0.825      │ 6      ║
╟──────────────┼─────────────┼────────╢
║ BTCUSDT      │ -40.9026    │ 19     ║
╚══════════════╧═════════════╧════════╝
```

## TODO

- [ ] set start date in CLI
- [ ] setup cli args
