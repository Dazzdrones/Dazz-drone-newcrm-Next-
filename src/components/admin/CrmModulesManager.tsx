"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCrmModule, type CrmModuleRow } from "@/lib/auth/rbac-actions";

export function CrmModulesManager({ modules }: { modules: CrmModuleRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggleActive(mod: CrmModuleRow) {
    startTransition(async () => {
      await updateCrmModule(mod.id, { is_active: !mod.is_active });
      router.refresh();
    });
  }

  function updateSort(mod: CrmModuleRow, sortOrder: number) {
    startTransition(async () => {
      await updateCrmModule(mod.id, { sort_order: sortOrder });
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">Module</th>
            <th className="px-4 py-3">Route</th>
            <th className="px-4 py-3">Sort</th>
            <th className="px-4 py-3">Active</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {modules.map((mod) => (
            <tr key={mod.id} className="hover:bg-blue-50/30">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{mod.name}</p>
                <p className="text-xs text-gray-500">{mod.key}</p>
              </td>
              <td className="px-4 py-3 text-gray-600">{mod.route || "—"}</td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  defaultValue={mod.sort_order}
                  disabled={isPending}
                  onBlur={(e) =>
                    updateSort(mod, parseInt(e.target.value, 10) || 0)
                  }
                  className="w-16 rounded border border-gray-200 px-2 py-1 text-sm"
                />
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  disabled={isPending || mod.key === "dashboard"}
                  onClick={() => toggleActive(mod)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    mod.is_active
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-600"
                  } disabled:opacity-40`}
                >
                  {mod.is_active ? "On" : "Off"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
