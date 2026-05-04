export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function paginate<T>(
  data: T[],
  total: number,
  options: PaginationOptions,
): PaginatedResult<T> {
  const page = Number(options.page ?? 1);
  const limit = Number(options.limit ?? 20);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export function getPaginationParams(options: PaginationOptions) {
  const page = Math.max(1, Number(options.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(options.limit ?? 20)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
