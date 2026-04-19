import { Users, FileText, Briefcase, TrendingUp } from "lucide-react"

interface StatsCardsProps {
  personasCount: number
  resumesCount: number
  applicationsCount: number
  responsesCount: number
}

const stats = ({ personasCount, resumesCount, applicationsCount, responsesCount }: StatsCardsProps) => [
  {
    label: "Active Personas",
    value: personasCount,
    icon: Users,
    color: "bg-[#A07850]",
    lightColor: "bg-[#F5EDE2]",
    textColor: "text-[#A07850]",
    change: "+2 this week",
  },
  {
    label: "Resumes Created",
    value: resumesCount,
    icon: FileText,
    color: "bg-[#7B9E87]",
    lightColor: "bg-[#EBF3EE]",
    textColor: "text-[#7B9E87]",
    change: "Built from your real data",
  },
  {
    label: "Applications Sent",
    value: applicationsCount,
    icon: Briefcase,
    color: "bg-[#6B7FA3]",
    lightColor: "bg-[#EBF0F8]",
    textColor: "text-[#6B7FA3]",
    change: "How many jobs you applied to",
  },
  {
    label: "Company Responses",
    value: responsesCount,
    icon: TrendingUp,
    color: "bg-[#A0507B]",
    lightColor: "bg-[#F5EBF1]",
    textColor: "text-[#A0507B]",
    change: "Reviewed, accepted, or rejected",
  },
]

export function StatsCards(props: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats(props).map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-[#E8DDD1] bg-white p-5 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className={`rounded-lg ${stat.lightColor} p-2.5`}>
              <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
            </div>
          </div>
          <div className="mt-4">
            <p className={`font-['DM_Sans'] text-3xl font-bold ${stat.textColor}`}>
              {stat.value}
            </p>
            <p className="mt-1 text-sm font-medium text-[#3B2A1A]">{stat.label}</p>
            <p className="mt-0.5 text-xs text-[#9B8577]">{stat.change}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
