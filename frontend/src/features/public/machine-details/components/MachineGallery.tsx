import { useState, type KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight, Package } from 'lucide-react'

export interface GalleryImage {
  id: number
  url: string
  alt: string
}

interface MachineGalleryProps {
  images: GalleryImage[]
}

function MachineGallery({ images }: MachineGalleryProps) {
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState<number[]>([])

  const count = images.length
  const current = images[index]
  const showPlaceholder = !current || failed.includes(current.id)

  const go = (step: number) => setIndex((i) => (i + step + count) % count)

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') go(-1)
    if (event.key === 'ArrowRight') go(1)
  }

  const markFailed = (id: number) =>
    setFailed((list) => (list.includes(id) ? list : [...list, id]))

  return (
    <div role="group" aria-label="Machine images" onKeyDown={onKeyDown}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-surface-alt">
        {showPlaceholder ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-fg-muted">
            <Package className="h-14 w-14 opacity-50" aria-hidden="true" />
            <p className="text-sm">No image available</p>
          </div>
        ) : (
          <img
            src={current.url}
            alt={current.alt}
            onError={() => markFailed(current.id)}
            className="h-full w-full object-contain p-4"
          />
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-line bg-card/90 p-2 text-fg shadow-sm backdrop-blur transition hover:bg-card focus-visible:outline-2 focus-visible:outline-brand-red"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-line bg-card/90 p-2 text-fg shadow-sm backdrop-blur transition hover:bg-card focus-visible:outline-2 focus-visible:outline-brand-red"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-fg-muted backdrop-blur">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((image, i) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                className={`aspect-square w-full overflow-hidden rounded-lg border-2 bg-surface-alt transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red ${
                  i === index ? 'border-brand-red' : 'border-line opacity-70 hover:opacity-100'
                }`}
              >
                {failed.includes(image.id) ? (
                  <Package className="mx-auto h-5 w-5 text-fg-muted" aria-hidden="true" />
                ) : (
                  <img
                    src={image.url}
                    alt=""
                    loading="lazy"
                    onError={() => markFailed(image.id)}
                    className="h-full w-full object-cover"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default MachineGallery