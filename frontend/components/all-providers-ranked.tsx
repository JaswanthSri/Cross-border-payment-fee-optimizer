"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AnalysisResponse } from "./transfer-optimizer"
import { getStandardCurrencyCode } from "@/lib/currency";

interface AllProvidersRankedProps {
  analysisData: AnalysisResponse
}

export function AllProvidersRanked({ analysisData }: AllProvidersRankedProps) {
  const { costs: providers, transfer_amount, sending_currency } = analysisData

  // --- SIMULATE DYNAMIC DATA for ratings ---
  const providersWithSimulatedData = providers.map(provider => {
    const baseRating = 4.9;
    const ratingDeduction = (provider.total_cost / transfer_amount) * 20;
    const simulatedRating = Math.max(3.8, baseRating - ratingDeduction + (Math.random() * 0.2 - 0.1));
    return {
      ...provider,
      rating: simulatedRating.toFixed(1),
    };
  });

  const currencyCode = getStandardCurrencyCode(sending_currency);

  const getProviderColor = (type: string) => {
    switch (type) {
      case "fintech": return "bg-primary/10 text-primary border-primary/20"
      case "bank": return "bg-blue-100 text-blue-700 border-blue-200"
      default: return "bg-orange-100 text-orange-700 border-orange-200"
    }
  }

  return (
    <Card className="border-2 border-primary/20 mt-8">
        <CardHeader>
            <CardTitle className="text-2xl text-primary">All Providers Ranked</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providersWithSimulatedData.map((provider, index) => (
                    <div key={provider.provider_name} className="p-4 border rounded-lg flex flex-col justify-between h-full hover:shadow-md transition-shadow">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xl font-bold text-muted-foreground">#{index + 1}</span>
                                <Badge variant="outline" className={getProviderColor(provider.provider_type)}>
                                    {provider.provider_type}
                                </Badge>
                            </div>
                            <p className="font-bold text-foreground text-lg">{provider.provider_name}</p>
                            <p className="text-xs text-muted-foreground">{provider.speed_hours || 24} hours • {provider.rating}/5 rating</p>
                        </div>
                        <div className="mt-4 pt-4 border-t text-right">
                           <div className="font-extrabold text-xl text-foreground">
                             {currencyCode} {provider.total_cost.toFixed(2)}
                           </div>
                           <div className="text-xs text-muted-foreground">Total Cost</div>
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
  )
}
