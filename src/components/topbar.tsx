"use client";

import { Bell, Search, LogOut } from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import { getRoleLabel } from "@/lib/permissions";

export default function TopBar({
  profile,
  unreadCount,
  onLogout,
}: {
  profile: Profile;
  unreadCount: number;
  onLogout?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="hidden sm:block">
          <h2 className="text-sm font-medium text-text-secondary">
            {getRoleLabel(profile.role)}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <Search size={16} className="text-text-secondary" />
          <input
            type="text"
            placeholder="Search..."
            className="w-48 bg-transparent text-sm outline-none placeholder:text-text-secondary"
          />
        </div>

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative rounded-lg p-2 text-text-secondary transition-colors hover:bg-gray-100 hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
            {(profile?.full_name || profile?.email || "U")
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "U"}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">{profile?.full_name || "User"}</p>
            <p className="text-xs text-text-secondary">{profile?.email}</p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="ml-1 rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label="Sign Out"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
