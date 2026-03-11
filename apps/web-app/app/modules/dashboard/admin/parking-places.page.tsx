import { useEffect, useMemo, useState } from "react";
import { Link, redirect, useOutletContext } from "react-router";

import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

import type { Route } from "./+types/parking-places.page";
import { authClient } from "~/modules/Auth/auth.client";
import type { DashboardOutletContext } from "../dashboard.layout";

const authMiddleware: Route.ClientMiddlewareFunction = async () => {
  const session = await authClient.getSession();

  if (!session.data) {
    throw redirect("/auth");
  }
};

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [authMiddleware];

const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

type ParkingPlace = {
  id: string;
  name: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse<T> = { data: T };

async function apiFetch<T>(input: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${input}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return (await response.json()) as ApiResponse<T>;
}

export default function AdminParkingPlacesPage() {
  const { currentUser } = useOutletContext<DashboardOutletContext>();
  const isAdmin = currentUser?.role === "admin";
  const [places, setPlaces] = useState<ParkingPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", address: "" });

  const canSubmit = useMemo(
    () => form.name.trim().length > 0 && !isSubmitting,
    [form.name, isSubmitting]
  );

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    apiFetch<ParkingPlace[]>("/parking-places")
      .then((payload) => {
        if (!active) return;
        setPlaces(payload.data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load places");
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAdmin]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const payload = await apiFetch<ParkingPlace>("/parking-places", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim() || undefined
        })
      });
      setPlaces((prev) => [payload.data, ...prev]);
      setForm({ name: "", address: "" });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create place");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this parking place?");
    if (!confirmed) return;

    try {
      await apiFetch<null>(`/parking-places/${id}`, { method: "DELETE" });
      setPlaces((prev) => prev.filter((place) => place.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete place");
    }
  };

  const pageCard = isAdmin ? (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Parking Places</CardTitle>
        <CardDescription>Manage parking places and their spots.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleCreate}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="place-name">Name</Label>
              <Input
                id="place-name"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Main Garage"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="place-address">Address</Label>
              <Input
                id="place-address"
                value={form.address}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, address: event.target.value }))
                }
                placeholder="Optional address"
              />
            </div>
          </div>
          <Button type="submit" disabled={!canSubmit}>
            {isSubmitting ? "Creating..." : "Create place"}
          </Button>
        </form>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading places…</p>
        ) : places.length ? (
          <ul className="space-y-3">
            {places.map((place) => (
              <li
                key={place.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {place.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {place.address || "No address"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/dashboard/admin/parking-places/${place.id}`}>
                      Manage spots
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(place.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No parking places yet.</p>
        )}
      </CardContent>
    </Card>
  ) : (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle>Access denied</CardTitle>
        <CardDescription>You need admin permissions to manage parking.</CardDescription>
      </CardHeader>
    </Card>
  );

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
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/admin/users">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Parking Places</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{pageCard}</div>
    </>
  );
}
