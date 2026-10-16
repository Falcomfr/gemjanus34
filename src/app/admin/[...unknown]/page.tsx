import { notFound } from "next/navigation";

// Unknown admin addresses get the admin 404, inside the admin layout.
export default function UnknownAdminPage() {
  notFound();
}
