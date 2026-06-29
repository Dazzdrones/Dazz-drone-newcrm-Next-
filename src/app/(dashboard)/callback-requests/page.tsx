import { TablePage } from "@/components/TablePage";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CallbackRequestsPage({ searchParams }: PageProps) {
  return (
    <TablePage table="callback_requests" searchParams={await searchParams} />
  );
}
