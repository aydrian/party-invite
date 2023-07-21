import { Index as ConfettiShower } from "confetti-react";
import { ClientOnly } from "remix-utils";

/**
 * confetti is a unique random identifier which re-renders the component
 */
export function Confetti({ confetti }: { confetti?: string }) {
  if (!confetti) return null;

  return (
    <ClientOnly>
      {() => (
        <ConfettiShower
          height={window.innerHeight}
          key={confetti}
          numberOfPieces={500}
          recycle={false}
          run={Boolean(confetti)}
          width={window.innerWidth}
        />
      )}
    </ClientOnly>
  );
}
