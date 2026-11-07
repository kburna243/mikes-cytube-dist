import ShopView, { shopMetadata } from "@/views/ShopView";

export const metadata = shopMetadata("en");

export default function Page() {
  return <ShopView lang="en" />;
}
