"use client"

import {
  TrendingUp,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  Activity,
  Eye,
  Download,
  Filter,
  Star,
  Zap,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl shadow-black/5 ${className}`}
  >
    {children}
  </div>
)

const StatCard = ({ title, value, change, changeType, icon: Icon, gradient, sparkle }) => (
  <GlassCard className="p-10 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
    <div
      className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
    ></div>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-8">
        <div className={`p-5 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        {sparkle && <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />}
      </div>
      <div className="space-y-3">
        <div className="flex items-center space-x-4">
          <h3 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {value}
          </h3>
          <div
            className={`flex items-center text-sm font-semibold px-4 py-2 rounded-full ${
              changeType === "up" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}
          >
            {changeType === "up" ? (
              <ArrowUpRight className="w-4 h-4 mr-1" />
            ) : (
              <ArrowDownRight className="w-4 h-4 mr-1" />
            )}
            {change}
          </div>
        </div>
        <p className="text-gray-500 font-medium text-lg">{title}</p>
      </div>
    </div>
  </GlassCard>
)

const MetricCard = ({ title, value, icon: Icon, color, trend }) => (
  <GlassCard className="p-8 group hover:shadow-xl transition-all duration-300">
    <div className="flex items-center justify-between mb-6">
      <div className={`p-4 rounded-xl ${color} shadow-lg`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div className="text-right">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{trend}</p>
      </div>
    </div>
    <p className="text-base font-medium text-gray-600">{title}</p>
  </GlassCard>
)

const orders = [
  {
    id: "10079",
    time: "Jun 29, 2025 10:20 PM",
    customer: "John Doya",
    method: "COD",
    amount: 909.45,
    status: "Delivered",
  },
  {
    id: "10076",
    time: "Jun 29, 2025 10:19 PM",
    customer: "John Doya",
    method: "COD",
    amount: 280.25,
    status: "Processing",
  },
  {
    id: "10078",
    time: "Jun 29, 2025 8:54 PM",
    customer: "John Doya",
    method: "COD",
    amount: 146.25,
    status: "Delivered",
  },
  {
    id: "10077",
    time: "Jun 29, 2025 8:45 PM",
    customer: "John Doya",
    method: "COD",
    amount: 280.25,
    status: "Delivered",
  },
  {
    id: "10075",
    time: "Jun 29, 2025 8:34 PM",
    customer: "John Doya",
    method: "COD",
    amount: 200.25,
    status: "Delivered",
  },
  {
    id: "10074",
    time: "Jun 29, 2025 8:24 PM",
    customer: "John Doya",
    method: "COD",
    amount: 280.25,
    status: "Delivered",
  },
  {
    id: "10073",
    time: "Jun 29, 2025 8:13 PM",
    customer: "John Doya",
    method: "COD",
    amount: 129.75,
    status: "Delivered",
  },
  {
    id: "10072",
    time: "Jun 29, 2025 7:59 PM",
    customer: "John Doya",
    method: "COD",
    amount: 680.25,
    status: "Delivered",
  },
]

const getStatusColor = (status) => {
  switch (status) {
    case "Delivered":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    case "Processing":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20"
    case "Pending":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20"
    default:
      return "bg-gray-500/10 text-gray-600 border-gray-500/20"
  }
}

export function DashboardContent() {
  return (
    <div className="relative z-10 pb-8">
      {/* Page Header */}
      <div className="mx-6 mb-8">
        <GlassCard className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-gray-500 mt-2 text-lg">Real-time insights and performance metrics for your business</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Promotion Banner */}
      <div className="mx-6 mb-8">
        <GlassCard className="p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 opacity-90"></div>
          <div className="relative z-10 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <Zap className="w-8 h-8 text-yellow-300" />
                  <h2 className="text-2xl font-bold">Flash Sale Campaign</h2>
                </div>
                <p className="text-white/90 mb-6 text-lg">
                  No active promotions at the moment - Create engaging campaigns to boost your sales performance!
                </p>
                <Button className="px-8 py-4 bg-white/20 hover:bg-white/30 rounded-2xl font-semibold backdrop-blur-sm transition-all duration-300 text-lg border-0">
                  Launch New Campaign
                </Button>
              </div>
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">0</div>
                  <div className="text-white/70">Active Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">12</div>
                  <div className="text-white/70">Scheduled</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">₹45K</div>
                  <div className="text-white/70">Projected Revenue</div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Stats */}
      <div className="mx-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard
            title="Today's Revenue"
            value="₹0.00"
            change="+12.5%"
            changeType="up"
            icon={DollarSign}
            gradient="from-emerald-500 to-teal-600"
            sparkle={true}
          />
          <StatCard
            title="Yesterday's Sales"
            value="₹0.00"
            change="-2.1%"
            changeType="down"
            icon={TrendingUp}
            gradient="from-blue-500 to-indigo-600"
          />
          <StatCard
            title="Monthly Total"
            value="₹11,142.47"
            change="+24.3%"
            changeType="up"
            icon={Target}
            gradient="from-purple-500 to-pink-600"
            sparkle={true}
          />
        </div>
      </div>

      {/* Order Metrics */}
      <div className="mx-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Orders"
            value="43"
            icon={Package}
            color="bg-gradient-to-r from-violet-500 to-purple-600"
            trend="+8 from yesterday"
          />
          <MetricCard
            title="Pending Orders"
            value="0"
            icon={Clock}
            color="bg-gradient-to-r from-amber-500 to-orange-600"
            trend="All orders processed"
          />
          <MetricCard
            title="Processing"
            value="3"
            icon={Activity}
            color="bg-gradient-to-r from-blue-500 to-cyan-600"
            trend="Avg. 2 hours"
          />
          <MetricCard
            title="Completed"
            value="34"
            icon={CheckCircle}
            color="bg-gradient-to-r from-emerald-500 to-green-600"
            trend="94% success rate"
          />
        </div>
      </div>

      {/* Analytics Section */}
      <div className="mx-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Performance */}
          <GlassCard className="p-10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-bold text-gray-900">Weekly Performance</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                  <span className="font-medium text-gray-600">Revenue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  <span className="font-medium text-gray-600">Orders</span>
                </div>
              </div>
            </div>
            <div className="h-80 flex items-end justify-between space-x-4">
              {[500, 800, 1200, 1600, 2000, 2200, 2500].map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 via-teal-500 to-cyan-500 rounded-t-3xl mb-4 transition-all duration-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 shadow-lg relative overflow-hidden"
                    style={{ height: `${(value / 2500) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-500">Day {index + 1}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Top Products */}
          <GlassCard className="p-10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-bold text-gray-900">Top Selling Products</h3>
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700 font-semibold">
                View All Products
              </Button>
            </div>
            <div className="space-y-8">
              {[
                { name: "Mega Combo Deal", sales: 45, revenue: "₹25,420", color: "from-emerald-500 to-teal-500" },
                {
                  name: "Britannia Sweets & Salt",
                  sales: 30,
                  revenue: "₹15,680",
                  color: "from-blue-500 to-indigo-500",
                },
                {
                  name: "Betty Crocker Vanilla Cake",
                  sales: 20,
                  revenue: "₹8,940",
                  color: "from-purple-500 to-pink-500",
                },
                { name: "Smartline Water", sales: 15, revenue: "₹4,320", color: "from-cyan-500 to-blue-500" },
              ].map((product, index) => (
                <div key={index} className="flex items-center space-x-6 group">
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${product.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}
                  >
                    <Star className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-lg">{product.name}</p>
                    <p className="text-gray-500">
                      {product.sales}% of total sales • {product.revenue}
                    </p>
                  </div>
                  <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${product.color} rounded-full transition-all duration-700`}
                      style={{ width: `${product.sales}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Stock Status */}
      <div className="mx-6 mb-8">
        <GlassCard className="p-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Inventory Management</h3>
                <p className="text-emerald-600 font-semibold mt-2 text-lg">
                  Excellent! All products are well stocked 🎉
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">128</p>
                <p className="text-gray-500">Total Products</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-emerald-600">100%</p>
                <p className="text-gray-500">Stock Health</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600">0</p>
                <p className="text-gray-500">Low Stock Alerts</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Orders Table */}
      <div className="mx-6 mb-8">
        <GlassCard className="overflow-hidden">
          <div className="p-10 pb-0">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Recent Order Activity</h3>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors border-0"
                >
                  <Filter className="w-6 h-6 text-gray-600" />
                </Button>
                <Button className="px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-2xl font-semibold transition-colors border-0">
                  Export Data
                </Button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/50">
                  <th className="px-10 py-6 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-8 py-6 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-8 py-6 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-8 py-6 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-8 py-6 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-8 py-6 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-10 py-6 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order.id} className="border-b border-gray-100/50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-10 py-8">
                      <span className="font-mono font-bold text-gray-900 text-lg">#{order.id}</span>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">{order.customer.charAt(0)}</span>
                        </div>
                        <span className="font-semibold text-gray-900 text-lg">{order.customer}</span>
                      </div>
                    </td>
                    <td className="px-8 py-8 text-gray-600">{order.time}</td>
                    <td className="px-8 py-8">
                      <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium">{order.method}</span>
                    </td>
                    <td className="px-8 py-8 font-bold text-gray-900 text-lg">₹{order.amount}</td>
                    <td className="px-8 py-8">
                      <span className={`px-4 py-2 rounded-xl font-medium border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                        >
                          <Eye className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="p-3 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200"
                        >
                          <Download className="w-5 h-5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-8 bg-gray-50/50 border-t border-gray-200/50">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">Showing 1-8 of 37 total orders</p>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium bg-transparent"
                >
                  Previous
                </Button>
                <Button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium border-0">
                  1
                </Button>
                <Button
                  variant="outline"
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium bg-transparent"
                >
                  2
                </Button>
                <Button
                  variant="outline"
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium bg-transparent"
                >
                  3
                </Button>
                <Button
                  variant="outline"
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium bg-transparent"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
