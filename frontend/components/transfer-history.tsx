"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, DollarSign, TrendingUp } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { getStandardCurrencyCode } from "@/lib/currency"

export function TransferHistory() {
  const { transferHistory, user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)

  if (!user || transferHistory.length === 0) {
    return null
  }

  const recentHistory = isExpanded ? transferHistory : transferHistory.slice(0, 5)

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Transfer History
        </CardTitle>
        <CardDescription>
          Your recent transfer cost analyses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentHistory.map((transfer) => (
            <div
              key={transfer.transfer_id}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {transfer.source_country} → {transfer.destination_country}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Amount: {formatAmount(transfer.amount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Cost: {formatAmount(transfer.total_cost)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-1">
                    {transfer.best_provider}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(transfer.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {transferHistory.length > 5 && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full"
            >
              {isExpanded ? "Show Less" : `Show All ${transferHistory.length} Transfers`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 