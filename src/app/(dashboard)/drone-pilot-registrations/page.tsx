import { TablePage } from "@/components/TablePage";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DronePilotRegistrationsPage({
  searchParams,
}: PageProps) {
  return (
    <TablePage
      table="drone_pilot_registrations"
      searchParams={await searchParams}
    />
  );
}
