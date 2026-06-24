'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { Button } from '../../common/ui/button'
import { Typography } from '../../common/ui/typography'
import type { ImageUrlTabPayload } from '../../../pages/Workspaces/types'
import type { GooglePlaceDetails } from './handlers/googlePlaceDetailsTypes'
import { buildGooglePlacePhotoProxyUrl } from './handlers/buildGooglePlacePhotoProxyUrl'
import { formatGooglePlaceReviewPreview } from './handlers/formatGooglePlaceReviewPreview'
import { handlePlacePhotoClick } from './handlers/handlePlacePhotoClick'

interface SelectedPlaceGoogleEnrichmentProps {
  details: GooglePlaceDetails
  onPhotoOpen?: (image: ImageUrlTabPayload) => void
}

function StarRow({ rating }: Readonly<{ rating: number }>) {
  const filled = Math.min(5, Math.max(0, Math.round(rating)))

  return (
    <span className="inline-flex items-center gap-0.5 text-primary" aria-hidden>
      {Array.from({ length: filled }, (_, i) => (
        <Star key={`f-${i}`} className="h-3 w-3 fill-primary" strokeWidth={1.5} />
      ))}
      {Array.from({ length: 5 - filled }, (_, i) => (
        <Star key={`e-${i}`} className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
      ))}
    </span>
  )
}

export function SelectedPlaceGoogleEnrichment({ details, onPhotoOpen }: Readonly<SelectedPlaceGoogleEnrichmentProps>) {
  const [expandedReviewIndex, setExpandedReviewIndex] = useState<number | null>(null)

  return (
    <div className="min-w-0 space-y-4 border-t border-border pt-3">
      {details.photos.length > 0 ? (
        <div className="space-y-2">
          <Typography variant="xs" className="font-semibold text-foreground">
            Photos
          </Typography>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {details.photos.map((photo, index) => (
              <div key={photo.name} className="w-24 flex-shrink-0 space-y-1">
                <button
                  type="button"
                  className="group block w-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={`Open ${details.name ? `${details.name} photo` : 'place photo'} ${index + 1}`}
                  onClick={() => handlePlacePhotoClick({ details, photo, index, onPhotoOpen })}
                >
                  <Image
                    src={buildGooglePlacePhotoProxyUrl(photo.name, { maxWidthPx: 240, maxHeightPx: 240 })}
                    alt={details.name ? `${details.name} photo ${index + 1}` : `Place photo ${index + 1}`}
                    width={96}
                    height={96}
                    unoptimized
                    loading={index < 3 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="aspect-square w-full rounded-md border border-border bg-muted object-cover transition-transform group-hover:scale-[1.02]"
                  />
                </button>
                {photo.authorAttributions.length > 0 ? (
                  <Typography variant="xs" className="text-[10px] leading-snug text-muted-foreground">
                    {photo.authorAttributions.map((attr, j) => (
                      <span key={`${photo.name}-attr-${j}`}>
                        {j > 0 ? ' · ' : ''}
                        {attr.uri ? (
                          <a
                            href={attr.uri}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-2 hover:text-foreground"
                          >
                            {attr.displayName ?? 'Photo credit'}
                          </a>
                        ) : (
                          attr.displayName
                        )}
                      </span>
                    ))}
                  </Typography>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {details.amenityGroups.length > 0 ? (
        <div className="space-y-3">
          <Typography variant="xs" className="font-semibold text-foreground">
            Amenities and services
          </Typography>
          {details.amenityGroups.map(group => (
            <div key={group.title} className="space-y-1.5">
              <Typography variant="xs" className="text-muted-foreground">
                {group.title}
              </Typography>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map(label => (
                  <span
                    key={`${group.title}-${label}`}
                    className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {details.reviews.length > 0 ? (
        <div className="space-y-2">
          <Typography variant="xs" className="font-semibold text-foreground">
            Reviews
          </Typography>
          <ul className="list-none space-y-3">
            {details.reviews.map((review, index) => {
              const isExpanded = expandedReviewIndex === index
              const { preview, isTruncated } = formatGooglePlaceReviewPreview(review.text)
              const body = isExpanded ? review.text.trim() : preview

              return (
                <li
                  key={`${index}-${review.authorDisplayName ?? ''}-${review.relativePublishTimeDescription ?? ''}`}
                  className="border-b border-border pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {typeof review.rating === 'number' ? <StarRow rating={review.rating} /> : null}
                    {review.relativePublishTimeDescription ? (
                      <Typography variant="xs" className="text-muted-foreground">
                        {review.relativePublishTimeDescription}
                      </Typography>
                    ) : null}
                  </div>
                  {review.authorDisplayName ? (
                    <Typography variant="xs" className="mt-1 font-medium text-foreground">
                      {review.authorUri ? (
                        <a
                          href={review.authorUri}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {review.authorDisplayName}
                        </a>
                      ) : (
                        review.authorDisplayName
                      )}
                    </Typography>
                  ) : null}
                  {body ? (
                    <Typography variant="xs" className="mt-1 whitespace-pre-wrap text-muted-foreground">
                      {body}
                    </Typography>
                  ) : null}
                  {isTruncated ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="mt-1 h-auto p-0 text-xs"
                      onClick={() => setExpandedReviewIndex(isExpanded ? null : index)}
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                    </Button>
                  ) : null}
                </li>
              )
            })}
          </ul>
          {details.googleMapsUri ? (
            <Typography variant="xs" className="text-muted-foreground">
              <a
                href={details.googleMapsUri}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
              >
                View all reviews on Google Maps
              </a>
            </Typography>
          ) : null}
        </div>
      ) : null}

      <Typography variant="xs" className="border-t border-border pt-2 text-muted-foreground">
        Place information (including photos and reviews) may be from{' '}
        <a
          href={details.googleMapsUri || 'https://www.google.com/maps'}
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline underline-offset-2 hover:text-primary"
        >
          Google Maps
        </a>
        . Data © Google.
      </Typography>
    </div>
  )
}
