import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();   //  await here
  const token = cookieStore.get("token")?.value;

  if (token) {
    redirect("/spot");
  } else {
    redirect("/login");
  }
}
