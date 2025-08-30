"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TransferForm, type FormData } from "./transfer-form"
import { CostAnalysis } from "./cost-analysis"
import { ProviderRecommendations } from "./provider-recommendations"
import { AllProvidersRanked } from "./all-providers-ranked"

export interface AnalysisResponse {
  costs: {
    provider_name: string
    provider_type: string
    fee_cost: number
    fx_cost: number
    total_cost: number
    amount_after_costs: number
    speed_hours?: number
  }[]
  recommendation: {
    best_provider_name: string
    total_cost: number
    savings_over_provider?: string
    savings_amount?: number
  }
  sending_currency: string
  receiving_country: string
  transfer_amount: number
}

export function TransferOptimizer() {
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTransferSubmit = async (data: FormData) => {
    setIsAnalyzing(true)
    setError(null)
    setAnalysisData(null) // Clear previous results

    try {
      const response = await fetch("http://127.0.0.1:8000/api/transfer/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: data.amount,
          source_country: data.fromCountry,
          destination_country: data.toCountry,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "An unknown error occurred.")
      }

      const result: AnalysisResponse = await response.json()
      setAnalysisData(result)
    } catch (err: any) {
      setError(err.message || "Failed to analyze transfer costs. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Calculate Transfer Costs</CardTitle>
          <CardDescription>Enter your transfer details to compare costs across providers</CardDescription>
        </CardHeader>
        <CardContent>
          <TransferForm onSubmit={handleTransferSubmit} isLoading={isAnalyzing} />
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {isAnalyzing && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Analyzing transfer costs across providers...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {analysisData && !isAnalyzing && (
        <>
          <div className="grid gap-8 lg:grid-cols-2">
            <CostAnalysis analysisData={analysisData} />
            <ProviderRecommendations analysisData={analysisData} />
          </div>
          <AllProvidersRanked analysisData={analysisData} />
        </>
      )}
    </div>
  )
}
