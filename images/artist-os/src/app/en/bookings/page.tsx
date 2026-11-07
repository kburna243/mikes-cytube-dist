import BookingsView, { bookingsMetadata } from "@/views/BookingsView";

export const metadata = bookingsMetadata("en");
export const dynamic = "force-dynamic";

export default function Page() {
  return <BookingsView lang="en" />;
}
