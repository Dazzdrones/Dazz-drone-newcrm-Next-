import { Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { Shimmer } from "@/components/ui/Shimmer";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { fetchTablePage, getDashboardStatsForSession } from "@/lib/actions";
import { hasPermission, requireModule } from "@/lib/auth/permissions";
import type { AuthSession } from "@/lib/auth/types";
import { DASHBOARD_PREVIEW_SIZE } from "@/lib/constants";
import {
  CalendarDays,
  CalendarCheck,
  Phone,
  Mail,
  Briefcase,
  Building2,
  Plane,
  UserCircle,
  Handshake,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireModule("dashboard");

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Total row counts from each Supabase table"
        showRefresh
      />
      <div className="p-8">
        <Suspense fallback={<StatsSkeleton />}>
          <DashboardStats />
        </Suspense>
        <Suspense fallback={<RecentRequestsSkeleton />}>
          <DashboardRecentRequests />
        </Suspense>
      </div>
    </>
  );
}

async function DashboardStats() {
  const session = await requireModule("dashboard");
  const stats = await getDashboardStatsForSession(session);

  const cards = [
    {
      show: hasPermission(session, "booking_requests:read"),
      title: "Booking Requests",
      value: stats.bookingRequests,
      icon: CalendarDays,
      href: "/booking-requests",
    },
    {
      show: hasPermission(session, "bookings:read"),
      title: "Confirmed Bookings",
      value: stats.bookingsTableMissing ? 0 : stats.bookings,
      icon: CalendarCheck,
      href: "/bookings",
      accent: "bg-emerald-500",
    },
    {
      show: hasPermission(session, "callback_requests:read"),
      title: "Callback Requests",
      value: stats.callbackRequests,
      icon: Phone,
      href: "/callback-requests",
    },
    {
      show: hasPermission(session, "contact_requests:read"),
      title: "Contact Requests",
      value: stats.contactRequests,
      icon: Mail,
      href: "/contact-requests",
    },
    {
      show: hasPermission(session, "career_applications:read"),
      title: "Career Applications",
      value: stats.careerApplications,
      icon: Briefcase,
      href: "/career-applications",
    },
    {
      show: hasPermission(session, "enterprise_requests:read"),
      title: "Enterprise Requests",
      value: stats.enterpriseRequests,
      icon: Building2,
      href: "/enterprise-requests",
    },
    {
      show: hasPermission(session, "legacy_data:read"),
      title: "Pilot Requests",
      value: stats.pilotRequests,
      icon: Plane,
      href: "/pilot-requests",
    },
    {
      show: hasPermission(session, "legacy_data:read"),
      title: "Pilot Registrations",
      value: stats.dronePilotRegistrations,
      icon: UserCircle,
      href: "/drone-pilot-registrations",
    },
    {
      show: hasPermission(session, "legacy_data:read"),
      title: "For Businesses",
      value: stats.forBusinesses,
      icon: Handshake,
      href: "/for-businesses",
    },
    {
      show: hasPermission(session, "legacy_data:read"),
      title: "Users",
      value: stats.users,
      icon: Users,
      href: "/users",
    },
  ].filter((c) => c.show);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.href}
          title={card.title}
          value={card.value}
          icon={card.icon}
          href={card.href}
          accent={card.accent}
        />
      ))}
    </div>
  );
}

async function DashboardRecentRequests() {
  const session = await requireModule("dashboard");

  if (!hasPermission(session, "booking_requests:read")) {
    return null;
  }

  const canDelete = hasPermission(session, "booking_requests:delete");

  const recentBookings = await fetchTablePage(
    "booking_requests",
    1,
    DASHBOARD_PREVIEW_SIZE
  ).catch(() => ({
    data: [] as Record<string, unknown>[],
    total: 0,
    page: 1,
    pageSize: DASHBOARD_PREVIEW_SIZE,
    totalPages: 1,
  }));

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Recent Booking Requests
        </h2>
        <Link
          href="/booking-requests"
          className="text-sm font-medium text-[#34AADC] hover:underline"
        >
          View all {recentBookings.total} →
        </Link>
      </div>
      <DataTable
        data={recentBookings.data}
        table="booking_requests"
        total={recentBookings.total}
        page={recentBookings.page}
        pageSize={recentBookings.pageSize}
        canDelete={canDelete}
      />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Shimmer key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

function RecentRequestsSkeleton() {
  return (
    <div className="mt-8">
      <div className="mb-4 flex justify-between">
        <Shimmer className="h-6 w-52" />
        <Shimmer className="h-4 w-28" />
      </div>
      <TableSkeleton rows={6} />
    </div>
  );
}
