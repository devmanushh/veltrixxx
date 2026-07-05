import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "@/auth/components/LoginForm";
import { routes } from "@/routes";

export default async function Page() {
  const cookieStore = await cookies();

  if (cookieStore.get("token")?.value) {
    redirect(routes.spot);
  }

  return <LoginForm />;
}
