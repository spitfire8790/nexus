import { useEffect } from 'react';
import { useCursorTracking } from '@/hooks/use-cursor-tracking';
import { getUsernameColor } from '@/lib/username-color';

export function UserCursors() {
  const { cursors, updateCursorPosition } = useCursorTracking('general');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      updateCursorPosition(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [updateCursorPosition]);

  return (
    <>
      {Object.entries(cursors).map(([username, position]) => (
        <div
          key={username}
          className="pointer-events-none fixed z-[100] select-none"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="flex flex-col items-center">
            <svg
              className="h-4 w-4 rotate-45"
              viewBox="0 0 24 24"
              fill={getUsernameColor(username).split('text-')[1] || 'gray'}
            >
              <path d="M0 0L16 16L8 16L0 24V0Z" />
            </svg>
            <span className="ml-1 rounded-md bg-background px-1.5 py-0.5 text-xs font-medium shadow-sm ring-1 ring-inset ring-gray-200">
              {username}
            </span>
          </div>
        </div>
      ))}
    </>
  );
} 