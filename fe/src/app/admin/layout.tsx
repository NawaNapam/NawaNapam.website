import { AdminAuthProvider } from "@/components/admin/AdminAuthProvider";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Console",
  description: "Administration dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </AdminAuthProvider>
  );
}
