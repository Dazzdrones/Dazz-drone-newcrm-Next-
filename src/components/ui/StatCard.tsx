import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  href?: string;
  accent?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  href,
  accent = "bg-[#34AADC]",
}: StatCardProps) {
  const content = (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}
