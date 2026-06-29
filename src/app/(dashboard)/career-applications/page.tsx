import { TablePage } from "@/components/TablePage";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CareerApplicationsPage({
  searchParams,
}: PageProps) {
  return (
    <TablePage table="career_applications" searchParams={await searchParams} />
  );
}
