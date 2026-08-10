import { redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/admin/session";
import LoginForm from "./login-form";

export default async function AdminLoginPage() {
  const isLoggedIn = await hasValidAdminSession();
  if (isLoggedIn) redirect("/admin");

  return (
    <main className="flex-1 flex items-center justify-center px-4 bg-ink min-h-screen">
      <div className="w-full max-w-sm">
        <p className="section-eyebrow text-brass text-center">
          Administración
        </p>
        <h1 className="section-title mt-2 text-xl text-bone text-center">
          Ingresar
        </h1>
        <LoginForm />
      </div>
    </main>
  );
}
