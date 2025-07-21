import { TagProfile } from "../../components/TagProfile"

interface PageProps {
  params: {
    tagId: string
  }
}

export default function TagPage({ params }: PageProps) {
  return <TagProfile tagId={params.tagId} />
}
