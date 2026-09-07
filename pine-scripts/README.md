# Pine Script Indicators

Standalone TradingView indicators, kept separate from the store app in this
repo. Import a `.pine` file's contents into TradingView's Pine Editor
(Chart -> Pine Editor -> paste -> Add to chart).

## trend-following-donchian.pine

Trend-following signal based on Donchian channel breakouts (Turtle-style),
filtered by an EMA trend direction, with an ATR-based trailing stop.

- **Entry**: price closes above the N-bar high (long) or below the N-bar low
  (short), only in the direction of the EMA trend filter.
- **Exit**: price closes back inside a tighter Donchian channel, or the
  ATR trailing stop is hit — whichever comes first.
- **Inputs**: entry/exit channel lengths, EMA length, ATR length and
  multiplier are all adjustable in the indicator settings.

This is a signal/visualization tool, not an auto-executing strategy — verify
signals and manage position size and risk manually (or via your own
execution layer) before acting on them. Backtest on your target market and
timeframe before trading it live.
