
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckIcon, ChevronRightIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface Feature {
  name: string
  description: string
  included: boolean
}

interface PricingTier {
  name: string
  price: {
    monthly: number
    yearly: number
  }
  description: string
  features: Feature[]
  highlight?: boolean
  badge?: string
  icon: React.ReactNode
  buttonText?: string
  buttonAction?: "selectFree" | "checkout"
}

interface PricingSectionProps {
  tiers: PricingTier[]
  className?: string
  onAction?: (action: "selectFree" | "checkout", tier: PricingTier, couponCode?: string) => void
}

function PricingSection({ tiers, className, onAction }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false)
  const navigate = useNavigate()
  const [couponCode, setCouponCode] = useState("")
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleAction = async (tier: PricingTier) => {
    if (tier.buttonAction && tier.buttonAction === "checkout") {
      try {
        setLoading(true);
        
        // Create checkout session using the Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('stripe-subscription', {
          body: JSON.stringify({
            user_id: sessionStorage.getItem('userId') || '',
            user_email: sessionStorage.getItem('userEmail') || '',
            return_url: window.location.origin + '/settings',
            coupon_id: couponCode || undefined
          })
        });

        if (error) {
          console.error('Error creating checkout session:', error);
          toast({
            variant: "destructive",
            title: "Checkout Error",
            description: `Could not initialize checkout: ${error.message || 'Unknown error'}`,
          });
          setLoading(false);
          return;
        }

        if (data?.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          toast({
            variant: "destructive",
            title: "Checkout Error",
            description: "Could not initialize checkout. Please try again.",
          });
          setLoading(false);
        }
      } catch (err) {
        console.error('Checkout session error:', err);
        toast({
          variant: "destructive",
          title: "Checkout Error",
          description: `An unexpected error occurred: ${err.message || 'Unknown error'}`,
        });
        setLoading(false);
      }
      return;
    }
    
    if (onAction && tier.buttonAction) {
      onAction(tier.buttonAction, tier, couponCode);
    }
  }

  const buttonStyles = {
    default: cn(
      "h-12 bg-white dark:bg-zinc-900",
      "hover:bg-zinc-50 dark:hover:bg-zinc-800",
      "text-primary border border-zinc-200 dark:border-zinc-800",
      "hover:border-primary/60 dark:hover:border-primary/60",
      "shadow-sm hover:shadow-md",
      "text-sm font-medium",
    ),
    highlight: cn(
      "h-12 bg-primary hover:bg-primary/90",
      "text-white",
      "shadow-[0_1px_15px_rgba(14,165,233,0.3)]",
      "hover:shadow-[0_1px_20px_rgba(14,165,233,0.4)]",
      "font-semibold text-base",
    ),
  }

  const badgeStyles = cn(
    "px-4 py-1.5 text-sm font-medium",
    "bg-secondary text-white",
    "border-none shadow-lg",
  )

  return (
    <section
      className={cn(
        "relative bg-background text-foreground",
        "py-6 md:py-12",
        "overflow-hidden",
        className,
      )}
    >
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="inline-flex items-center p-1.5 bg-white dark:bg-zinc-800/50 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm">
            {["Monthly", "Yearly"].map((period) => (
              <button
                key={period}
                onClick={() => setIsYearly(period === "Yearly")}
                className={cn(
                  "px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                  (period === "Yearly") === isYearly
                    ? "bg-primary text-white shadow-lg"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-primary dark:hover:text-primary",
                )}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative group backdrop-blur-sm",
                "rounded-3xl transition-all duration-300",
                "flex flex-col",
                tier.highlight
                  ? "bg-gradient-to-b from-blue-50/80 to-transparent dark:from-blue-400/[0.15]"
                  : "bg-white dark:bg-zinc-800/50",
                "border",
                tier.highlight
                  ? "border-primary/30 dark:border-primary/20 shadow-xl"
                  : "border-zinc-200 dark:border-zinc-700 shadow-md",
                "hover:translate-y-0 hover:shadow-lg",
              )}
            >
              {tier.badge && tier.highlight && (
                <div className="absolute -top-4 left-6">
                  <Badge className={badgeStyles}>{tier.badge}</Badge>
                </div>
              )}

              <div className="p-8 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={cn(
                      "p-3 rounded-xl",
                      tier.highlight
                        ? "bg-blue-100 dark:bg-blue-900/30 text-primary dark:text-primary"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
                    )}
                  >
                    {tier.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {tier.name}
                  </h3>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                      ${isYearly ? tier.price.yearly : tier.price.monthly}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      /{isYearly ? "year" : "month"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {tier.description}
                  </p>
                </div>

                <div className="space-y-4">
                  {tier.features.map((feature) => (
                    <div key={feature.name} className="flex gap-4">
                      <div
                        className={cn(
                          "mt-1 p-0.5 rounded-full transition-colors duration-200",
                          feature.included
                            ? "text-primary dark:text-primary"
                            : "text-zinc-400 dark:text-zinc-600",
                        )}
                      >
                        <CheckIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {feature.name}
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 pt-0 mt-auto">
                {tier.highlight && (
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                      Discount Code
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                )}
                <Button
                  className={cn(
                    "w-full relative transition-all duration-300",
                    tier.highlight
                      ? buttonStyles.highlight
                      : buttonStyles.default,
                  )}
                  onClick={() => handleAction(tier)}
                  disabled={loading}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading && tier.buttonAction === "checkout" ? "Processing..." : (tier.buttonText || (tier.highlight ? 'Subscribe Now' : 'Get Started'))}
                    {!loading && <ChevronRightIcon className="w-4 h-4" />}
                  </span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { PricingSection }
