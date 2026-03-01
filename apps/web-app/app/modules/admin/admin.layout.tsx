import { Link, Outlet, redirect } from "react-router";

import { AppSidebar } from "~/components/app-sidebar";
import { useCurrentUser } from "~/api/queries/useCurrentUser";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { Card, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { authClient } from "../Auth/auth.client";

import type { Route } from "./+types/admin.layout";

export type AdminOutletContext = {
  currentUser: ReturnType<typeof useCurrentUser>["data"];
};

const authMiddleware: Route.ClientMiddlewareFunction = async () => {
  const session = await authClient.getSession();

  if (!session.data) {
    throw redirect("/auth");
  }
};

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [authMiddleware];

export default function AdminLayout() {
  const { data: currentUser, isLoading, isError, error } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center p-6 text-sm text-muted-foreground">
        Loading admin panel...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center p-6 text-sm text-destructive">
        {error?.message || "Unable to load admin panel."}
      </div>
    );
  }

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex h-full min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-lg border-destructive/30">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>
              You need admin permissions to access this area. Go back to{" "}
              <Link className="underline" to="/dashboard">
                dashboard
              </Link>
              .
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet context={{ currentUser }} />
      </SidebarInset>
    </SidebarProvider>
  );
}
