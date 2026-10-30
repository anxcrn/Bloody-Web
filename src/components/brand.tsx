import heart from "@/assets/heart.png.asset.json";
import { cn } from "@/lib/utils";

export const heartUrl = heart.url;

export function HeartAvatar({ className }: { className?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent", className)}>
      <img src={heart.url} alt="Bloody heart logo" className="h-[85%] w-[85%] object-contain mix-blend-multiply" />
    </div>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("font-brand tracking-wide text-primary", className)}>BLOODY</span>;
}
