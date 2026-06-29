import { ScrollText } from "lucide-react";
import { getDisplayValue } from "@/lib/utils";
import type { AuditLogRow } from "@/lib/auth/rbac-actions";

export function CrmAuditTable({ logs }: { logs: AuditLogRow[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white px-8 py-16 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#34AADC]">
          <ScrollText className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">No activity yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          Audit entries appear here when you create users, teams, change roles, or
          update modules. Try creating a CRM user or team first — then refresh
          this page.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">When</th>
            <th className="px-4 py-3">Actor</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Resource</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-blue-50/30">
              <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                {new Date(log.created_at).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-gray-700">
                {log.actor_name || log.actor_email || "System"}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{log.action}</td>
              <td className="px-4 py-3 text-gray-600">
                {log.resource_type || "—"}
                {log.resource_id && (
                  <span className="ml-1 text-xs text-gray-400">
                    {String(log.resource_id).slice(0, 8)}…
                  </span>
                )}
                {log.metadata && (
                  <p
                    className="mt-0.5 truncate text-xs text-gray-400"
                    title={JSON.stringify(log.metadata)}
                  >
                    {getDisplayValue(log.metadata)}
                  </p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
