import { NextResponse } from "next/server";

const timeframes = {
  "5m": "5min",
  "15m": "15min",
  "1h": "1h",
} as const;

type TimeframeKey = keyof typeof timeframes;

function buildPlaceholderResponse(status: string, message: string) {
  return {
    symbol: "NVDA",
    provider: "twelvedata",
    status,
    message,
    timeframes: Object.fromEntries(
      Object.keys(timeframes).map((key) => [key, {
        price: null,
        trend: null,
        support: null,
        resistance: null,
        ema9: null,
        ema21: null,
        rsi: null,
        macdLine: null,
        macdSignal: null,
        macdHistogram: null,
        bollingerUpper: null,
        bollingerMiddle: null,
        bollingerLower: null,
        vwap: null,
        atr14: null,
        aiSignal: null,
      }]),
    ),
  };
}

function calculateEMA(values: number[], period: number) {
  if (values.length < period) {
    return null;
  }

  const initialAverage = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  const multiplier = 2 / (period + 1);

  let ema = initialAverage;

  for (let index = period; index < values.length; index += 1) {
    ema = (values[index] * multiplier) + (ema * (1 - multiplier));
  }

  return ema;
}

function calculateRSI(values: number[], period: number) {
  if (values.length < period + 1) {
    return null;
  }

  let gains = 0;
  let losses = 0;

  for (let index = 1; index <= period; index += 1) {
    const change = values[index] - values[index - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  const averageGain = gains / period;
  const averageLoss = losses / period;

  if (averageLoss === 0) {
    return 100;
  }

  const rs = averageGain / averageLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(values: number[]) {
  if (values.length < 26) {
    return null;
  }

  const initialEma12 = values.slice(0, 12).reduce((sum, value) => sum + value, 0) / 12;
  const initialEma26 = values.slice(0, 26).reduce((sum, value) => sum + value, 0) / 26;
  const multiplier12 = 2 / (12 + 1);
  const multiplier26 = 2 / (26 + 1);

  const ema12Series = [] as number[];
  const ema26Series = [] as number[];

  let ema12Value = initialEma12;
  let ema26Value = initialEma26;

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (index === 0) {
      ema12Series.push(initialEma12);
      ema26Series.push(initialEma26);
      continue;
    }

    ema12Value = (value * multiplier12) + (ema12Value * (1 - multiplier12));
    ema26Value = (value * multiplier26) + (ema26Value * (1 - multiplier26));
    ema12Series.push(ema12Value);
    ema26Series.push(ema26Value);
  }

  const macdLineSeries = ema12Series.map((value, index) => value - (ema26Series[index] ?? value));

  if (macdLineSeries.length < 9) {
    return null;
  }

  const macdLine = macdLineSeries[macdLineSeries.length - 1];
  const signalLine = calculateEMA(macdLineSeries, 9);
  const histogram = typeof signalLine === "number" ? macdLine - signalLine : null;

  return {
    macdLine,
    macdSignal: signalLine,
    macdHistogram: histogram,
  };
}

function calculateBollingerBands(values: number[]) {
  if (values.length < 20) {
    return null;
  }

  const period = 20;
  const slice = values.slice(-period);
  const middleBand = slice.reduce((sum, value) => sum + value, 0) / period;
  const variance = slice.reduce((sum, value) => sum + ((value - middleBand) ** 2), 0) / period;
  const standardDeviation = Math.sqrt(variance);
  const upperBand = middleBand + (standardDeviation * 2);
  const lowerBand = middleBand - (standardDeviation * 2);

  return {
    bollingerUpper: upperBand,
    bollingerMiddle: middleBand,
    bollingerLower: lowerBand,
  };
}

function calculateVWAP(values: Array<{ close?: string | number | null; volume?: string | number | null }>) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  let totalVolume = 0;
  let totalVolumePrice = 0;

  for (const entry of values) {
    const price = Number(entry.close);
    const volume = Number(entry.volume);

    if (!Number.isFinite(price) || !Number.isFinite(volume) || volume <= 0) {
      continue;
    }

    totalVolume += volume;
    totalVolumePrice += price * volume;
  }

  if (totalVolume === 0) {
    return null;
  }

  return totalVolumePrice / totalVolume;
}

function calculateATR14(values: Array<{ high?: string | number | null; low?: string | number | null; close?: string | number | null }>) {
  if (!Array.isArray(values) || values.length < 2) {
    return null;
  }

  const trueRanges: number[] = [];

  for (let index = 1; index < values.length; index += 1) {
    const previousClose = Number(values[index - 1]?.close);
    const currentHigh = Number(values[index]?.high);
    const currentLow = Number(values[index]?.low);

    if (!Number.isFinite(previousClose) || !Number.isFinite(currentHigh) || !Number.isFinite(currentLow)) {
      continue;
    }

    const range1 = currentHigh - currentLow;
    const range2 = Math.abs(currentHigh - previousClose);
    const range3 = Math.abs(currentLow - previousClose);
    trueRanges.push(Math.max(range1, range2, range3));
  }

  if (trueRanges.length < 14) {
    return null;
  }

  const recentRanges = trueRanges.slice(-14);
  const average = recentRanges.reduce((sum, value) => sum + value, 0) / recentRanges.length;

  return average;
}

function calculateAISignal(trend: string | null, ema9: number | null, ema21: number | null, rsi: number | null) {
  const trendIsBullish = trend === "Bullish";
  const trendIsBearish = trend === "Bearish";
  const emaBullish = typeof ema9 === "number" && typeof ema21 === "number" && ema9 >= ema21;
  const emaBearish = typeof ema9 === "number" && typeof ema21 === "number" && ema9 < ema21;
  const rsiValue = typeof rsi === "number" ? rsi : null;
  const rsiBullish = typeof rsiValue === "number" && rsiValue > 50;
  const rsiBearish = typeof rsiValue === "number" && rsiValue < 50;

  const bullishSignals = Number(trendIsBullish) + Number(emaBullish) + Number(rsiBullish);
  const bearishSignals = Number(trendIsBearish) + Number(emaBearish) + Number(rsiBearish);

  if (bullishSignals > bearishSignals) {
    return "Bullish";
  }

  if (bearishSignals > bullishSignals) {
    return "Bearish";
  }

  return "Neutral";
}

async function fetchTimeframeData(timeframe: TimeframeKey) {
  const apiKey = process.env.TWELVE_DATA_API_KEY?.trim();

  if (!apiKey) {
    return {
      timeframe,
      data: null,
      status: "missing_api_key",
      message: "TWELVE_DATA_API_KEY is not configured.",
    };
  }

  const url = `https://api.twelvedata.com/time_series?symbol=NVDA&interval=${timeframes[timeframe]}&apikey=${encodeURIComponent(apiKey)}&outputsize=50`;
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Twelve Data request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const values = Array.isArray(payload?.values) ? payload.values : [];
  const latest = values[0];

  if (!latest) {
    throw new Error("Twelve Data returned no market data values.");
  }

  const closes = values
    .map((entry: { close?: string | number | null }) => Number(entry.close))
    .filter((value: number) => Number.isFinite(value));
  const vwap = calculateVWAP(values as Array<{ close?: string | number | null; volume?: string | number | null }>);
  const atr14 = calculateATR14(values as Array<{ high?: string | number | null; low?: string | number | null; close?: string | number | null }>);

  const close = Number(latest.close);
  const open = Number(latest.open);
  const high = Number(latest.high);
  const low = Number(latest.low);
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const bollinger = calculateBollingerBands(closes);
  const aiSignal = calculateAISignal(close >= open ? "Bullish" : "Bearish", ema9, ema21, rsi);

  return {
    timeframe,
    data: {
      price: Number.isFinite(close) ? close : null,
      trend: close >= open ? "Bullish" : "Bearish",
      support: Number.isFinite(low) ? low : null,
      resistance: Number.isFinite(high) ? high : null,
      ema9: Number.isFinite(ema9 ?? NaN) ? ema9 : null,
      ema21: Number.isFinite(ema21 ?? NaN) ? ema21 : null,
      rsi: Number.isFinite(rsi ?? NaN) ? rsi : null,
      macdLine: Number.isFinite(macd?.macdLine ?? NaN) ? macd?.macdLine : null,
      macdSignal: Number.isFinite(macd?.macdSignal ?? NaN) ? macd?.macdSignal : null,
      macdHistogram: Number.isFinite(macd?.macdHistogram ?? NaN) ? macd?.macdHistogram : null,
      bollingerUpper: Number.isFinite(bollinger?.bollingerUpper ?? NaN) ? bollinger?.bollingerUpper : null,
      bollingerMiddle: Number.isFinite(bollinger?.bollingerMiddle ?? NaN) ? bollinger?.bollingerMiddle : null,
      bollingerLower: Number.isFinite(bollinger?.bollingerLower ?? NaN) ? bollinger?.bollingerLower : null,
      vwap: Number.isFinite(vwap ?? NaN) ? vwap : null,
      atr14: Number.isFinite(atr14 ?? NaN) ? atr14 : null,
      aiSignal,
    },
    status: "ok",
    message: "Market data retrieved successfully.",
  };
}

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(buildPlaceholderResponse("missing_api_key", "TWELVE_DATA_API_KEY is not configured yet."), {
      status: 503,
    });
  }

  try {
    const results = await Promise.all(
      (Object.keys(timeframes) as TimeframeKey[]).map((timeframe) => fetchTimeframeData(timeframe)),
    );

    const timeframesData = Object.fromEntries(
      results.map((result) => [result.timeframe, result.data]),
    );

    return NextResponse.json({
      symbol: "NVDA",
      provider: "twelvedata",
      status: "ok",
      message: "Market data retrieved successfully.",
      timeframes: timeframesData,
    });
  } catch (error) {
    return NextResponse.json(
      buildPlaceholderResponse("provider_error", error instanceof Error ? error.message : "Unable to fetch market data."),
      {
        status: 502,
      },
    );
  }
}
