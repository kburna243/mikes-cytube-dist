import { ItemDetailView } from "./item-detail-view";

export function generateStaticParams() {
  return [{ id: "0" }];
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ItemDetailView id={id} />;
}
