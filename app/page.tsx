import { builder } from '@builder.io/sdk'
import { RenderBuilderContent } from '../components/builder/RenderBuilderContent'

// Initialize Builder.io
builder.init(process.env.BUILDER_PUBLIC_KEY!)

interface PageProps {
  params: {
    page?: string[]
  }
}

export default async function Page({ params }: PageProps) {
  const urlPath = '/' + (params?.page?.join('/') || '')
  
  // Fetch Builder.io content for this page
  const content = await builder
    .get('page', {
      userAttributes: {
        urlPath,
      },
    })
    .toPromise()

  return (
    <div>
      <RenderBuilderContent content={content} />
    </div>
  )
}

export async function generateStaticParams() {
  return [
    { page: [] }, // Home page
    { page: ['vehicles'] }, // Vehicles listing page
    { page: ['inventory'] }, // Alternative vehicles page
  ]
}
