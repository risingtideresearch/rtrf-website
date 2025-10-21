import createImageUrlBuilder from '@sanity/image-url'
import {Image as SanityImage, type ImageProps} from 'next-sanity/image'

const imageBuilder = createImageUrlBuilder({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
})

export const urlForImage = (source: Parameters<(typeof imageBuilder)['image']>[0]) =>
  imageBuilder.image(source)

export function Image(
  props: Omit<ImageProps, 'src' | 'alt'> & {
    src: {
      _key?: string | null
      _type?: 'image' | string
      asset: {
        _type: 'reference'
        _ref: string
      } | {
        _id: string
        url: string
        metadata?: {
          dimensions?: {
            width: number
            height: number
          }
        }
      }
      crop?: {
        top: number
        bottom: number
        left: number
        right: number
      } | null
      hotspot?: {
        x: number
        y: number
        height: number
        width: number
      } | null
      alt?: string
    }
    alt?: string
  },
) {
  const {src, alt, width, height, ...rest} = props
  const imageUrl = urlForImage(src)
  
  // Extract dimensions from dereferenced asset if available
  const assetWidth = 'metadata' in src.asset ? src.asset.metadata?.dimensions?.width : undefined
  const assetHeight = 'metadata' in src.asset ? src.asset.metadata?.dimensions?.height : undefined
  
  const finalWidth = width || assetWidth
  const finalHeight = height || assetHeight
  
  if (finalWidth) {
    imageUrl.width(typeof finalWidth === 'string' ? parseInt(finalWidth, 10) : finalWidth)
  }
  if (finalHeight) {
    imageUrl.height(typeof finalHeight === 'string' ? parseInt(finalHeight, 10) : finalHeight)
  }

  if (!finalWidth || !finalHeight) {
    console.warn('Image is missing width/height. Please provide dimensions or dereference asset in query.')
  }

  return (
    <SanityImage
      alt={alt || src.alt || ''}
      width={finalWidth}
      height={finalHeight}
      {...rest}
      src={imageUrl.url()}
    />
  )
}
