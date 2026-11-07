import ContactView, { contactMetadata } from "@/views/ContactView";

export const metadata = contactMetadata("de");

export default function Page() {
  return <ContactView lang="de" />;
}
