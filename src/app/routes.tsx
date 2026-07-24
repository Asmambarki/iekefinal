import { createHashRouter as createBrowserRouter } from "react-router";
import StorePage from "./StorePage";
import AdminPage from "./AdminPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: StorePage,
  },
  {
    path: "/admin",
    Component: AdminPage,
  },
  {
    path: "/admin/login",
    Component: AdminPage,
  },
]);
