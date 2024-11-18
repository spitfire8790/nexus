const colors = [
  'text-red-500',
  'text-blue-500',
  'text-green-500',
  'text-purple-500',
  'text-yellow-500',
  'text-pink-500',
  'text-indigo-500',
  'text-orange-500',
  'text-teal-500',
  'text-cyan-500'
];

export function getUsernameColor(username: string): string {
  if (!username) return colors[0];
  
  // Create a hash of the username
  const hash = Array.from(username).reduce(
    (acc, char) => acc + char.charCodeAt(0), 0
  );
  
  // Use the hash to select a color
  return colors[hash % colors.length];
} 