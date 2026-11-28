// Animation
function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-hover ${className}`} />
}

export default Skeleton;