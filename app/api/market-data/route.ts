import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    symbol: "NVDA",
    provider: "placeholder",
    status: "not_connected",
    message: "Market data API structure is ready for future provider integration.",
    timeframes: {
      "5m": {
        price: null,
        trend: null,
        support: null,
        resistance: null,
        ema9: null,
        ema21: null,
        rsi: null,
        aiSignal: null,
      },
      "15m": {
        price: null,
        trend: null,
        support: null,
        resistance: null,
        ema9: null,
        ema21: null,
        rsi: null,
        aiSignal: null,
      },
      "1h": {
        price: null,
        trend: null,
        support: null,
        resistance: null,
        ema9: null,
        ema21: null,
        rsi: null,
        aiSignal: null,
      },
    },
  });
}
