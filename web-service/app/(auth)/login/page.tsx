import LoginForm from "@/auth/components/LoginForm";

const DEFAULT_LOGIN_REDIRECT = "/spot/btcusdt";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
    error?: string;
  }>;
};

const getSafeRedirect = (value: string | undefined) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_LOGIN_REDIRECT;
  }

  return value;
};

export default async function Page({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <LoginForm
      nextPath={getSafeRedirect(params?.next)}
      error={params?.error}
    />
  );
}
