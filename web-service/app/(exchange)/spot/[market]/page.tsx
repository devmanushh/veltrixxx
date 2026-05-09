import SpotPage from "@/features/pages/SpotPage";

type PageProps = {
  params: Promise<{
    market: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { market } = await params;

  return <SpotPage marketParam={market} />;
}
