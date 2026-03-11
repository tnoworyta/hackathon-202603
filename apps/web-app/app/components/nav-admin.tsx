import { Car, Users as UsersIcon, UserCog } from "lucide-react";
import { Link } from "react-router";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "~/components/ui/sidebar";

type NavAdminProps = {
  isAdmin: boolean;
  currentPath: string;
};

export function NavAdmin({ isAdmin, currentPath }: NavAdminProps) {
  if (!isAdmin) {
    return null;
  }

  const isUsersRoute = currentPath.startsWith("/dashboard/admin/users");
  const isEmployeesRoute = currentPath.startsWith("/dashboard/admin/employees");
  const isParkingRoute = currentPath.startsWith("/dashboard/admin/parking-places");

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Users" isActive={isUsersRoute}>
            <Link to="/dashboard/admin/users">
              <UsersIcon className="size-4" />
              <span>Users</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Employees" isActive={isEmployeesRoute}>
            <Link to="/dashboard/admin/employees">
              <UserCog className="size-4" />
              <span>Employees</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Parking" isActive={isParkingRoute}>
            <Link to="/dashboard/admin/parking-places">
              <Car className="size-4" />
              <span>Parking</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
