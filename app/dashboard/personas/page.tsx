import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireStandardUser } from "@/lib/auth/admin"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Edit } from "lucide-react"
import { ExportPersonaButton } from "@/components/personas/export-persona-button"
import { DeletePersonaButton } from "@/components/personas/delete-persona-button"
import { PersonasEmptyState } from "@/components/personas/personas-empty-state"

const avatarColors = [
  "bg-[#A07850]",
  "bg-[#7B9E87]",
  "bg-[#6B7FA3]",
  "bg-[#A0507B]",
  "bg-[#8B6BAE]",
]

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

export default async function PersonasPage() {
  await requireStandardUser()
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: personas } = await supabase
    .from("personas")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, persona_id, updated_at")
    .eq("user_id", user.id)
    .not("persona_id", "is", null)
    .order("updated_at", { ascending: false })

  const resumeByPersonaId = new Map((resumes || []).map((resume) => [resume.persona_id, resume.id]))

  return (
    <div className="p-6 md:p-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#3B2A1A]">Personas</h1>
          <p className="mt-1 text-sm text-[#9B8577]">
            {personas?.length ?? 0} AI {(personas?.length ?? 0) === 1 ? "personality" : "personalities"} configured
          </p>
        </div>
        <Button asChild className="bg-[#A07850] text-white hover:bg-[#8A6640] gap-1.5 rounded-lg">
          <Link href="/dashboard/personas/new">
            <Plus className="h-4 w-4" />
            New Persona
          </Link>
        </Button>
      </div>

      {personas && personas.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {personas.map((persona, i) => {
            const avatarBg = avatarColors[i % avatarColors.length]
            return (
              <div
                key={persona.id}
                className="group rounded-xl border border-[#E8DDD1] bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                {/* Card Header */}
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${avatarBg} text-white shadow-sm`}>
                    <span className="text-base font-bold">{getInitials(persona.name)}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-[#3B2A1A]">{persona.name}</h3>
                      {persona.visibility === "published" && (
                        <Badge className="h-4 rounded-full bg-green-100 px-1.5 text-[10px] font-medium text-green-700 hover:bg-green-100">
                          Published
                        </Badge>
                      )}
                      {persona.is_active && (
                        <Badge className="h-4 rounded-full bg-blue-100 px-1.5 text-[10px] font-medium text-blue-700 hover:bg-blue-100">
                          Active
                        </Badge>
                      )}
                    </div>
                    {persona.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-[#9B8577]">{persona.description}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2 border-t border-[#F0E6D8] pt-4">
                  <ExportPersonaButton
                    persona={persona}
                    resumeId={resumeByPersonaId.get(persona.id)}
                    variant="outline"
                    size="sm"
                    disabledMessage="No resume yet"
                  />
                  <Button asChild variant="outline" size="sm" className="flex-1 text-xs gap-1">
                    <Link href={`/dashboard/personas/${persona.id}/edit`}>
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                  </Button>
                  <DeletePersonaButton personaId={persona.id} personaName={persona.name} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-[#E8DDD1] bg-white p-12">
          <PersonasEmptyState />
        </div>
      )}
    </div>
  )
}