"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { AnalysisResponse } from "./transfer-optimizer"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { getStandardCurrencyCode } from "@/lib/currency";

// Register the components Chart.js needs to build a bar chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CostAnalysisProps {
  analysisData: AnalysisResponse
}

export function CostAnalysis({ analysisData }: CostAnalysisProps) {
  const { costs: providers, sending_currency, transfer_amount, receiving_country } = analysisData
  
  const currencyCode = getStandardCurrencyCode(sending_currency);

  // --- Prepare data for the bar chart ---
  const chartData = {
    labels: providers.map((provider) => provider.provider_name),
    datasets: [
      {
        label: `Total Cost (${currencyCode})`,
        data: providers.map((provider) => provider.total_cost),
        backgroundColor: "rgba(22, 163, 74, 0.7)",
        borderColor: "rgba(22, 163, 74, 1)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Total Cost by Provider",
        font: { size: 16, weight: 'bold' },
        color: '#374151',
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#374151',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        callbacks: {
            label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) { label += ': '; }
                if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(context.parsed.y);
                }
                return label;
            }
        }
      }
    },
    scales: {
        y: { beginAtZero: true, ticks: { color: '#6b7280' }, grid: { color: '#e5e7eb' } },
        x: { ticks: { color: '#6b7280' }, grid: { display: false } }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          Cost Analysis
        </CardTitle>
        <CardDescription>
          Comparing costs for {transfer_amount} {currencyCode} to {receiving_country}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-96 relative">
        <Bar options={chartOptions} data={chartData} />
      </CardContent>
    </Card>
  )
}
