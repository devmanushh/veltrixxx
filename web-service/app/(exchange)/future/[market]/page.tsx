import FuturesPage from "@/features/pages/FuturesPage";

type PageProps = {
  params: Promise<{
    market: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { market } = await params;

  return <FuturesPage marketParam={market} />;
}
