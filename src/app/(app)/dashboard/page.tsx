"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  CheckCircle,
  Clock,
  ShoppingCart,
  Truck,
  Building2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
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
import StatusBadge from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Profile } from "@/lib/types";

interface DashboardStats {
  totalRequests: number;
  pendingApprovals: number;
  approvedRequests: number;
  processingRequests: number;
  activePOs: number;
  pendingDeliveries: number;
  completedProcurements: number;
  totalSuppliers: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    pendingApprovals: 0,
    approvedRequests: 0,
    processingRequests: 0,
    activePOs: 0,
    pendingDeliveries: 0,
    completedProcurements: 0,
    totalSuppliers: 0,
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      const supabase = createClient();

      const [
        totalRequests,
        pendingApprovals,
        approvedRequests,
        processingRequests,
        activePOs,
        pendingDeliveries,
        completedProcurements,
        totalSuppliers,
        recentReqs,
        statusCounts,
      ] = await Promise.all([
        supabase.from("procurement_requests").select("*", { count: "exact", head: true }),
        supabase.from("procurement_requests").select("*", { count: "exact", head: true }).eq("status", "submitted"),
        supabase.from("procurement_requests").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("procurement_requests").select("*", { count: "exact", head: true }).eq("status", "processing"),
        supabase.from("purchase_orders").select("*", { count: "exact", head: true }).in("status", ["issued", "acknowledged", "partially_delivered"]),
        supabase.from("deliveries").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("procurement_requests").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("suppliers").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("procurement_requests").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("procurement_requests").select("status"),
      ]);

      setStats({
        totalRequests: totalRequests.count ?? 0,
        pendingApprovals: pendingApprovals.count ?? 0,
        approvedRequests: approvedRequests.count ?? 0,
        processingRequests: processingRequests.count ?? 0,
        activePOs: activePOs.count ?? 0,
        pendingDeliveries: pendingDeliveries.count ?? 0,
        completedProcurements: completedProcurements.count ?? 0,
        totalSuppliers: totalSuppliers.count ?? 0,
      });

      setRecentRequests(recentReqs.data ?? []);

      // Process status data for pie chart
      const statusMap: Record<string, number> = {};
      (statusCounts.data ?? []).forEach((r: any) => {
        statusMap[r.status] = (statusMap[r.status] || 0) + 1;
      });
      const chartData = Object.entries(statusMap).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
        value: count,
      }));
      setStatusData(chartData);

      setLoading(false);
    };

    loadDashboard().catch(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Total Requests", value: stats.totalRequests, icon: <FileText size={20} />, color: "bg-blue-50 text-blue-600" },
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: <Clock size={20} />, color: "bg-amber-50 text-amber-600" },
    { label: "Approved", value: stats.approvedRequests, icon: <CheckCircle size={20} />, color: "bg-green-50 text-green-600" },
    { label: "Processing", value: stats.processingRequests, icon: <TrendingUp size={20} />, color: "bg-purple-50 text-purple-600" },
    { label: "Active POs", value: stats.activePOs, icon: <ShoppingCart size={20} />, color: "bg-indigo-50 text-indigo-600" },
    { label: "Pending Deliveries", value: stats.pendingDeliveries, icon: <Truck size={20} />, color: "bg-orange-50 text-orange-600" },
    { label: "Completed", value: stats.completedProcurements, icon: <CheckCircle size={20} />, color: "bg-teal-50 text-teal-600" },
    { label: "Active Suppliers", value: stats.totalSuppliers, icon: <Building2 size={20} />, color: "bg-cyan-50 text-cyan-600" },
  ];

  const PIE_COLORS = ["#2563eb", "#f59e0b", "#16a34a", "#dc2626", "#7c3aed", "#0891b2", "#ea580c"];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Overview of procurement activities
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div className={`rounded-lg p-2.5 ${card.color}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-sm font-semibold text-foreground">
            Request Status Distribution
          </h3>
          {statusData.length > 0 ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4 flex h-64 items-center justify-center text-sm text-text-secondary">
              No data available
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {statusData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                />
                <span className="text-xs text-text-secondary">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-sm font-semibold text-foreground">
            Recent Requests
          </h3>
          {recentRequests.length > 0 ? (
            <div className="mt-4 space-y-3">
              {recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {req.title}
                    </p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {req.request_number} · {formatDate(req.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex h-64 items-center justify-center text-sm text-text-secondary">
              No recent requests
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {stats.pendingApprovals > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle size={20} className="text-amber-600" />
          <p className="text-sm text-amber-800">
            You have <strong>{stats.pendingApprovals}</strong> procurement request(s) pending approval.
          </p>
        </div>
      )}
    </div>
  );
}
