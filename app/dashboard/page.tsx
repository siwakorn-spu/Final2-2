import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { ActivePersonas } from "@/components/dashboard/active-personas"
import { AdSpace } from "@/components/ads/ad-space"
import { LayoutDashboard } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const isCompany = profile?.role === "company"

  const { data: personas } = await supabase.from("personas").select("*").eq("user_id", user.id)

  return (
    <div className="p-6 md:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5EDE2]">
            <LayoutDashboard className="h-5 w-5 text-[#A07850]" />
          </div>
          <div>
            <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#3B2A1A]">
              {isCompany ? "Company Dashboard" : "Dashboard"}
            </h1>
            <p className="text-sm text-[#9B8577]">
              {isCompany ? "Overview of your company workspace and job postings" : "Overview of your Smart Persona workspace"}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <AdSpace placement="banner" />
      </div>

      {isCompany ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#E8DDD1] bg-white p-6 md:p-8 text-center shadow-sm">
            <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#3B2A1A] mb-2">Welcome to your Company Portal</h2>
            <p className="text-[#6B4C30] mb-6">Manage your job postings, view applications, and connect with candidates.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <StatsCards personasCount={personas?.length || 0} />
          <ActivePersonas personas={personas || []} />
        </div>
      )}
    </div>
  )
}
