"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, Lock, User } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  rememberMe: z.boolean().default(false).optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  const { formState: { isSubmitting, errors } } = form

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        if (
          error.message === "Invalid login credentials" ||
          error.message.toLowerCase().includes("invalid login credentials")
        ) {
          toast.error("รหัสผ่านไม่ถูกต้อง", {
            description: "อีเมลหรือรหัสผ่านที่คุณกรอกไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
          })
          form.setError("password", {
            type: "manual",
            message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
          })
          form.setValue("password", "")
        } else {
          toast.error("เข้าสู่ระบบไม่สำเร็จ", {
            description: error.message,
          })
        }
        return
      }

      if (data.rememberMe) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from("user_preferences").upsert({ user_id: user.id, remember_me: true })
        }
      }

      toast.success("Welcome back!")
      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      toast.error("An error occurred", {
        description: error.message || "Please try again later.",
      })
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      toast.error("Google sign in failed", {
        description: error.message,
      })
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left Side - Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0b5ed7] overflow-hidden items-center justify-center p-12">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#0d6efd]/20 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#3d8bfd]/20 blur-2xl" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-[#0a58ca]/40" />
        <div className="absolute bottom-10 left-10 w-[200px] h-[200px] rounded-full bg-[#3d8bfd]/30" />

        <div className="relative z-10 text-white max-w-lg">
          <h1 className="text-5xl font-bold tracking-tight mb-4 uppercase">Welcome</h1>
          <h2 className="text-2xl font-semibold mb-6 uppercase tracking-wider text-white/90">Smart Persona</h2>
          <p className="text-white/80 leading-relaxed max-w-md">
            Log in to continue your journey. Create, manage, and refine professional identities tailored for your applications.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex w-full justify-center items-center lg:w-1/2 p-8 sm:p-12 xl:p-24 bg-[#FAFAFA]">
        <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h2>
            <p className="text-gray-500 text-sm">Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-1">
              <div className="relative flex items-center">
                <User className="absolute left-3 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email Address"
                  className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                  {...form.register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 font-medium ml-1">{errors.email.message}</p>}
            </div>

            {/* Password Input */}
            <div className="space-y-1">
               <div className="relative flex items-center">
                <Lock className="absolute left-3 h-5 w-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="pl-10 pr-16 h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-xs font-semibold text-[#0b5ed7] hover:text-[#0a58ca] uppercase tracking-wide"
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 font-medium ml-1">{errors.password.message}</p>}
            </div>

            {/* Options */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                 <Checkbox 
                  id="rememberMe" 
                  className="border-gray-300 rounded-[4px] data-[state=checked]:bg-[#0b5ed7] data-[state=checked]:border-[#0b5ed7]"
                  checked={form.watch("rememberMe")}
                  onCheckedChange={(checked) => form.setValue("rememberMe", checked as boolean)}
                 />
                 <Label htmlFor="rememberMe" className="text-sm text-gray-600 font-normal cursor-pointer select-none">
                   Remember me
                 </Label>
              </div>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-semibold text-[#0b5ed7] hover:text-[#0a58ca] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#0b5ed7] hover:bg-[#0a58ca] text-white font-medium text-base rounded-md transition-colors shadow-sm"
              disabled={isSubmitting || isGoogleLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">Or</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isSubmitting || isGoogleLoading}
              className="w-full h-12 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 font-medium rounded-md transition-colors"
            >
              {isGoogleLoading ? (
                 <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                 <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.91 7.18l7.9 6.13c4.64-4.28 7.05-10.68 7.05-17.78z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.9-6.13c-2.15 1.45-4.92 2.3-8 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    <path fill="none" d="M0 0h48v48H0z" />
                 </svg>
              )}
              Sign in with Google
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link href="/auth/sign-up" className="font-semibold text-[#0b5ed7] hover:text-[#0a58ca] hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}