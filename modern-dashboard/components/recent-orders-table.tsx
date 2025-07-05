"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, MoreHorizontal, Printer } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const orders = [
  {
    id: "10079",
    time: "Jun 29, 2025 10:20 PM",
    customer: "John Doya",
    method: "COD",
    amount: 909.45,
    status: "delivered",
  },
  {
    id: "10076",
    time: "Jun 29, 2025 10:19 PM",
    customer: "John Doya",
    method: "COD",
    amount: 280.25,
    status: "processing",
  },
  {
    id: "10078",
    time: "Jun 29, 2025 8:54 PM",
    customer: "John Doya",
    method: "COD",
    amount: 146.25,
    status: "delivered",
  },
  {
    id: "10077",
    time: "Jun 29, 2025 8:45 PM",
    customer: "John Doya",
    method: "COD",
    amount: 280.25,
    status: "delivered",
  },
  {
    id: "10075",
    time: "Jun 29, 2025 8:34 PM",
    customer: "John Doya",
    method: "COD",
    amount: 200.25,
    status: "delivered",
  },
]

export function RecentOrdersTable() {
  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-800 dark:to-blue-900/20 rounded-t-lg">
        <CardTitle className="text-slate-900 dark:text-white">Recent Orders</CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          You have {orders.length} orders this period.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
              <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Invoice</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Customer</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Method</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Amount</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Status</TableHead>
              <TableHead className="text-right text-slate-700 dark:text-slate-300 font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order, index) => (
              <TableRow
                key={order.id}
                className="border-slate-200 dark:border-slate-700 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 transition-all duration-200"
              >
                <TableCell className="font-bold text-blue-600 dark:text-blue-400">#{order.id}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{order.customer}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{order.time}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
                  >
                    {order.method}
                  </Badge>
                </TableCell>
                <TableCell className="font-bold text-slate-900 dark:text-white">${order.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge
                    variant={order.status === "delivered" ? "default" : "secondary"}
                    className={
                      order.status === "delivered"
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm"
                        : "bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 border-orange-200 dark:from-orange-900/30 dark:to-yellow-900/30 dark:text-orange-300 dark:border-orange-700"
                    }
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl"
                    >
                      <DropdownMenuItem className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <Eye className="mr-2 h-4 w-4 text-blue-500" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <Printer className="mr-2 h-4 w-4 text-green-500" />
                        Print Invoice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
