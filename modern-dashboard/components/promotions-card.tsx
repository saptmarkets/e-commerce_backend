"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Megaphone } from "lucide-react"

export function PromotionsCard() {
  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Megaphone className="h-4 w-4 text-white" />
          </div>
          Active Promotions
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Manage your current promotional campaigns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 mb-4">
            <Megaphone className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No active promotions</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Create your first promotion to boost sales and engage customers
          </p>
          <Button
            className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25 border-0"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Promotion
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
