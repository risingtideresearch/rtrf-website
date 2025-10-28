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
  
  const assetWidth = 'metadata' in src.asset ? src.asset.metadata?.dimensions?.width : undefined
  const assetHeight = 'metadata' in src.asset ? src.asset.metadata?.dimensions?.height : undefined
  
  // Calculate dimensions accounting for crop
  let finalWidth = width || assetWidth
  let finalHeight = height || assetHeight
  
  if (src.crop && assetWidth && assetHeight) {
    const {top = 0, bottom = 0, left = 0, right = 0} = src.crop
    
    // Calculate cropped dimensions as percentage of original
    const croppedWidthRatio = 1 - (left + right)
    const croppedHeightRatio = 1 - (top + bottom)
    
    // Apply crop ratios to dimensions
    if (!width && assetWidth) {
      finalWidth = Math.round(assetWidth * croppedWidthRatio)
    }
    if (!height && assetHeight) {
      finalHeight = Math.round(assetHeight * croppedHeightRatio)
    }
    
    // If only one dimension is specified, calculate the other maintaining aspect ratio
    if (width && !height && assetWidth && assetHeight) {
      const croppedAspectRatio = (assetWidth * croppedWidthRatio) / (assetHeight * croppedHeightRatio)
      finalHeight = Math.round((typeof width === 'string' ? parseInt(width, 10) : width) / croppedAspectRatio)
    } else if (height && !width && assetWidth && assetHeight) {
      const croppedAspectRatio = (assetWidth * croppedWidthRatio) / (assetHeight * croppedHeightRatio)
      finalWidth = Math.round((typeof height === 'string' ? parseInt(height, 10) : height) * croppedAspectRatio)
    }
  }
  
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
