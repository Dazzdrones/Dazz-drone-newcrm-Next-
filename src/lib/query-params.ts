export interface TableQueryParams {
  page?: number;
  q?: string;
  sort?: string;
  dir?: "asc" | "desc";
}

export function parseTableQueryParams(
  params: Record<string, string | string[] | undefined>
): TableQueryParams {
  const page = Math.max(1, Number(params.page) || 1);
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const sort = typeof params.sort === "string" ? params.sort : undefined;
  const dir = params.dir === "asc" || params.dir === "desc" ? params.dir : "desc";

  return {
    page,
    q: q || undefined,
    sort,
    dir,
  };
}

export function buildTableQueryString(
  basePath: string,
  params: TableQueryParams
): string {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.sort) search.set("sort", params.sort);
  if (params.dir && params.dir !== "desc") search.set("dir", params.dir);
  if (params.page && params.page > 1) search.set("page", String(params.page));

  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
