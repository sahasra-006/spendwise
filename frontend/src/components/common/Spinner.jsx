export default function Spinner({ size = 'md', className = '' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size];
  return (
    <div
      className={`${sz} rounded-full border-2 border-gray-700 border-t-brand-500 animate-spin ${className}`}
      aria-label="Loading"
    />
  );
}
