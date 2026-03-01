import { type FormEventHandler, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { ApiClient } from "~/api/api-client";
import { ContentType } from "~/api/generated-api";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";

type UserDetails = {
  id: string;
  name: string | null;
  email: string;
  banned: boolean | null;
  banReason: string | null;
  banExpires: string | Date | null;
};

export default function AdminUserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [banned, setBanned] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banExpires, setBanExpires] = useState("");

  const userId = useMemo(() => id ?? "", [id]);

  const {
    data: user,
    isLoading,
    isError,
    error
  } = useQuery<UserDetails>({
    queryKey: ["admin", "user", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await ApiClient.api.usersControllerGetUserByIdV1(userId);
      return response.data.data as UserDetails;
    }
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setBanned(Boolean(user.banned));
    setBanReason(user.banReason ?? "");
    setBanExpires(toDateTimeLocal(user.banExpires));
  }, [user]);

  const { mutateAsync: saveUser, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("Missing user id");
      }

      const payload = {
        name: name.trim(),
        email: email.trim(),
        banned,
        banReason: banned ? nullableTrimmed(banReason) : null,
        banExpires: banned ? toIsoOrNull(banExpires) : null
      };

      await ApiClient.request({
        path: `/api/v1/users/${userId}`,
        method: "PATCH",
        type: ContentType.Json,
        format: "json",
        body: payload
      });
    },
    onSuccess: async () => {
      toast("User updated");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] })
      ]);
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error ? mutationError.message : "Unable to update user";
      toast("Update failed", { description: message });
    }
  });

  const onSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    void saveUser();
  };

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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin/users">Users</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit user</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Edit user</CardTitle>
            <CardDescription>Update profile and moderation fields.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading user...</p>
            ) : isError ? (
              <div className="space-y-3">
                <p className="text-sm text-destructive">
                  {error instanceof Error ? error.message : "Unable to load user."}
                </p>
                <Button variant="outline" asChild>
                  <Link to="/admin/users">Back to users</Link>
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="User name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banned">Banned</Label>
                  <label
                    htmlFor="banned"
                    className="flex w-fit cursor-pointer items-center gap-2 rounded-md border px-3 py-2"
                  >
                    <input
                      id="banned"
                      type="checkbox"
                      checked={banned}
                      onChange={(event) => setBanned(event.target.checked)}
                    />
                    <span className="text-sm">Prevent this user from logging in</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ban_reason">Ban reason</Label>
                  <Input
                    id="ban_reason"
                    value={banReason}
                    onChange={(event) => setBanReason(event.target.value)}
                    placeholder="Reason for moderation action"
                    disabled={!banned}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ban_expires">Ban expires</Label>
                  <Input
                    id="ban_expires"
                    type="datetime-local"
                    value={banExpires}
                    onChange={(event) => setBanExpires(event.target.value)}
                    disabled={!banned}
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save changes"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/admin/users")}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function nullableTrimmed(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toIsoOrNull(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function toDateTimeLocal(value: string | Date | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}
