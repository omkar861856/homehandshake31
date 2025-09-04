"use client";

import { SSOLoginButton } from "@/components/SSOLoginButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserButton, useUser } from "@clerk/nextjs";
import { Sparkles, Video } from "lucide-react";
import { redirect } from "next/navigation";

export default function OnboardingScreen() {
  const { user, isSignedIn, isLoaded } = useUser();

  // First check authentication
  if (isLoaded && !isSignedIn) {
    redirect("/");
  }

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4 shadow-lg animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Then check if user already has an active account (shouldn't be here if active)
  const activeAccountValue = user?.publicMetadata?.["account-active"];
  if (activeAccountValue === true) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Video className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">
                ContentClip AI
              </h1>
            </div>
            <div className="ml-auto flex items-center space-x-4">
              {/* Show SSO button during onboarding */}
              <SSOLoginButton
                showDetails={false}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              />
              <span className="text-sm text-muted-foreground">
                Welcome back, {user?.firstName}!
              </span>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 relative z-50 cursor-pointer",
                    userButtonPopoverCard:
                      "bg-background border border-border z-50",
                    userButtonPopoverActionButton:
                      "text-foreground hover:bg-accent",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 pt-20">
        <div className="max-w-md w-full relative z-10">
          {/* Main Card */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-30"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Account Activation
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Your account is being processed
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-8 pb-8">
              {/* Main message card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4 shadow-md">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Thank you for joining HomeHandshake!
                  </h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Your account will be activated within{" "}
                    <span className="font-semibold text-blue-600">
                      24 to 36 hours
                    </span>
                    .
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
