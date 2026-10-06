import { OrdersView } from "./components";

type OrdersPageProps = {
  searchParams: Promise<{ create?: string | string[] }>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const { create } = await searchParams;

  return <OrdersView initialAddModalOpen={create === "1"} />;
}
