import { type RouteConfig, layout, route } from "@react-router/dev/routes";

export default [
  layout("modules/Landing/Landing.layout.tsx", [
    route("", "modules/Landing/Landing.page.tsx", { index: true }),
    route("about", "modules/Landing/About.page.tsx")
  ]),
  layout("modules/Auth/Auth.layout.tsx", [
    route("auth", "modules/Auth/Auth.page.tsx"),
    route("forgot-password", "modules/Auth/ForgotPassword.page.tsx"),
    route("new-password", "modules/Auth/NewPassword.page.tsx")
  ]),
  layout("modules/dashboard/dashboard.layout.tsx", [
    route("dashboard", "modules/dashboard/dashboard.page.tsx", { index: true }),
    route("dashboard/parking", "modules/dashboard/parking/parking.page.tsx"),
    route(
      "dashboard/parking/reservations",
      "modules/dashboard/parking/reservations.page.tsx"
    ),
    route("dashboard/admin/users", "modules/dashboard/admin/users.page.tsx"),
    route(
      "dashboard/admin/employees",
      "modules/dashboard/admin/employees.page.tsx"
    ),
    route(
      "dashboard/admin/parking-places",
      "modules/dashboard/admin/parking-places.page.tsx"
    ),
    route(
      "dashboard/admin/parking-places/:id",
      "modules/dashboard/admin/parking-place.page.tsx"
    )
  ]),
  route("/.well-known/appspecific/com.chrome.devtools.json", "modules/dev/dev-null.tsx")
] satisfies RouteConfig;
