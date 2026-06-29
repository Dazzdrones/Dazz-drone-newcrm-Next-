import { TablePage } from "@/components/TablePage";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BookingRequestsPage({ searchParams }: PageProps) {
  return (
    <TablePage
      table="booking_requests"
      searchParams={await searchParams}
    />
  );
}
