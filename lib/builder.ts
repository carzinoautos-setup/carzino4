import { builder } from '@builder.io/sdk'

// Initialize Builder.io with your public API key
const BUILDER_PUBLIC_KEY = process.env.BUILDER_PUBLIC_KEY || process.env.NEXT_PUBLIC_BUILDER_API_KEY

if (!BUILDER_PUBLIC_KEY) {
  throw new Error('BUILDER_PUBLIC_KEY is required. Please add it to your environment variables.')
}

builder.init(BUILDER_PUBLIC_KEY)

// Configure Builder.io settings
builder.canTrack = false // Disable analytics tracking if needed

export { builder }

// Helper function to get Builder.io content
export async function getBuilderContent(model: string, urlPath: string) {
  const content = await builder
    .get(model, {
      userAttributes: {
        urlPath,
      },
      includeRefs: true,
    })
    .toPromise()
    
  return content
}

// Helper function for generating static paths from Builder.io
export async function getBuilderStaticPaths(model: string) {
  const pages = await builder.getAll(model, {
    fields: 'data.url',
    limit: 100,
  })
  
  return pages?.map((page) => ({
    params: {
      page: page.data?.url?.split('/').filter(Boolean) || [],
    },
  })) || []
}
