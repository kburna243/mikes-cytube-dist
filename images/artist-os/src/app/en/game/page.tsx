import GameView, { gameMetadata } from "@/views/GameView";

export const metadata = gameMetadata("en");

export default function Page() {
  return <GameView lang="en" />;
}
