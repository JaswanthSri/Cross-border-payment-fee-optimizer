"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth"

interface RegisterFormProps {
  onSwitchToLogin: () => void
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [countryOfResidence, setCountryOfResidence] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [usernameError, setUsernameError] = useState("")
  const { register, isLoading, error, clearError } = useAuth()

  const countries = [
    "United States", "India", "United Kingdom", "Germany", "France", "Canada", 
    "Australia", "Japan", "China", "Brazil", "Mexico", "Nigeria", "Kenya", 
    "South Africa", "Singapore", "Hong Kong", "South Korea", "Russia"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password || !confirmPassword || !name || !countryOfResidence) return
    if (password !== confirmPassword) {
      clearError()
      return
    }

    // Clear any previous errors
    clearError()
    setUsernameError("")

    const success = await register(username, password, name, countryOfResidence)
    if (success) {
      setShowSuccess(true)
      setTimeout(() => {
        onSwitchToLogin()
        setShowSuccess(false)
      }, 2000)
    } else {
      // If registration failed, check if it's a username conflict
      if (error && error.includes("already taken")) {
        setUsernameError("This username is already taken. Please choose a different one.")
        setUsername("")
        setPassword("")
        setConfirmPassword("")
      }
    }
  }

  if (showSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-12 text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h3 className="text-xl font-semibold mb-2">Registration Successful!</h3>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Sign up to start optimizing your transfers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setUsernameError("") // Clear error when user types
              }}
              placeholder="Choose a username"
              required
              disabled={isLoading}
            />
            {usernameError && (
              <p className="text-sm text-destructive">{usernameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country of Residence</Label>
            <Select value={countryOfResidence} onValueChange={setCountryOfResidence} required>
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              disabled={isLoading}
            />
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-destructive">Passwords do not match</p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !username || !password || !confirmPassword || !name || !countryOfResidence || password !== confirmPassword}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm text-primary hover:underline"
              disabled={isLoading}
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 