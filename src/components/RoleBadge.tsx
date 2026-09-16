import type { ClubePapel } from "../api/types";

export default function RoleBadge({ papel }: { papel: ClubePapel }) {
  const isLider = papel === "LIDER";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        isLider ? "bg-cream-50/20 text-cream-50" : "bg-cream-50/15 text-cream-50/90"
      }`}
    >
      {isLider ? "líder" : "membro"}
    </span>
  );
}
