"use client";

import { Ban, Check, Minus } from "lucide-react";
import {
  ACTION_META,
  ACTION_ORDER,
  getModuleMeta,
  MODULE_GROUPS,
  sortModuleKeys,
  type PermissionMeta,
} from "@/lib/auth/permission-ui";
import type { PermissionOverrideState } from "@/lib/auth/user-permissions-actions";

// ─── Shared layout ───────────────────────────────────────────────────────────

interface BaseProps {
  permissionsByModule: Map<string, PermissionMeta[]>;
  moduleNames?: Record<string, string>;
}

function useActionColumns(permissionsByModule: Map<string, PermissionMeta[]>) {
  const allPerms = [...permissionsByModule.values()].flat();
  return ACTION_ORDER.filter((action) =>
    allPerms.some((p) => p.action === action)
  );
}

function ModuleGroupTable({
  groupKey,
  groupLabel,
  moduleKeys,
  permissionsByModule,
  moduleNames,
  actionColumns,
  children,
}: {
  groupKey: string;
  groupLabel: string;
  moduleKeys: string[];
  permissionsByModule: Map<string, PermissionMeta[]>;
  moduleNames?: Record<string, string>;
  actionColumns: string[];
  children: (moduleKey: string, perms: PermissionMeta[]) => React.ReactNode;
}) {
  if (moduleKeys.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {groupLabel}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="sticky left-0 z-10 min-w-[180px] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Module
              </th>
              {actionColumns.map((action) => {
                const meta = ACTION_META[action];
                return (
                  <th
                    key={action}
                    className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {meta?.label ?? action}
                  </th>
                );
              })}
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                All
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {moduleKeys.map((moduleKey) => {
              const perms = permissionsByModule.get(moduleKey) ?? [];
              const meta = getModuleMeta(moduleKey);
              const Icon = meta.icon;
              const displayName = moduleNames?.[moduleKey] ?? meta.name;

              return (
                <tr key={moduleKey} className="hover:bg-slate-50/60">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 hover:bg-slate-50/60">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#34AADC]/10 text-[#34AADC]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="font-medium text-gray-900">{displayName}</span>
                    </div>
                  </td>
                  {children(moduleKey, perms)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Shared toggle ───────────────────────────────────────────────────────────

function ModuleAllSwitch({
  allOn,
  someOn,
  onClick,
}: {
  allOn: boolean;
  someOn: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={someOn ? "mixed" : allOn}
      title={allOn ? "Revoke all" : "Allow all"}
      onClick={onClick}
      className={`relative mx-auto block h-6 w-11 shrink-0 rounded-full transition-colors ${
        allOn ? "bg-[#34AADC]" : someOn ? "bg-[#34AADC]/50" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
          allOn ? "translate-x-5" : someOn ? "translate-x-2.5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Role matrix (on/off toggles) ────────────────────────────────────────────

interface RolePermissionMatrixProps extends BaseProps {
  enabled: Set<string>;
  onToggle: (key: string) => void;
  onToggleModule: (moduleKey: string, enable: boolean) => void;
}

export function RolePermissionMatrix({
  permissionsByModule,
  moduleNames,
  enabled,
  onToggle,
  onToggleModule,
}: RolePermissionMatrixProps) {
  const moduleKeys = sortModuleKeys([...permissionsByModule.keys()]);
  const actionColumns = useActionColumns(permissionsByModule);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-600">
        <span className="inline-flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[#34AADC] text-white">
            <Check className="h-3 w-3" />
          </span>
          Allowed
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded border border-gray-300 bg-white" />
          Not allowed
        </span>
        <span className="text-gray-400">
          Click a cell to toggle · use All to toggle the whole module
        </span>
      </div>

      {MODULE_GROUPS.map((group) => {
        const groupModules = moduleKeys.filter(
          (key) => getModuleMeta(key).group === group.key
        );

        return (
          <ModuleGroupTable
            key={group.key}
            groupKey={group.key}
            groupLabel={group.label}
            moduleKeys={groupModules}
            permissionsByModule={permissionsByModule}
            moduleNames={moduleNames}
            actionColumns={actionColumns}
          >
            {(moduleKey, perms) => {
              const permByAction = Object.fromEntries(
                perms.map((p) => [p.action, p])
              );
              const enabledCount = perms.filter((p) => enabled.has(p.key)).length;
              const allOn = enabledCount === perms.length && perms.length > 0;
              const someOn = enabledCount > 0 && !allOn;

              return (
                <>
                  {actionColumns.map((action) => {
                    const perm = permByAction[action];
                    if (!perm) {
                      return (
                        <td key={action} className="px-2 py-3 text-center">
                          <span className="text-gray-300">—</span>
                        </td>
                      );
                    }
                    const isOn = enabled.has(perm.key);
                    return (
                      <td key={action} className="px-2 py-3 text-center">
                        <button
                          type="button"
                          title={perm.description ?? perm.key}
                          onClick={() => onToggle(perm.key)}
                          className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                            isOn
                              ? "border-[#34AADC] bg-[#34AADC] text-white shadow-sm"
                              : "border-gray-200 bg-white text-transparent hover:border-gray-300"
                          }`}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    <ModuleAllSwitch
                      allOn={allOn}
                      someOn={someOn}
                      onClick={() => onToggleModule(moduleKey, !allOn)}
                    />
                  </td>
                </>
              );
            }}
          </ModuleGroupTable>
        );
      })}
    </div>
  );
}

// ─── User override matrix (inherit / grant / deny) ───────────────────────────

interface UserPermissionMatrixProps extends BaseProps {
  states: Record<string, PermissionOverrideState>;
  rolePermSet: Set<string>;
  teamPermSet: Set<string>;
  onSetState: (key: string, state: PermissionOverrideState) => void;
  onRevokeModule: (moduleKey: string, permKeys: string[]) => void;
}

function nextUserState(
  current: PermissionOverrideState,
  roleHas: boolean,
  teamHas: boolean
): PermissionOverrideState {
  const inherited = roleHas || teamHas;
  if (inherited) {
    return current === "inherit" ? "deny" : "inherit";
  }
  return current === "inherit" ? "grant" : "inherit";
}

function isEffectiveUser(
  state: PermissionOverrideState,
  roleHas: boolean,
  teamHas: boolean
) {
  if (state === "grant") return true;
  if (state === "deny") return false;
  return roleHas || teamHas;
}

export function UserPermissionMatrix({
  permissionsByModule,
  moduleNames,
  states,
  rolePermSet,
  teamPermSet,
  onSetState,
  onRevokeModule,
}: UserPermissionMatrixProps) {
  const moduleKeys = sortModuleKeys([...permissionsByModule.keys()]);
  const actionColumns = useActionColumns(permissionsByModule);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <LegendItem
          swatch={<span className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-400"><Minus className="h-3 w-3" /></span>}
          label="Default"
          hint="Uses role + team"
        />
        <LegendItem
          swatch={<span className="flex h-6 w-6 items-center justify-center rounded bg-slate-200 text-slate-700"><Check className="h-3.5 w-3.5" /></span>}
          label="Inherited"
          hint="On from role or team"
        />
        <LegendItem
          swatch={<span className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500 text-white"><Check className="h-3.5 w-3.5" /></span>}
          label="Extra grant"
          hint="Forced on for user"
        />
        <LegendItem
          swatch={<span className="flex h-6 w-6 items-center justify-center rounded bg-red-500 text-white"><Ban className="h-3.5 w-3.5" /></span>}
          label="Denied"
          hint="Forced off for user"
        />
      </div>

      {MODULE_GROUPS.map((group) => {
        const groupModules = moduleKeys.filter(
          (key) => getModuleMeta(key).group === group.key
        );

        return (
          <ModuleGroupTable
            key={group.key}
            groupKey={group.key}
            groupLabel={group.label}
            moduleKeys={groupModules}
            permissionsByModule={permissionsByModule}
            moduleNames={moduleNames}
            actionColumns={actionColumns}
          >
            {(moduleKey, perms) => {
              const permByAction = Object.fromEntries(
                perms.map((p) => [p.action, p])
              );
              const hasInherited = perms.some(
                (p) => rolePermSet.has(p.key) || teamPermSet.has(p.key)
              );

              return (
                <>
                  {actionColumns.map((action) => {
                    const perm = permByAction[action];
                    if (!perm) {
                      return (
                        <td key={action} className="px-2 py-3 text-center">
                          <span className="text-gray-300">—</span>
                        </td>
                      );
                    }

                    const roleHas = rolePermSet.has(perm.key);
                    const teamHas = teamPermSet.has(perm.key);
                    const state = states[perm.key] ?? "inherit";
                    const effective = isEffectiveUser(state, roleHas, teamHas);

                    let cellClass =
                      "border-gray-200 bg-white text-gray-400 hover:border-gray-300";
                    let icon = <Minus className="h-3.5 w-3.5" />;

                    if (state === "grant") {
                      cellClass = "border-emerald-500 bg-emerald-500 text-white";
                      icon = <Check className="h-3.5 w-3.5" />;
                    } else if (state === "deny") {
                      cellClass = "border-red-500 bg-red-500 text-white";
                      icon = <Ban className="h-3.5 w-3.5" />;
                    } else if (effective) {
                      cellClass = teamHas && !roleHas
                        ? "border-violet-400 bg-violet-100 text-violet-800"
                        : "border-slate-400 bg-slate-200 text-slate-700";
                      icon = <Check className="h-3.5 w-3.5" />;
                    }

                    const source =
                      state === "inherit" && effective
                        ? teamHas && !roleHas
                          ? "From team"
                          : roleHas
                            ? "From role"
                            : "On"
                        : state === "grant"
                          ? "Extra grant"
                          : state === "deny"
                            ? "Denied"
                            : "Off";

                    return (
                      <td key={action} className="px-2 py-3 text-center">
                        <button
                          type="button"
                          title={`${ACTION_META[action]?.label ?? action}: ${source}. Click to change.`}
                          onClick={() =>
                            onSetState(
                              perm.key,
                              nextUserState(state, roleHas, teamHas)
                            )
                          }
                          className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${cellClass}`}
                        >
                          {icon}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    {hasInherited ? (
                      <button
                        type="button"
                        onClick={() =>
                          onRevokeModule(
                            moduleKey,
                            perms.map((p) => p.key)
                          )
                        }
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Deny all
                      </button>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </>
              );
            }}
          </ModuleGroupTable>
        );
      })}
    </div>
  );
}

function LegendItem({
  swatch,
  label,
  hint,
}: {
  swatch: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {swatch}
      <div>
        <p className="text-xs font-semibold text-gray-800">{label}</p>
        <p className="text-[11px] text-gray-500">{hint}</p>
      </div>
    </div>
  );
}
