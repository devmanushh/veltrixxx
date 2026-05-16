import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    redirect(routes.spot);
  } else {
    redirect(routes.login);
  }
}
