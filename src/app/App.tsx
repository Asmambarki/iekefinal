import StorePage from "./StorePage";
import AdminPage from "./AdminPage";

export default function App() {
  const isAdmin = new URLSearchParams(window.location.search).has("admin");
  return isAdmin ? <AdminPage /> : <StorePage />;
}
