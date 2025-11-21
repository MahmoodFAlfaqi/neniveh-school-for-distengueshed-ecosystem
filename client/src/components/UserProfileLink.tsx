import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserProfileLinkProps = {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  showAvatar?: boolean;
  className?: string;
};

export function UserProfileLink({ 
  userId, 
  name, 
  avatarUrl, 
  showAvatar = true,
  className = "" 
}: UserProfileLinkProps) {
  return (
    <Link 
      href={`/profile/${userId}`}
      className={`flex items-center gap-2 hover-elevate rounded-md px-1 py-0.5 ${className}`}
      data-testid={`link-profile-${userId}`}
    >
      {showAvatar && (
        <Avatar className="h-6 w-6">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
      <span className="font-medium">{name}</span>
    </Link>
  );
}
