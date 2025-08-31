"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, LogOut, History, Globe } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { AuthModal } from "./auth/auth-modal"
import { TransferHistory } from "./transfer-history"

export function Header() {
  const { user, logout } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  return (
    <>
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-bold text-foreground">
                Payment Optimizer
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    History
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {user.name}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={logout}
                      className="flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Transfer History Panel */}
      {showHistory && user && (
        <div className="bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <TransferHistory />
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  )
} 