import { TablePage } from "@/components/TablePage";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PilotRequestsPage({ searchParams }: PageProps) {
  return (
    <TablePage table="pilot_requests" searchParams={await searchParams} />
  );
}
