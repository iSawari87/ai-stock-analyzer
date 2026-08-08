const timeframes = [
  { label: "5m", accent: "from-cyan-500 to-blue-600" },
  { label: "15m", accent: "from-violet-500 to-fuchsia-600" },
  { label: "1h", accent: "from-emerald-500 to-lime-600" },
];

const metrics = [
  { label: "Trend", value: "—" },
  { label: "Support", value: "—" },
  { label: "Resistance", value: "—" },
  { label: "EMA 9", value: "—" },
  { label: "EMA 21", value: "—" },
  { label: "RSI", value: "—" },
  { label: "AI Signal", value: "—" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_35%),linear-gradient(135deg,_#050816_0%,_#02040a_100%)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">NVDA AI Stock Analyzer</p>
              <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Market Pulse Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                A clean and responsive workspace for reviewing multi-timeframe stock insights without live data integration yet.
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
              <p className="font-medium">Status</p>
              <p className="mt-1 text-cyan-100">UI Ready • No live feed connected</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-lg shadow-black/30">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">NVDA Charts</h2>
              <p className="text-sm text-slate-400">TradingView overview</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <iframe
                title="NVDA 5-Minute TradingView Chart"
                src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_nvda_5m&symbol=NASDAQ%3ANVDA&interval=5&theme=dark&style=1&locale=en&toolbarbg=transparent&studies=%5B%5D"
                className="h-[320px] w-full"
                loading="lazy"
              />
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <iframe
                title="NVDA 15-Minute TradingView Chart"
                src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_nvda_15m&symbol=NASDAQ%3ANVDA&interval=15&theme=dark&style=1&locale=en&toolbarbg=transparent&studies=%5B%5D"
                className="h-[320px] w-full"
                loading="lazy"
              />
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <iframe
                title="NVDA 1-Hour TradingView Chart"
                src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_nvda_1h&symbol=NASDAQ%3ANVDA&interval=60&theme=dark&style=1&locale=en&toolbarbg=transparent&studies=%5B%5D"
                className="h-[320px] w-full"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {timeframes.map((timeframe, index) => (
            <article
              key={timeframe.label}
              className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-lg shadow-black/30"
            >
              <div className={`h-1.5 rounded-full bg-gradient-to-r ${timeframe.accent}`} />
              <div className="mt-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">{timeframe.label}</h2>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                  Placeholder
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {metrics.map((metric) => (
                  <div
                    key={`${timeframe.label}-${metric.label}`}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                  >
                    <span className="text-sm text-slate-300">{metric.label}</span>
                    <span className="text-sm font-medium text-slate-100">{metric.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-3 text-center text-sm text-slate-400">
                {index === 0 && "Momentum view placeholder"}
                {index === 1 && "Confluence view placeholder"}
                {index === 2 && "Trend confirmation placeholder"}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}