import OrderSuccessClient from "./success-client";

export default function OrderSuccessPage({ searchParams }: { searchParams: { order?: string } }) {
  return <OrderSuccessClient order={searchParams.order || ""} />;
}

