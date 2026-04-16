"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, Lock, User, Mail } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordStrength } from "@/components/ui/password-strength"

const signUpSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type SignUpFormValues = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  // Watch password to update strength meter
  const passwordValue = form.watch("password")

  const { formState: { isSubmitting, errors } } = form

  const onSubmit = async (data: SignUpFormValues) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: data.fullName,
          },
        },
      })

      if (error) {
        toast.error("Sign up failed", {
          description: error.message,
        })
        return
      }

      toast.success("Account created successfully! Please check your email for the verification code.")
      router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email)}`)
    } catch (error: any) {
      toast.error("An error occurred", {
        description: error.message || "Please try again later.",
      })
    }
  }

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      toast.error("Google sign up failed", {
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
          <h1 className="text-5xl font-bold tracking-tight mb-4 uppercase">Join Us</h1>
          <h2 className="text-2xl font-semibold mb-6 uppercase tracking-wider text-white/90">Smart Persona</h2>
          <p className="text-white/80 leading-relaxed max-w-md">
            Create an account to start building and managing your professional identities tailored for your applications.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex w-full justify-center items-center lg:w-1/2 p-8 sm:p-12 xl:p-24 bg-[#FAFAFA]">
        <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign Up</h2>
            <p className="text-gray-500 text-sm">Create your new account.</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name Input */}
            <div className="space-y-1">
              <div className="relative flex items-center">
                <User className="absolute left-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Full Name"
                  className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                  {...form.register("fullName")}
                />
              </div>
              {errors.fullName && <p className="text-xs text-red-500 font-medium ml-1">{errors.fullName.message}</p>}
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <div className="relative flex items-center">
                <Mail className="absolute left-3 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email Address"
                  className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
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
                  className="pl-10 pr-16 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
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
              <PasswordStrength password={passwordValue} className="mt-1.5" />
              {errors.password && <p className="text-xs text-red-500 font-medium ml-1">{errors.password.message}</p>}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1">
               <div className="relative flex items-center">
                <Lock className="absolute left-3 h-5 w-5 text-gray-400" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  className="pl-10 pr-16 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                  {...form.register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 text-xs font-semibold text-[#0b5ed7] hover:text-[#0a58ca] uppercase tracking-wide"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 font-medium ml-1">{errors.confirmPassword.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-2 bg-[#0b5ed7] hover:bg-[#0a58ca] text-white font-medium text-base rounded-md transition-colors shadow-sm"
              disabled={isSubmitting || isGoogleLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign up"
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
              onClick={handleGoogleSignUp}
              disabled={isSubmitting || isGoogleLoading}
              className="w-full h-11 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 font-medium rounded-md transition-colors"
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
              Sign up with Google
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-semibold text-[#0b5ed7] hover:text-[#0a58ca] hover:underline">
                Sign In
              </Link>
            </p>
            <p className="text-sm text-gray-500">
              Are you a company?{" "}
              <Link href="/auth/sign-up-company" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                Register as Company
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
