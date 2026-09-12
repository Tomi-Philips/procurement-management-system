"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  Building2,
  FileSearch,
  ShoppingCart,
  Truck,
  BarChart3,
  ClipboardList,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  Package,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Logo from "@/components/logo";
import { useState } from "react";
import type { UserRole } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={20} />,
    roles: ["admin", "requester", "approver", "procurement_officer", "supplier"],
  },
  {
    label: "Procurement",
    href: "#",
    icon: <Package size={20} />,
    roles: ["admin", "requester", "approver", "procurement_officer"],
    children: [
      {
        label: "Requests",
        href: "/procurement/requests",
        icon: <FileText size={18} />,
        roles: ["admin", "requester", "approver", "procurement_officer"],
      },
      {
        label: "Approvals",
        href: "/procurement/approvals",
        icon: <CheckCircle size={18} />,
        roles: ["admin", "approver"],
      },
      {
        label: "Quotations",
        href: "/procurement/quotations",
        icon: <FileSearch size={18} />,
        roles: ["admin", "procurement_officer", "supplier"],
      },
      {
        label: "Purchase Orders",
        href: "/procurement/purchase-orders",
        icon: <ShoppingCart size={18} />,
        roles: ["admin", "procurement_officer", "supplier"],
      },
      {
        label: "Deliveries",
        href: "/procurement/deliveries",
        icon: <Truck size={18} />,
        roles: ["admin", "procurement_officer"],
      },
    ],
  },
  {
    label: "Suppliers",
    href: "/suppliers",
    icon: <Building2 size={20} />,
    roles: ["admin", "procurement_officer"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: <BarChart3 size={20} />,
    roles: ["admin", "procurement_officer"],
  },
  {
    label: "Audit Logs",
    href: "/audit-logs",
    icon: <ClipboardList size={20} />,
    roles: ["admin"],
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: <Bell size={20} />,
    roles: ["admin", "requester", "approver", "procurement_officer", "supplier"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings size={20} />,
    roles: ["admin"],
  },
];

export default function Sidebar({ userRole, onLogout }: { userRole: UserRole; onLogout: () => void }) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Procurement: true,
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const renderNavItem = (item: NavItem) => {
    if (item.children) {
      const filteredChildren = item.children.filter((child) => child.roles.includes(userRole));
      const isExpanded = expandedSections[item.label] ?? false;
      const hasActiveChild = filteredChildren.some((child) => isActive(child.href));

      return (
        <div key={item.label}>
          <button
            onClick={() => toggleSection(item.label)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              hasActiveChild
                ? "bg-primary/10 text-primary"
                : "text-text-secondary hover:bg-gray-100 hover:text-foreground"
            }`}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
              {filteredChildren.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive(child.href)
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-text-secondary hover:bg-gray-100 hover:text-foreground"
                  }`}
                >
                  {child.icon}
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive(item.href)
            ? "bg-primary/10 text-primary"
            : "text-text-secondary hover:bg-gray-100 hover:text-foreground"
        }`}
      >
        {item.icon}
        {item.label}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-surface p-2 shadow-md lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-surface transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="text-sm font-semibold text-foreground">ProcureFlow</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 hover:bg-gray-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredItems.map(renderNavItem)}
        </nav>

        {/* User section */}
        <div className="border-t border-border p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
