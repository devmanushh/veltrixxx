import SpotTradingPage from "@/trading/components/spot/SpotTradingPage";

type PageProps = {
  params: Promise<{
    market: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { market } = await params;

  return <SpotTradingPage marketParam={market} />;
}
