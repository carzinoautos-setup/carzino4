import { getBuilderContent } from '../lib/builder'
import { RenderBuilderContent } from '../components/builder/RenderBuilderContent'

interface PageProps {
  params: {
    page?: string[]
  }
}

export default async function Page({ params }: PageProps) {
  const urlPath = '/' + (params?.page?.join('/') || '')
  
  // Fetch Builder.io content for this page using the configured helper
  const content = await getBuilderContent('page', urlPath)

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
