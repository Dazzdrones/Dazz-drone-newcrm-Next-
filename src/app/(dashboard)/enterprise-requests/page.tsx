import { TablePage } from "@/components/TablePage";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EnterpriseRequestsPage({
  searchParams,
}: PageProps) {
  return (
    <TablePage table="enterprise_requests" searchParams={await searchParams} />
  );
}
