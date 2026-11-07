import GameView, { gameMetadata } from "@/views/GameView";

export const metadata = gameMetadata("de");

export default function Page() {
  return <GameView lang="de" />;
}
