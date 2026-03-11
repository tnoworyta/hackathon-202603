import { useEffect, useMemo, useState } from "react";
import { redirect, useOutletContext, useParams } from "react-router";

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

import type { Route } from "./+types/parking-place.page";
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
};

type ParkingSpot = {
  id: string;
  placeId: string;
  label: string;
  isActive: boolean;
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

export default function AdminParkingPlacePage() {
  const { currentUser } = useOutletContext<DashboardOutletContext>();
  const isAdmin = currentUser?.role === "admin";
  const params = useParams();
  const placeId = params.id ?? "";

  const [place, setPlace] = useState<ParkingPlace | null>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ label: "", isActive: true });

  const canSubmit = useMemo(
    () => form.label.trim().length > 0 && !isSubmitting,
    [form.label, isSubmitting]
  );

  useEffect(() => {
    if (!isAdmin || !placeId) {
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    Promise.all([
      apiFetch<ParkingPlace>(`/parking-places/${placeId}`),
      apiFetch<ParkingSpot[]>(`/parking-places/${placeId}/spots`)
    ])
      .then(([placeResponse, spotsResponse]) => {
        if (!active) return;
        setPlace(placeResponse.data);
        setSpots(spotsResponse.data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load spots");
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAdmin, placeId]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !placeId) return;

    setIsSubmitting(true);
    try {
      const payload = await apiFetch<ParkingSpot>(
        `/parking-places/${placeId}/spots`,
        {
          method: "POST",
          body: JSON.stringify({
            label: form.label.trim(),
            isActive: form.isActive
          })
        }
      );
      setSpots((prev) => [payload.data, ...prev]);
      setForm({ label: "", isActive: true });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create spot");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (
    spotId: string,
    data: Partial<Pick<ParkingSpot, "label" | "isActive">>,
  ) => {
    try {
      const payload = await apiFetch<ParkingSpot>(`/parking-spots/${spotId}`, {
        method: "PATCH",
        body: JSON.stringify(data)
      });
      setSpots((prev) =>
        prev.map((spot) => (spot.id === spotId ? payload.data : spot))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update spot");
    }
  };

  const handleDelete = async (spotId: string) => {
    const confirmed = window.confirm("Delete this parking spot?");
    if (!confirmed) return;

    try {
      await apiFetch<null>(`/parking-spots/${spotId}`, { method: "DELETE" });
      setSpots((prev) => prev.filter((spot) => spot.id !== spotId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete spot");
    }
  };

  const pageCard = isAdmin ? (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>{place?.name || "Parking Place"}</CardTitle>
        <CardDescription>Manage spots for this location.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleCreate}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="spot-label">Spot label</Label>
              <Input
                id="spot-label"
                value={form.label}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, label: event.target.value }))
                }
                placeholder="A-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spot-active">Status</Label>
              <select
                id="spot-active"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.isActive ? "active" : "inactive"}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isActive: event.target.value === "active"
                  }))
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <Button type="submit" disabled={!canSubmit}>
            {isSubmitting ? "Adding..." : "Add spot"}
          </Button>
        </form>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading spots…</p>
        ) : spots.length ? (
          <ul className="space-y-3">
            {spots.map((spot) => (
              <li
                key={spot.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {spot.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {spot.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleUpdate(spot.id, { isActive: !spot.isActive })
                    }
                  >
                    {spot.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(spot.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No spots yet.</p>
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
                <BreadcrumbLink href="/dashboard/admin/parking-places">
                  Parking Places
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Manage Spots</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{pageCard}</div>
    </>
  );
}
