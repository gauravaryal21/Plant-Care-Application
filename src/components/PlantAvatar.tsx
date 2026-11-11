import { Leaf } from 'lucide-react';

interface PlantAvatarProps {
  name: string;
  photoUrl: string | null;
  className?: string;
}

export function PlantAvatar({ name, photoUrl, className = 'h-full w-full' }: PlantAvatarProps) {
  if (photoUrl) {
    return <img src={photoUrl} alt={name} loading="lazy" className={`${className} object-cover`} />;
  }
  return (
    <div className={`${className} flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-300`}>
      <Leaf className="h-1/3 w-1/3 text-brand-700" aria-hidden="true" />
    </div>
  );
}
