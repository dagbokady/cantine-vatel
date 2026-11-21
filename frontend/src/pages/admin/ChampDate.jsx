import { CalendarDays } from "lucide-react";

// Sélecteur de date en pastille, partagé par les écrans admin.
export default function ChampDate({ value, onChange }) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-full border border-[#EBEBEB] bg-white pl-4 pr-2 text-[14px] text-[#222222] transition-colors focus-within:border-[#222222] hover:border-[#222222]">
      <CalendarDays size={16} strokeWidth={1.75} className="text-[#717171]" />
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Date"
        className="bg-transparent pr-1 outline-none" />
    </label>
  );
}
