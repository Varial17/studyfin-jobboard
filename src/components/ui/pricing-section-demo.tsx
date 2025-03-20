
"use client"

import { Sparkles, Zap, ArrowDownToDot } from "lucide-react"
import { PricingSection } from "@/components/ui/pricing-section"

const defaultTiers = [
  {
    name: "Starter",
    price: {
      monthly: 0,
      yearly: 0,
    },
    description: "Basic features for job seekers",
    icon: (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-blue-500/30 blur-2xl rounded-full" />
        <Zap className="w-7 h-7 relative z-10 text-primary dark:text-primary animate-[float_3s_ease-in-out_infinite]" />
      </div>
    ),
    features: [
      {
        name: "Job Search",
        description: "Browse and apply to job listings",
        included: true,
      },
      {
        name: "Profile Creation",
        description: "Create and manage your profile",
        included: true,
      },
      {
        name: "Basic Support",
        description: "Email support with 24h response time",
        included: true,
      },
      {
        name: "Post Jobs",
        description: "Post job listings as an employer",
        included: false,
      },
    ],
    buttonText: "Select Free Plan",
    buttonAction: "selectFree"
  },
  {
    name: "Employer",
    price: {
      monthly: 29,
      yearly: 290,
    },
    description: "Everything you need as an employer",
    highlight: true,
    badge: "Most Popular",
    icon: (
      <div className="relative">
        <ArrowDownToDot className="w-7 h-7 relative z-10 text-primary" />
      </div>
    ),
    features: [
      {
        name: "Unlimited Job Postings",
        description: "Post as many jobs as you need",
        included: true,
      },
      {
        name: "Applicant Management",
        description: "Track and manage applications",
        included: true,
      },
      {
        name: "Priority Support",
        description: "24/7 priority email and chat support",
        included: true,
      },
      {
        name: "Advanced Analytics",
        description: "Deep insights into your job listings",
        included: true,
      },
    ],
    buttonText: "Subscribe Now",
    buttonAction: "checkout"
  },
]

function PricingSectionDemo() {
  return <PricingSection tiers={defaultTiers} />
}

export { PricingSectionDemo }
