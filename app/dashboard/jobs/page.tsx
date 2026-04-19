import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { JobsList } from "@/components/jobs/jobs-list"
import { AdSpace } from "@/components/ads/ad-space"
import { Briefcase } from "lucide-react"

export default async function JobsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: personas } = await supabase.from("personas").select("*").eq("user_id", user.id).eq("is_active", true)

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  const { data: jobMatches } = await supabase.from("job_matches").select("*, jobs(*)").eq("user_id", user.id)
  const { data: resumes } = await supabase.from("resumes").select("id, persona_id, updated_at").eq("user_id", user.id)

  return (
    <div className="p-6 md:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5EDE2]">
            <Briefcase className="h-5 w-5 text-[#A07850]" />
          </div>
          <div>
            <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#3B2A1A]">Find Jobs</h1>
            <p className="text-sm text-[#9B8577]">Discover opportunities matching your personas</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <AdSpace placement="banner" />
      </div>

      <JobsList jobs={jobs || []} personas={personas || []} jobMatches={jobMatches || []} resumes={resumes || []} userId={user.id} />
    </div>
  )
}
