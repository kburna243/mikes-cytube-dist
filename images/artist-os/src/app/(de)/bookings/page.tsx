import BookingsView, { bookingsMetadata } from "@/views/BookingsView";

export const metadata = bookingsMetadata("de");
export const dynamic = "force-dynamic";

export default function Page() {
  return <BookingsView lang="de" />;
}
