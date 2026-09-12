"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart3, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ReportData {
  totalRequests: number;
  totalSpending: number;
  statusBreakdown: { name: string; value: number }[];
  departmentBreakdown: { name: string; value: number }[];
  monthlyTrend: { month: string; count: number; spending: number }[];
  topSuppliers: { name: string; orders: number; total: number }[];
}

const COLORS = ["#2563eb", "#f59e0b", "#16a34a", "#dc2626", "#7c3aed", "#0891b2", "#ea580c"];

export default function ReportsPage() {
  const [data, setData] = useState<ReportData>({
    totalRequests: 0,
    totalSpending: 0,
    statusBreakdown: [],
    departmentBreakdown: [],
    monthlyTrend: [],
    topSuppliers: [],
  });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [dateFrom, dateTo]);

  const loadReport = async () => {
    const supabase = createClient();

    // Total requests
    let requestQuery = supabase.from("procurement_requests").select("*", { count: "exact", head: true });
    if (dateFrom) requestQuery = requestQuery.gte("created_at", dateFrom);
    if (dateTo) requestQuery = requestQuery.lte("created_at", dateTo + "T23:59:59");
    const { count: totalRequests } = await requestQuery;

    // Total spending from POs
    const { data: pos } = await supabase.from("purchase_orders").select("total_amount");
    const totalSpending = (pos ?? []).reduce((sum, po) => sum + (po.total_amount || 0), 0);

    // Status breakdown
    const { data: allRequests } = await supabase.from("procurement_requests").select("status");
    const statusMap: Record<string, number> = {};
    (allRequests ?? []).forEach((r) => {
      statusMap[r.status] = (statusMap[r.status] || 0) + 1;
    });
    const statusBreakdown = Object.entries(statusMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace("_", " "),
      value,
    }));

    // Department breakdown
    const { data: deptRequests } = await supabase
      .from("procurement_requests")
      .select("department_id, departments(name)");
    const deptMap: Record<string, number> = {};
    (deptRequests ?? []).forEach((r: any) => {
      const deptName = r.departments?.name ?? "Unknown";
      deptMap[deptName] = (deptMap[deptName] || 0) + 1;
    });
    const departmentBreakdown = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

    // Top suppliers
    const { data: supplierPOs } = await supabase
      .from("purchase_orders")
      .select("supplier_id, total_amount, suppliers(name)");
    const supplierMap: Record<string, { name: string; orders: number; total: number }> = {};
    (supplierPOs ?? []).forEach((po: any) => {
      const name = po.suppliers?.name ?? "Unknown";
      if (!supplierMap[po.supplier_id]) {
        supplierMap[po.supplier_id] = { name, orders: 0, total: 0 };
      }
      supplierMap[po.supplier_id].orders++;
      supplierMap[po.supplier_id].total += po.total_amount || 0;
    });
    const topSuppliers = Object.values(supplierMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    setData({
      totalRequests: totalRequests ?? 0,
      totalSpending,
      statusBreakdown,
      departmentBreakdown,
      monthlyTrend: [],
      topSuppliers,
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          <p className="mt-1 text-sm text-text-secondary">Procurement analytics and reporting</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-text-secondary">Total Requests</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{data.totalRequests}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-text-secondary">Total Spending</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{formatCurrency(data.totalSpending)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-text-secondary">Status Categories</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{data.statusBreakdown.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-text-secondary">Active Suppliers</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{data.topSuppliers.length}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-sm font-semibold text-foreground">Status Distribution</h3>
          {data.statusBreakdown.length > 0 ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.statusBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {data.statusBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4 flex h-64 items-center justify-center text-sm text-text-secondary">No data</div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {data.statusBreakdown.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-text-secondary">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-sm font-semibold text-foreground">Requests by Department</h3>
          {data.departmentBreakdown.length > 0 ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.departmentBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4 flex h-64 items-center justify-center text-sm text-text-secondary">No data</div>
          )}
        </div>
      </div>

      {/* Top Suppliers */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-sm font-semibold text-foreground">Top Suppliers by Spending</h3>
        {data.topSuppliers.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-left font-medium text-text-secondary">Supplier</th>
                  <th className="pb-2 text-right font-medium text-text-secondary">Orders</th>
                  <th className="pb-2 text-right font-medium text-text-secondary">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.topSuppliers.map((s, i) => (
                  <tr key={i}>
                    <td className="py-3 font-medium text-foreground">{s.name}</td>
                    <td className="py-3 text-right text-text-secondary">{s.orders}</td>
                    <td className="py-3 text-right text-foreground">{formatCurrency(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-text-secondary">No supplier data available</p>
        )}
      </div>
    </div>
  );
}
