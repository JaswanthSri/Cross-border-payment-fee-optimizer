"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// --- Define the structure for a single country from our API ---
interface Country {
  country: string
  currency_code: string
  currency_name: string
}

// --- Define the structure of the data this form will send up ---
export interface FormData {
  amount: number
  fromCountry: string
  toCountry: string
}

interface TransferFormProps {
  onSubmit: (data: FormData) => void
  isLoading: boolean
}

export function TransferForm({ onSubmit, isLoading }: TransferFormProps) {
  const [amount, setAmount] = useState("1000")
  const [fromCountry, setFromCountry] = useState("United States")
  const [toCountry, setToCountry] = useState("India")

  // --- State for the dropdown lists ---
  const [sourceCountries, setSourceCountries] = useState<Country[]>([])
  const [destinationCountries, setDestinationCountries] = useState<Country[]>([])

  // --- 1. Fetch the initial list of SOURCE countries on component load ---
  useEffect(() => {
    const fetchSourceCountries = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/countries")
        if (!response.ok) throw new Error("Failed to fetch source countries")
        const data: Country[] = await response.json()
        setSourceCountries(data.sort((a, b) => a.country.localeCompare(b.country)))
      } catch (error) {
        console.error("Error fetching source countries:", error)
      }
    }
    fetchSourceCountries()
  }, [])

  // --- 2. Fetch DESTINATION countries whenever the SOURCE country changes ---
  useEffect(() => {
    if (fromCountry) {
      const fetchDestinations = async () => {
        try {
          const response = await fetch(`http://127.0.0.1:8000/api/destinations/${fromCountry}`);
          if (!response.ok) throw new Error("Failed to fetch destinations");
          const data: Country[] = await response.json();
          setDestinationCountries(data.sort((a, b) => a.country.localeCompare(b.country)));
          
          // If the current 'toCountry' is not in the new list, reset it
          if (!data.some(c => c.country === toCountry)) {
            setToCountry(""); // This will prompt the user to select a valid country
          }

        } catch (error) {
          console.error("Error fetching destinations:", error);
          setDestinationCountries([]); // Clear list on error
          setToCountry("");
        }
      };
      fetchDestinations();
    }
  }, [fromCountry]); // This effect re-runs every time 'fromCountry' changes

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromCountry || !toCountry || !amount) {
      return
    }
    onSubmit({
      amount: Number.parseFloat(amount),
      fromCountry,
      toCountry,
    })
  }

  const fromCountryData = sourceCountries.find((c) => c.country === fromCountry)
  const toCountryData = destinationCountries.find((c) => c.country === toCountry)

  const isButtonDisabled = isLoading || !amount || !fromCountry || !toCountry

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="amount">Transfer Amount</Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-16"
              min="1"
              step="0.01"
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
              {fromCountryData?.currency_code || "..."}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>From Country</Label>
          <Select value={fromCountry} onValueChange={setFromCountry} required>
            <SelectTrigger>
              <SelectValue placeholder="Select sending country" />
            </SelectTrigger>
            <SelectContent>
              {sourceCountries.map((country) => (
                <SelectItem key={country.country} value={country.country}>
                  <div className="flex items-center gap-2">
                    <span>{country.country}</span>
                    <span className="text-muted-foreground">({country.currency_code})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>To Country</Label>
          <Select value={toCountry} onValueChange={setToCountry} required disabled={!fromCountry || destinationCountries.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder="Select receiving country" />
            </SelectTrigger>
            <SelectContent>
              {destinationCountries.map((country) => (
                <SelectItem key={country.country} value={country.country}>
                  <div className="flex items-center gap-2">
                    <span>{country.country}</span>
                    <span className="text-muted-foreground">({country.currency_code})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="text-sm text-muted-foreground">
          {fromCountryData && toCountryData && (
            <span>
              Converting {fromCountryData.currency_code} to {toCountryData.currency_code}
            </span>
          )}
        </div>
        <Button
          type="submit"
          disabled={isButtonDisabled}
          className="min-w-32"
        >
          {isLoading ? "Analyzing..." : "Compare Costs"}
        </Button>
      </div>
    </form>
  )
}
