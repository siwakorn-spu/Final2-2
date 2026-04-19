"use client"

import { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchInput } from "@/components/ui/search-input"
import { AdSpace } from "@/components/ads/ad-space"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, DollarSign, Briefcase, ExternalLink, Heart, Check, Send, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Job, Persona, JobMatch } from "@/lib/types"
import Link from "next/link"

interface JobsListProps {
  jobs: Job[]
  personas: Persona[]
  jobMatches: JobMatch[]
  resumes: { id: string; persona_id: string }[]
  userId: string
}

export function JobsList({ jobs, personas, jobMatches, resumes, userId }: JobsListProps) {
  const supabase = createClient()
  const [selectedPersona, setSelectedPersona] = useState<string>("all")
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [savingJobId, setSavingJobId] = useState<string | null>(null)
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null)
  
  // Application Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null)
  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  const [coverLetter, setCoverLetter] = useState("")

  const handleOpenApplyModal = (job: Job) => {
    setSelectedJobToApply(job)
    setSelectedResumeId(resumes.length > 0 ? resumes[0].id : "")
    setCoverLetter("")
    setIsApplyModalOpen(true)
  }

  const handleApplySubmit = async () => {
    if (!selectedJobToApply) return
    if (resumes.length === 0) {
      toast.error("You need a resume to apply.")
      return
    }
    
    setApplyingJobId(selectedJobToApply.id)
    try {
      const response = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: selectedJobToApply.id,
          resumeId: selectedResumeId,
          coverLetter: coverLetter,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to apply")
      }

      toast.success("Successfully applied for the job!")
      setIsApplyModalOpen(false)
      window.location.reload()
    } catch (error: any) {
      toast.error("Error applying", { description: error.message })
    } finally {
      setApplyingJobId(null)
    }
  }

  const calculateMatchScore = (job: Job, persona: Persona): number => {
    let score = 0
    const maxScore = 100

    // Match skills
    if (persona.career?.specializations && job.skills) {
      const matchingSkills = persona.career.specializations.filter((skill) =>
        job.skills.some((jobSkill) => jobSkill.toLowerCase().includes(skill.toLowerCase())),
      )
      score += (matchingSkills.length / Math.max(job.skills.length, 1)) * 40
    }

    // Match industry
    if (persona.career?.industry && job.industry) {
      if (persona.career.industry.toLowerCase() === job.industry.toLowerCase()) {
        score += 20
      }
    }

    // Match experience
    if (persona.career?.experience_years && job.experience_required) {
      if (persona.career.experience_years >= job.experience_required) {
        score += 15
      }
    }

    // Match remote preference
    if (persona.job_preferences?.remote && job.remote) {
      score += 10
    }

    // Match location
    if (persona.job_preferences?.location && job.location) {
      const matchesLocation = persona.job_preferences.location.some((loc) =>
        job.location?.toLowerCase().includes(loc.toLowerCase()),
      )
      if (matchesLocation) score += 10
    }

    // Match salary
    if (persona.job_preferences?.salary_range && job.salary_min && job.salary_max) {
      const personaMin = persona.job_preferences.salary_range.min
      const personaMax = persona.job_preferences.salary_range.max
      if (job.salary_min >= personaMin && job.salary_max <= personaMax) {
        score += 5
      }
    }

    return Math.min(Math.round(score), maxScore)
  }

  const getJobsWithScores = () => {
    if (selectedPersona === "all") {
      return jobs.map((job) => ({
        ...job,
        match_score: personas.length > 0 ? Math.max(...personas.map((p) => calculateMatchScore(job, p))) : 0,
      }))
    }

    const persona = personas.find((p) => p.id === selectedPersona)
    if (!persona) return jobs.map((job) => ({ ...job, match_score: 0 }))

    return jobs.map((job) => ({
      ...job,
      match_score: calculateMatchScore(job, persona),
    }))
  }

  const filteredJobs = useMemo(() => {
    let filtered = getJobsWithScores()

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.skills?.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Apply status filter
    if (filter === "saved") {
      filtered = filtered.filter((job) => jobMatches.some((m) => m.job_id === job.id && m.status === "saved"))
    } else if (filter === "applied") {
      filtered = filtered.filter((job) => jobMatches.some((m) => m.job_id === job.id && m.status === "applied"))
    } else if (filter === "high-match") {
      filtered = filtered.filter((job) => job.match_score >= 60)
    }

    // Sort by match score
    return filtered.sort((a, b) => b.match_score - a.match_score)
  }, [jobs, selectedPersona, searchQuery, filter, personas, jobMatches])
   
    // Handle save job
  const handleSaveJob = async (jobId: string) => {
    setSavingJobId(jobId)
    try {
      const existingMatch = jobMatches.find((m) => m.job_id === jobId)

      if (existingMatch) {
        await supabase.from("job_matches").update({ status: "saved" }).eq("id", existingMatch.id)
      } else {
        await supabase.from("job_matches").insert({
          user_id: userId,
          job_id: jobId,
          persona_id: selectedPersona !== "all" ? selectedPersona : personas[0]?.id,
          status: "saved",
          match_score: filteredJobs.find((j) => j.id === jobId)?.match_score || 0,
        })
      }
      window.location.reload()
    } catch (error) {
      console.error("Error saving job:", error)
    } finally {
      setSavingJobId(null)
    }
  }

  const isJobSaved = (jobId: string) => {
    return jobMatches.some((m) => m.job_id === jobId && m.status === "saved")
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search jobs by title, company, skills, or industry"
          className="w-full"
        />

        <div className="flex flex-wrap gap-4">
          <Select value={selectedPersona} onValueChange={setSelectedPersona}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select persona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Personas</SelectItem>
              {personas.map((persona) => (
                <SelectItem key={persona.id} value={persona.id}>
                  {persona.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              <SelectItem value="high-match">High Match (60%+)</SelectItem>
              <SelectItem value="saved">Saved Jobs</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredJobs.length} of {jobs.length} jobs
      </p>

      {filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job, index) => (
            <div key={job.id} className="contents">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle>{job.title}</CardTitle>
                        {job.match_score > 0 && (
                          <Badge
                            variant={
                              job.match_score >= 70 ? "default" : job.match_score >= 50 ? "secondary" : "outline"
                            }
                          >
                            {job.match_score}% Match
                          </Badge>
                        )}
                        {job.remote && <Badge variant="outline">Remote</Badge>}
                      </div>
                      <CardDescription className="mt-2">
                        {job.company} • {job.industry}
                      </CardDescription>
                    </div>
                    {/* Save click */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSaveJob(job.id)}
                      disabled={savingJobId === job.id}
                    >
                      {isJobSaved(job.id) ? <Check className="h-5 w-5 text-primary" /> : <Heart className="h-5 w-5" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">{job.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm mb-4">
                    {job.location && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                    )}
                    {job.salary_min && job.salary_max && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />${job.salary_min.toLocaleString()} - $
                        {job.salary_max.toLocaleString()}
                      </div>
                    )}
                    {job.job_type && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span className="capitalize">{job.job_type}</span>
                      </div>
                    )}
                  </div>

                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="default" 
                      className="w-full bg-[#0b5ed7] hover:bg-[#0a58ca] text-white" 
                      onClick={() => handleOpenApplyModal(job)}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Apply with Resume
                    </Button>
                    
                    {job.application_url && (
                      <Button asChild variant="outline" className="w-full bg-transparent">
                        <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                          Or Apply Externally
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              {(index + 1) % 3 === 0 && index !== filteredJobs.length - 1 && (
                <AdSpace key={`ad-${index}`} placement="feed" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No jobs found</h3>
            <p className="text-center text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search query or filters"
                : "Try adjusting your filters or create a persona with career information"}
            </p>
            {searchQuery && (
              <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Apply Modal */}
      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJobToApply?.title}</DialogTitle>
            <DialogDescription>
              Submit your resume and cover letter to apply for this position at {selectedJobToApply?.company}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {resumes.length === 0 ? (
              <div className="text-center space-y-4 py-8 bg-[#F5EDE2] rounded-lg">
                <Briefcase className="h-12 w-12 text-[#A07850] mx-auto opacity-50" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-900">No Resumes Found</h3>
                  <p className="text-sm text-gray-500">You must create a resume before you can apply for jobs.</p>
                </div>
                <Button asChild className="bg-[#A07850] hover:bg-[#8A6640] text-white">
                  <Link href="/dashboard/resumes/new">Create Resume Now</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Select Resume to Submit *
                  </label>
                  <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a resume" />
                    </SelectTrigger>
                    <SelectContent>
                      {resumes.map((resume) => {
                        const persona = personas.find(p => p.id === resume.persona_id);
                        return (
                          <SelectItem key={resume.id} value={resume.id}>
                            {persona?.name ? `${persona.name}'s Resume` : 'Untitled Resume'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Cover Letter (Optional)
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Introduce yourself to the hiring manager..."
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </Button>
            {resumes.length > 0 && (
              <Button 
                onClick={handleApplySubmit} 
                className="bg-[#0b5ed7] hover:bg-[#0a58ca] text-white"
                disabled={!selectedResumeId || applyingJobId === selectedJobToApply?.id}
              >
                {applyingJobId === selectedJobToApply?.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
