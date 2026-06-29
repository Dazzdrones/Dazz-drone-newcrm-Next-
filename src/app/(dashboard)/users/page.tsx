import { TablePage } from "@/components/TablePage";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  return <TablePage table="users" searchParams={await searchParams} />;
}
