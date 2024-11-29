import { cn } from "@/lib/utils";

interface UserStatusBadgeProps {
  status: 'online' | 'away' | 'busy' | 'offline';
  className?: string;
}

export function UserStatusBadge({ status, className }: UserStatusBadgeProps) {
  return (
    <div 
      className={cn(
        "h-2.5 w-2.5 rounded-full",
        status === 'online' && "bg-green-500",
        status === 'away' && "bg-yellow-500",
        status === 'busy' && "bg-red-500",
        status === 'offline' && "bg-gray-400",
        className
      )}
    />
  );
} 