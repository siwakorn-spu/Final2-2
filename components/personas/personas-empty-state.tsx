"use client"

import { EmptyState } from "@/components/ui/empty-state"
import { UserCircle } from "lucide-react"

export function PersonasEmptyState() {
  return (
    <EmptyState
      icon={UserCircle}
      title="No personas yet"
      description="Create your first AI personality to start managing your professional presence and automating interactions across platforms."
      action={{
        label: "Create Your First Persona",
        href: "/dashboard/personas/new",
      }}
      secondaryAction={{
        label: "Learn More",
        href: "/community",
      }}
    />
  )
}