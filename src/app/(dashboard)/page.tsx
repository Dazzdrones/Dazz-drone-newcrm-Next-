import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { getDashboardStats, fetchTablePage } from "@/lib/actions";
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
  let stats = {
    bookingRequests: 0,
    bookings: 0,
    callbackRequests: 0,
    contactRequests: 0,
    careerApplications: 0,
    enterpriseRequests: 0,
    pilotRequests: 0,
    dronePilotRegistrations: 0,
    forBusinesses: 0,
    users: 0,
    bookingsTableMissing: false,
  };
  let recentBookings = {
    data: [] as Record<string, unknown>[],
    total: 0,
    page: 1,
    pageSize: DASHBOARD_PREVIEW_SIZE,
    totalPages: 1,
  };

  try {
    [stats, recentBookings] = await Promise.all([
      getDashboardStats(),
      fetchTablePage("booking_requests", 1, DASHBOARD_PREVIEW_SIZE),
    ]);
  } catch {
    // Fail silently
  }

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Total row counts from each Supabase table"
        showRefresh
      />
      <div className="p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard
            title="Booking Requests"
            value={stats.bookingRequests}
            icon={CalendarDays}
            href="/booking-requests"
          />
          <StatCard
            title="Confirmed Bookings"
            value={stats.bookingsTableMissing ? 0 : stats.bookings}
            icon={CalendarCheck}
            href="/bookings"
            accent="bg-emerald-500"
          />
          <StatCard
            title="Callback Requests"
            value={stats.callbackRequests}
            icon={Phone}
            href="/callback-requests"
          />
          <StatCard
            title="Contact Requests"
            value={stats.contactRequests}
            icon={Mail}
            href="/contact-requests"
          />
          <StatCard
            title="Career Applications"
            value={stats.careerApplications}
            icon={Briefcase}
            href="/career-applications"
          />
          <StatCard
            title="Enterprise Requests"
            value={stats.enterpriseRequests}
            icon={Building2}
            href="/enterprise-requests"
          />
          <StatCard
            title="Pilot Requests"
            value={stats.pilotRequests}
            icon={Plane}
            href="/pilot-requests"
          />
          <StatCard
            title="Pilot Registrations"
            value={stats.dronePilotRegistrations}
            icon={UserCircle}
            href="/drone-pilot-registrations"
          />
          <StatCard
            title="For Businesses"
            value={stats.forBusinesses}
            icon={Handshake}
            href="/for-businesses"
          />
          <StatCard
            title="Users"
            value={stats.users}
            icon={Users}
            href="/users"
          />
        </div>

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
          />
        </div>
      </div>
    </>
  );
}
