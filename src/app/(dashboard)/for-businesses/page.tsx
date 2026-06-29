import { TablePage } from "@/components/TablePage";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ForBusinessesPage({ searchParams }: PageProps) {
  return (
    <TablePage table="for_businesses" searchParams={await searchParams} />
  );
}
