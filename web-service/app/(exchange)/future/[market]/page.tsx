import FuturesTradingPage from "@/components/futures/FuturesTradingPage";

type PageProps = {
  params: Promise<{
    market: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { market } = await params;

  return <FuturesTradingPage marketParam={market} />;
}
