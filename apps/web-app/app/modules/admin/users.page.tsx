import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { ChevronDown, MoreHorizontal } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "~/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "~/components/ui/dropdown-menu";
import { authClient } from "../Auth/auth.client";

type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: string | string[] | null;
  image?: string | null;
  banned?: boolean | null;
  createdAt?: string | Date | null;
};

type AdminUsersPayload = {
  users: AdminUser[];
  total: number;
  limit?: number | null;
  offset?: number | null;
};

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const offset = useMemo(() => (page - 1) * PAGE_SIZE, [page]);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<AdminUsersPayload>(
    {
      queryKey: ["admin", "users", page, PAGE_SIZE],
      queryFn: async () => {
        const response = await authClient.admin.listUsers({
          query: {
            limit: PAGE_SIZE,
            offset
          }
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        return (
          response.data ?? {
            users: [],
            total: 0,
            limit: PAGE_SIZE,
            offset
          }
        );
      }
    }
  );

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Users</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage user access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <UsersSkeleton />
            ) : isError ? (
              <UsersError
                message={error instanceof Error ? error.message : undefined}
                onRetry={() => void refetch()}
                isRetrying={isFetching}
              />
            ) : (
              <UsersList users={data?.users ?? []} total={total} />
            )}
            <Pagination
              page={page}
              totalPages={totalPages}
              isLoading={isLoading || isFetching}
              onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
              onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function UsersList({ users, total }: { users: AdminUser[]; total: number }) {
  if (!users.length) {
    return (
      <p className="text-sm text-muted-foreground">No users found for this project.</p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Total users: {total}</p>
      <div className="overflow-x-auto rounded-xl border">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[36px_minmax(240px,2.5fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)_48px] items-center gap-3 bg-muted/40 px-4 py-3 text-xs font-semibold text-muted-foreground">
            <div className="flex items-center justify-center">
              <input type="checkbox" aria-label="Select all users" />
            </div>
            <span>Name</span>
            <span>Access</span>
            <span>Status</span>
            <span>Joined</span>
            <span />
          </div>
          <ul className="divide-y divide-border">
            {users.map((user) => (
              <li
                key={user.id}
                className="grid grid-cols-[36px_minmax(240px,2.5fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)_48px] items-center gap-3 px-4 py-3"
              >
                <div className="flex items-center justify-center">
                  <input type="checkbox" aria-label={`Select ${user.name || user.email || user.id}`} />
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="size-9 border bg-muted/60">
                    <AvatarImage src={user.image || ""} alt={user.name || user.email || "User"} />
                    <AvatarFallback className="text-xs font-semibold">
                      {initials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {user.name || user.email || "Unnamed user"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email || "No e-mail provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <span>{formatAccess(user.role)}</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </div>
                <StatusPill banned={Boolean(user.banned)} />
                <p className="text-sm text-muted-foreground">{formatJoinedDate(user.createdAt)}</p>
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" aria-label="User actions">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/users/${user.id}`}>Edit</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ banned }: { banned: boolean }) {
  const isOnline = !banned;
  const classes = isOnline
    ? "border-emerald-200 bg-emerald-100 text-emerald-700"
    : "border-zinc-300 bg-zinc-100 text-zinc-700";

  return (
    <div
      className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${classes}`}
    >
      <span className={`size-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-zinc-500"}`} />
      <span>{isOnline ? "Online" : "Offline"}</span>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  isLoading,
  onPrev,
  onNext
}: {
  page: number;
  totalPages: number;
  isLoading: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t pt-4">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={page <= 1 || isLoading}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={page >= totalPages || isLoading}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[36px_minmax(240px,2.5fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)_48px] items-center gap-3 rounded-lg border px-4 py-3"
        >
          <Skeleton className="size-4" />
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <div className="flex justify-end">
            <Skeleton className="size-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

function UsersError({
  message,
  onRetry,
  isRetrying
}: {
  message?: string;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
      <div>
        <p className="text-sm font-medium">We couldn&apos;t load users.</p>
        <p className="text-xs opacity-80">{message || "Try again in a moment."}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        disabled={isRetrying}
      >
        {isRetrying ? "Retrying..." : "Retry"}
      </Button>
    </div>
  );
}

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "U";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function formatJoinedDate(value?: string | Date | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatAccess(role: AdminUser["role"]) {
  if (!role) {
    return "Guest";
  }

  const roles = Array.isArray(role) ? role : [role];
  const firstRole = roles.find(Boolean);

  if (!firstRole) {
    return "Guest";
  }

  return firstRole.charAt(0).toUpperCase() + firstRole.slice(1);
}
