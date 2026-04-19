"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useRouter, usePathname } from "next/navigation"
import {
  LogOut,
  Settings,
  UserIcon,
  Shield,
  Bookmark,
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  Globe,
  MessageSquare,
  ChevronRight,
  Building2,
  ShieldCheck,
  ClipboardList,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { NotificationBell } from "./notification-bell"

interface DashboardSidebarProps {
  user: User
  profile: any
}

const userNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/personas", label: "Personas", icon: Users, exact: false },
  { href: "/dashboard/resumes", label: "Resumes", icon: FileText, exact: false },
  { href: "/dashboard/jobs", label: "Find Jobs", icon: Briefcase, exact: false },
  { href: "/community", label: "Community", icon: Globe, exact: false },
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare, exact: false },
]

const companyNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/company/jobs", label: "My Job Posts", icon: Briefcase, exact: false },
  { href: "/dashboard/company/applications", label: "Applications", icon: ClipboardList, exact: false },
  { href: "/dashboard/company/verification", label: "Verification", icon: ShieldCheck, exact: false },
  { href: "/community", label: "Community", icon: Globe, exact: false },
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare, exact: false },
]

export function DashboardSidebar({ user, profile }: DashboardSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const isCompanyRole = profile?.role === "company"
  const navItems = isCompanyRole ? companyNavItems : userNavItems

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const displayName = profile?.full_name || profile?.company_name || user.email?.split("@")[0] || "User"
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[#E8DDD1] bg-[#FDFAF6]">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-[#E8DDD1] px-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            isCompanyRole ? "bg-indigo-600" : "bg-[#A07850]"
          )}>
            {isCompanyRole ? (
              <Building2 className="h-4 w-4 text-white" />
            ) : (
              <span className="font-['DM Sans'] text-sm font-bold text-white">SP</span>
            )}
          </div>
          <Link href="/dashboard" className="font-['Playfair_Display'] text-lg font-bold text-[#3B2A1A]">
            Smart Persona
          </Link>
        </div>
        <NotificationBell />
      </div>

      {/* Role Badge */}
      {isCompanyRole && (
        <div className="mx-3 mt-3 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-700">Company Account</span>
            {profile?.verification_status === "verified" && (
              <span className="ml-auto text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                ✔ Verified
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? isCompanyRole
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-[#A07850] text-white shadow-sm"
                    : "text-[#6B4C30] hover:bg-[#F0E6D8] hover:text-[#3B2A1A]",
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
                {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-70" />}
              </Link>
            )
          })}
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-[#E8DDD1]" />

        <div className="space-y-1">
          {!isCompanyRole && (
            <Link
              href="/dashboard/jobs/saved"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                pathname === "/dashboard/jobs/saved"
                  ? "bg-[#A07850] text-white shadow-sm"
                  : "text-[#6B4C30] hover:bg-[#F0E6D8] hover:text-[#3B2A1A]",
              )}
            >
              <Bookmark className="h-4 w-4 flex-shrink-0" />
              <span>Saved Jobs</span>
            </Link>
          )}
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#6B4C30] transition-all duration-150 hover:bg-[#F0E6D8] hover:text-[#3B2A1A]"
            >
              <Shield className="h-4 w-4 flex-shrink-0" />
              <span>Admin Panel</span>
            </Link>
          )}
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-[#E8DDD1] p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 hover:bg-[#F0E6D8]">
              <div className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[#3B2A1A]",
                isCompanyRole ? "bg-indigo-200" : "bg-[#D4B896]"
              )}>
                <span className="text-xs font-semibold">{initials}</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="truncate text-sm font-medium text-[#3B2A1A]">{displayName}</p>
                  <span className={cn(
                    "text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded",
                    isCompanyRole ? "bg-indigo-100 text-indigo-700" : 
                    profile?.role === "admin" ? "bg-red-100 text-red-700" : 
                    "bg-[#E8DDD1] text-[#6B4C30]"
                  )}>
                    {profile?.role || "user"}
                  </span>
                </div>
                <p className="truncate text-xs text-[#6B4C30]">{user.email}</p>
              </div>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#A07850]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="mb-2 w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{displayName}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
                <span className={cn(
                  "text-xs font-semibold capitalize mt-0.5",
                  isCompanyRole ? "text-indigo-600" : 
                  profile?.role === "admin" ? "text-red-600" : 
                  "text-[#A07850]"
                )}>
                  {profile?.role || "User"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                Persona View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
