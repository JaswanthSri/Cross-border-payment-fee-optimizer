import { TransferOptimizer } from "@/components/transfer-optimizer"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-balance text-foreground">
              Cross-Border Payment
              <span className="text-primary"> Fee Optimizer</span>
            </h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Compare international money transfer costs across global banks and fintech providers. Get transparent,
              corridor-specific pricing with real market data.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>367 Global Corridors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Real-Time Rates</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                <span>Transparent Pricing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <TransferOptimizer />
      </div>

      <footer className="bg-muted/30 border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Powered by World Bank Remittance Prices Worldwide (RPW) dataset
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
              <span>48 Sending Countries</span>
              <span>•</span>
              <span>105 Receiving Countries</span>
              <span>•</span>
              <span>Real Market Data</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
