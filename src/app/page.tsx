import Link from "next/link";
import {
  Shield,
  FileText,
  CheckCircle,
  Building2,
  ShoppingCart,
  Truck,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import Logo from "@/components/logo";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const features = [
    {
      icon: <FileText size={20} />,
      title: "Procurement Requests",
      description: "Create, submit, and track procurement requests with full approval workflows.",
    },
    {
      icon: <CheckCircle size={20} />,
      title: "Approval Workflows",
      description: "Structured approval processes with role-based access and complete audit trails.",
    },
    {
      icon: <Building2 size={20} />,
      title: "Supplier Management",
      description: "Manage supplier profiles, evaluate performance, and maintain procurement records.",
    },
    {
      icon: <ShoppingCart size={20} />,
      title: "Purchase Orders",
      description: "Generate, issue, and track purchase orders through the procurement lifecycle.",
    },
    {
      icon: <Truck size={20} />,
      title: "Delivery Tracking",
      description: "Monitor deliveries, record partial shipments, and track outstanding quantities.",
    },
    {
      icon: <BarChart3 size={20} />,
      title: "Reporting & Audit",
      description: "Generate procurement reports and maintain complete audit logs for accountability.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Logo size={28} />
            <span className="text-base font-semibold text-foreground">
              ProcureFlow
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
            <Shield size={14} />
            Trusted by organizations worldwide
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Procurement management
            <br />
            <span className="text-primary">built for real work</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-text-secondary">
            A centralized system for managing procurement requests, approvals, supplier
            engagement, quotations, purchase orders, and deliveries &mdash; designed for
            organizations that value transparency and efficiency.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Start Free
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-gray-50"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-semibold text-foreground">
              Everything you need to manage procurement
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              From initial request through delivery confirmation
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border p-6 transition-colors hover:border-primary/20 hover:bg-primary/[0.02]"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            Complete procurement lifecycle
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Track every step from request to delivery
          </p>
        </div>
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
            {[
              "Request",
              "Approval",
              "Quotation",
              "Supplier Selection",
              "Purchase Order",
              "Delivery",
              "Completed",
            ].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-xs font-medium text-foreground">{step}</span>
                </div>
                {i < arr.length - 1 && (
                  <span className="text-text-secondary">&rarr;</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            Ready to streamline your procurement?
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Set up your organization in minutes
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Create Account
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-gray-50"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="text-xs font-medium text-text-secondary">
              ProcureFlow
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            &copy; {new Date().getFullYear()} ProcureFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
