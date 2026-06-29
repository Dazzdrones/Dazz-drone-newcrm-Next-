import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { BookingRequestDetail } from "@/components/booking/BookingRequestDetail";
import { fetchRecord } from "@/lib/actions";
import { hasPermission, requireModule } from "@/lib/auth/permissions";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingRequestDetailPage({ params }: PageProps) {
  const session = await requireModule("booking_requests");
  const canDelete = hasPermission(session, "booking_requests:delete");
  const { id } = await params;
  let record: Record<string, unknown> | null = null;

  try {
    record = await fetchRecord("booking_requests", id);
  } catch {
    record = null;
  }

  return (
    <>
      <Header title="Booking Request" subtitle={`Request ID: ${id}`} showRefresh />
      <div className="p-8">
        <Link
          href="/booking-requests"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-[#34AADC] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Booking Requests
        </Link>

        {record ? (
          <BookingRequestDetail record={record} canDelete={canDelete} />
        ) : (
          <p className="text-sm text-gray-500">Request not found.</p>
        )}
      </div>
    </>
  );
}
