import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  onValueChange: (value: number) => void;
  max?: number;
}

export function Rating({ value, onValueChange, max = 5 }: RatingProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onValueChange(i + 1)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              "h-4 w-4",
              i < value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );
} 