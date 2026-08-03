import { UserRound } from 'lucide-react';
import type { NotificationActorInfo } from '../types/notification.type';

interface NotificationActorProps {
  actors: NotificationActorInfo[];
}

export const NotificationActor = ({ actors }: NotificationActorProps) => {
  const visibleActors = actors.slice(0, 3);

  if (visibleActors.length === 0) {
    return (
      <div
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#181818] text-gray-500"
      >
        <UserRound className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="relative h-11 shrink-0"
      style={{ width: `${44 + (visibleActors.length - 1) * 18}px` }}
    >
      {visibleActors.map((actor, index) => (
        <div
          key={actor._id}
          className="absolute top-0 h-11 w-11 overflow-hidden rounded-full border-2 border-black bg-[#181818]"
          style={{ left: `${index * 18}px`, zIndex: visibleActors.length - index }}
        >
          {actor.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={actor.avatar}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-500">
              <UserRound className="h-5 w-5" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
