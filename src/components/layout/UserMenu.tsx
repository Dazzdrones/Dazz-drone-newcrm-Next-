"use client";

import { LogOut, User } from "lucide-react";
import { signOut } from "@/lib/auth/admin-actions";
import { useTransition } from "react";

interface UserMenuProps {
  fullName: string | null;
  email: string;
  roleName: string;
}

export function UserMenu({ fullName, email, roleName }: UserMenuProps) {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <div className="border-t border-gray-100 p-3">
      <div className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#34AADC]">
          <User className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            {fullName || email}
          </p>
          <p className="truncate text-xs text-gray-500">{roleName}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        {isPending ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}
