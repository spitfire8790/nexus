import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserStatusBadge } from "./user-status-badge";
import { formatDistanceToNow } from "date-fns";
import type { Profile } from "@/lib/supabase-types";

interface UserCardProps {
  profile: Profile;
  className?: string;
}

export function UserCard({ profile, className }: UserCardProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar>
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback>{profile.username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <UserStatusBadge 
            status={profile.status || 'offline'} 
            className="absolute bottom-0 right-0 ring-2 ring-background"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{profile.username}</div>
          {profile.status_message && (
            <div className="text-sm text-muted-foreground truncate">
              {profile.status_message}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {profile.last_seen ? (
              `Last seen ${formatDistanceToNow(new Date(profile.last_seen), { addSuffix: true })}`
            ) : (
              'Never seen'
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 