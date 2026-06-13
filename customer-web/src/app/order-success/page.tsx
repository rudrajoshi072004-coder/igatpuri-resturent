import OrderSuccessClient from "./success-client";

export default function OrderSuccessPage({ searchParams }: { searchParams: { order?: string; pay?: string } }) {
  return <OrderSuccessClient order={searchParams.order || ""} payAmount={searchParams.pay || ""} />;
}

