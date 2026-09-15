"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";
import type { Profile } from "@/lib/types";
import { logout } from "@/lib/actions/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const loadProfile = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (isMounted) {
            router.push("/login");
          }
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Supabase profile fetch error:", error.message, error);
        }

        if (data) {
          if (isMounted) {
            setProfile(data);
          }
        } else {
          // Profile does not exist yet; create a default profile so the user can use the dashboard
          const defaultFullName =
            (user.user_metadata?.full_name as string) ||
            user.email?.split("@")[0] ||
            "User";

          const newProfile = {
            id: user.id,
            email: user.email || "",
            full_name: defaultFullName,
            role: "requester" as const,
            is_active: true,
          };

          const { data: createdProfile } = await supabase
            .from("profiles")
            .upsert(newProfile)
            .select("*")
            .maybeSingle();

          if (isMounted) {
            if (createdProfile) {
              setProfile(createdProfile);
            } else {
              // Fallback to local profile object if RLS prevented DB write
              setProfile({
                id: user.id,
                email: user.email || "",
                full_name: defaultFullName,
                role: "requester",
                department_id: null,
                phone: null,
                avatar_url: null,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }
        }

        // Load unread notification count
        try {
          const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false);

          if (isMounted) {
            setUnreadCount(count ?? 0);
          }
        } catch {
          // ignore notification count error
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    await logout();
  };

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole={profile.role} onLogout={handleLogout} />
      <div className="lg:pl-64">
        <TopBar profile={profile} unreadCount={unreadCount} onLogout={handleLogout} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
