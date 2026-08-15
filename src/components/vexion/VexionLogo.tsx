import logo from "@/assets/vexion-logo.png";
import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  className?: string;
  glow?: boolean;
  pulsing?: boolean;
  priority?: boolean;
};

export function VexionLogo({
  size = 40,
  className,
  glow = false,
  pulsing = false,
  priority = false,
}: Props) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[28%] border border-white/25 bg-[oklch(0.15_0.04_265)]",
        pulsing && "animate-logo-glow",
        className,
      )}
      style={{
        width: size,
        height: size,
        boxShadow: glow ? "var(--vex-glow)" : undefined,
      }}
    >
      <img
        src={logo}
        alt="Logo Vexion AI"
        width={size}
        height={size}
        loading={priority ? "eager" : "lazy"}
        className="h-[78%] w-[78%] object-contain"
      />
    </span>
  );
}

export function TypingDots() {
  return (
    <span className="inline-flex items-end gap-1" aria-label="Vexion AI sedang mengetik">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-primary"
          style={{ animation: `vex-bounce-dot 1.1s ${i * 0.15}s infinite ease-in-out` }}
        />
      ))}
    </span>
  );
}
