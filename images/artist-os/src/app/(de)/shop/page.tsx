import ShopView, { shopMetadata } from "@/views/ShopView";

export const metadata = shopMetadata("de");

export default function Page() {
  return <ShopView lang="de" />;
}
