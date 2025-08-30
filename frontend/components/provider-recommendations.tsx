"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Clock, Shield, Star, TrendingUp, HelpCircle, Receipt, Percent } from "lucide-react"
import type { AnalysisResponse } from "./transfer-optimizer"
import { getStandardCurrencyCode } from "@/lib/currency";

// --- Define a new, more explicit type for our provider data ---
// This resolves the TypeScript error by clearly defining all expected properties.
type ProviderWithRating = {
  provider_name: string;
  provider_type: string;
  fee_cost: number;
  fx_cost: number;
  total_cost: number;
  amount_after_costs: number;
  speed_hours?: number;
  live_exchange_rate?: number; // The crucial optional property
  rating: string; // The new simulated property
};

interface ProviderRecommendationsProps {
  analysisData: AnalysisResponse
}

export function ProviderRecommendations({ analysisData }: ProviderRecommendationsProps) {
  const { costs: providers, recommendation, sending_currency, transfer_amount, receiving_country } = analysisData
  
  // --- SIMULATE DYNAMIC DATA for ratings ---
  const providersWithSimulatedData: ProviderWithRating[] = providers.map(provider => {
    const baseRating = 4.9;
    const ratingDeduction = (provider.total_cost / transfer_amount) * 20;
    const simulatedRating = Math.max(3.8, baseRating - ratingDeduction + (Math.random() * 0.2 - 0.1));
    return {
      ...provider,
      rating: simulatedRating.toFixed(1),
    };
  });

  const bestProvider = providersWithSimulatedData[0];
  
  const currencyCode = getStandardCurrencyCode(sending_currency);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-accent" />
          Provider Recommendations
        </CardTitle>
        <CardDescription>
          Personalized recommendations for your {transfer_amount} {currencyCode} transfer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Best Recommendation */}
        <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-primary">{bestProvider.provider_name}</h3>
                <Badge className="bg-primary text-primary-foreground">RECOMMENDED</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {currencyCode} {bestProvider.total_cost.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Cost
              </div>
            </div>
          </div>
        </div>

        {/* --- "The Bottom Line" Section --- */}
        <div className="p-4 bg-muted/50 rounded-lg border">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Why We Recommend {bestProvider.provider_name}
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For this transfer, <strong className="text-foreground">{bestProvider.provider_name} is the clear winner.</strong> It has the lowest total cost, which means the person you're sending money to receives the highest amount possible. A lower total cost is always better for you.
          </p>
        </div>

        {/* --- "Understanding the Costs" Section --- */}
        <div className="p-4 bg-muted/50 rounded-lg border">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Understanding the Costs
            </h4>
            <div className="space-y-3">
                <div className="flex items-start gap-3">
                    <Receipt className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                        <h5 className="font-semibold text-sm">Transfer Fee</h5>
                        <p className="text-xs text-muted-foreground">This is the upfront service charge, like a delivery fee. We look for the lowest one.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Percent className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                        <h5 className="font-semibold text-sm">Exchange Rate Margin (The "Hidden" Cost)</h5>
                        <p className="text-xs text-muted-foreground">This is the profit a provider makes by giving you a slightly worse exchange rate. A smaller margin means more money for your recipient.</p>
                    </div>
                </div>
            </div>
            <p className="text-xs text-center font-semibold text-muted-foreground mt-4 pt-3 border-t">
                Total Cost = Transfer Fee + Exchange Rate Margin
            </p>
        </div>
      </CardContent>
    </Card>
  )
}
