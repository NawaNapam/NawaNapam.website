// app/chat/page.tsx
import Private from "@/components/auth/Private";
import VideoChatPage from "@/components/custom/VideoChat";

const VALID_PREFS = new Set(["random", "male", "female"]);

export type GenderFilter = "random" | "male" | "female";

export default function Chat({
  searchParams,
}: {
  searchParams: { pref?: string };
}) {
  const normalized = (searchParams.pref ?? "").toLowerCase();

  if (!normalized || !VALID_PREFS.has(normalized)) {
    return (
      <Private>
        <VideoChatPage gender="random" />
      </Private>
    );
  }

  return (
    <Private>
      <VideoChatPage gender={normalized as GenderFilter} />
    </Private>
  );
}
