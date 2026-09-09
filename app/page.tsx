import { cookies } from "next/headers";
import Dashboard from "@/components/dashboard";
import LoginForm from "@/components/login-form";
import { isValidSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const authenticated = await isValidSession(cookieStore.get("class_session")?.value);
  return authenticated ? <Dashboard /> : <LoginForm />;
}
