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
        aiSignal: null,
      }]),
    ),
  };
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

  const url = `https://api.twelvedata.com/time_series?symbol=NVDA&interval=${timeframes[timeframe]}&apikey=${encodeURIComponent(apiKey)}&outputsize=1`;
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Twelve Data request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const latest = payload?.values?.[0];

  if (!latest) {
    throw new Error("Twelve Data returned no market data values.");
  }

  const close = Number(latest.close);
  const open = Number(latest.open);
  const high = Number(latest.high);
  const low = Number(latest.low);

  return {
    timeframe,
    data: {
      price: Number.isFinite(close) ? close : null,
      trend: close >= open ? "Bullish" : "Bearish",
      support: Number.isFinite(low) ? low : null,
      resistance: Number.isFinite(high) ? high : null,
      ema9: null,
      ema21: null,
      rsi: null,
      aiSignal: close >= open ? "Bullish bias" : "Bearish bias",
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
