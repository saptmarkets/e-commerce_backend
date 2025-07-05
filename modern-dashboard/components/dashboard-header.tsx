"use client"

import {
  Bell,
  Search,
  Activity,
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  FileText,
  Settings,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl shadow-black/5 ${className}`}
  >
    {children}
  </div>
)

const navigationItems = [
  { icon: Home, label: "Dashboard", active: true },
  { icon: ShoppingCart, label: "Orders", count: 43 },
  { icon: Package, label: "Products", count: 128 },
  { icon: Users, label: "Customers", count: 1205 },
  { icon: BarChart3, label: "Analytics" },
  { icon: FileText, label: "Reports" },
  { icon: Settings, label: "Settings" },
]

export function DashboardHeader({ activeTab, setActiveTab }) {
  return (
    <div className="relative z-10">
      <GlassCard className="m-6 p-6">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">DashBoard</h2>
              <p className="text-sm text-gray-500">Analytics Pro</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                className={`flex items-center justify-between px-6 py-3 rounded-2xl transition-all duration-200 ${
                  item.active
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.count && (
                  <Badge
                    variant="secondary"
                    className={`ml-3 ${item.active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {item.count}
                  </Badge>
                )}
              </button>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search orders, products..."
                className="pl-12 pr-6 py-3 w-80 bg-white/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
              />
            </div>

            {/* Notifications */}
            <Button
              variant="outline"
              size="icon"
              className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0"
            >
              <Bell className="w-5 h-5" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-300"
                >
                  <User className="w-6 h-6 bg-white/20 rounded-full p-1" />
                  <div className="text-left hidden sm:block">
                    <p className="font-semibold text-sm">John Doya</p>
                    <p className="text-xs text-emerald-100">Store Manager</p>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-gray-900">John Doya</p>
                    <p className="text-xs leading-none text-gray-500">Store Manager</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200/50" />
                <DropdownMenuItem className="p-3 hover:bg-gray-50 rounded-xl m-1">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="p-3 hover:bg-gray-50 rounded-xl m-1">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200/50" />
                <DropdownMenuItem className="p-3 hover:bg-red-50 text-red-600 rounded-xl m-1">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* New Order Button */}
            <Button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0">
              New Order
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
