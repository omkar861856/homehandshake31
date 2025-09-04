"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useAyrshareData } from "@/hooks/useAyrshareData";
import { useUser } from "@clerk/nextjs";
import {
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Hash,
  Loader2,
  MapPin,
  Play,
  Send,
  Share2,
  TrendingUp,
  Users,
  Video,
  X,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface VideoClip {
  kind: string;
  id: string;
  selfLink: string;
  mediaLink: string;
  name: string;
  bucket: string;
  generation: string;
  metageneration: string;
  contentType: string;
  storageClass: string;
  size: string;
  md5Hash: string;
  crc32c: string;
  etag: string;
  timeCreated: string;
  updated: string;
  timeStorageClassUpdated: string;
  timeFinalized: string;
}

interface PostVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoClip;
}

interface PlatformConfig {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  maxLength: number;
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
}

interface ConnectedAccount {
  platform: string;
  username: string;
  displayName: string;
  profileUrl?: string;
  followers?: number;
  verified?: boolean;
}

const platformConfigs: Record<string, PlatformConfig> = {
  twitter: {
    name: "Twitter",
    icon: ({ className }: { className?: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    maxLength: 280,
    color: "text-blue-400",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    gradient: "from-blue-400 to-blue-600",
  },
  instagram: {
    name: "Instagram",
    icon: ({ className }: { className?: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    maxLength: 2200,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    gradient: "from-pink-400 to-purple-600",
  },
  linkedin: {
    name: "LinkedIn",
    icon: ({ className }: { className?: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.047-1.852-3.047-1.853 0-2.136 1.445-2.136 2.939v5.677H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    maxLength: 3000,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    gradient: "from-blue-500 to-blue-700",
  },
  facebook: {
    name: "Facebook",
    icon: ({ className }: { className?: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    maxLength: 63206,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    gradient: "from-blue-500 to-blue-700",
  },
  youtube: {
    name: "YouTube",
    icon: ({ className }: { className?: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    maxLength: 5000,
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    gradient: "from-red-400 to-red-600",
  },
  tiktok: {
    name: "TikTok",
    icon: ({ className }: { className?: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
    maxLength: 2200,
    color: "text-gray-800",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    gradient: "from-gray-400 to-gray-600",
  },
  bluesky: {
    name: "Bluesky",
    icon: ({ className }: { className?: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
    maxLength: 300,
    color: "text-sky-500",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    gradient: "from-sky-400 to-sky-600",
  },
};

export default function PostVideoModal({
  isOpen,
  onClose,
  video,
}: PostVideoModalProps) {
  const { user } = useUser();
  const { ayrshareData } = useAyrshareData();
  const addToast = useToast();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [mediaUrl, setMediaUrl] = useState(video.mediaLink);
  const [postResult, setPostResult] = useState<{
    status?: string;
    postIds?: Array<{ platform: string; postUrl?: string; id: string }>;
  } | null>(null);

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    status: string;
    message: string;
    warnings?: Array<{ code: number; message: string }>;
  } | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPlatforms([]);
      setCaption("");
      setHashtags("");
      setValidationResult(null);
      setPostResult(null);
      setErrors([]);
      setMediaUrl(video.mediaLink);
      setCurrentStep(1);
    }
  }, [isOpen, video.mediaLink]);

  const getConnectedAccounts = (): ConnectedAccount[] => {
    if (!ayrshareData?.displayNames) return [];

    return ayrshareData.displayNames
      .filter(
        (account: {
          platform?: string;
          username?: string;
          displayName?: string;
          id?: string;
        }) => {
          // Check if account has required fields
          if (!account.platform) return false;

          // Some platforms might not have username, but have displayName
          // or other identifier fields
          const hasIdentifier =
            account.username || account.displayName || account.id;
          return hasIdentifier;
        }
      )
      .map(
        (account: {
          platform: string;
          username?: string;
          displayName?: string;
          id?: string;
          profileUrl?: string;
          followers?: number;
          isVerified?: boolean;
          verified?: boolean;
        }) => ({
          platform: account.platform.toLowerCase(),
          username:
            account.username || account.displayName || account.id || "Unknown",
          displayName:
            account.displayName || account.username || account.id || "Unknown",
          profileUrl: account.profileUrl,
          followers: account.followers,
          verified: account.isVerified || account.verified,
        })
      );
  };

  const validatePost = async () => {
    const newErrors: string[] = [];

    if (selectedPlatforms.length === 0) {
      newErrors.push("Please select at least one platform");
    }

    if (!caption.trim()) {
      newErrors.push("Post caption is required");
    }

    if (!mediaUrl.trim()) {
      newErrors.push("Media URL is required");
    } else if (!isValidUrl(mediaUrl)) {
      newErrors.push("Please enter a valid media URL");
    }

    // Platform-specific validation
    selectedPlatforms.forEach((platform) => {
      const platformConfig =
        platformConfigs[platform as keyof typeof platformConfigs];
      if (platformConfig && caption.length > platformConfig.maxLength) {
        newErrors.push(
          `${platformConfig.name} caption exceeds ${platformConfig.maxLength} characters`
        );
      }
    });

    setErrors(newErrors);

    if (newErrors.length > 0) {
      return;
    }

    setIsValidating(true);

    try {
      const profileKey = user?.publicMetadata?.["Profile-Key"] as string;
      if (!profileKey) {
        throw new Error("Profile key not found");
      }

      const postData = {
        post: caption + (hashtags ? ` ${hashtags}` : ""),
        platforms: selectedPlatforms,
        mediaUrls: [mediaUrl],
        isVideo: true,
      };

      const response = await fetch("/api/ayrshare/validate-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Profile-Key": profileKey,
        },
        body: JSON.stringify(postData),
      });

      const result = await response.json();

      if (result.status === "success") {
        setValidationResult({
          status: "success",
          message: result.message,
          warnings: result.warnings,
        });
        addToast(
          "✅ Validation successful! Post is ready to publish.",
          "success"
        );
        setCurrentStep(2);
      } else {
        setValidationResult({
          status: "error",
          message: result.message || "Validation failed",
        });
        addToast("❌ Validation failed. Please check your content.", "error");
      }
    } catch (error) {
      setValidationResult({
        status: "error",
        message: error instanceof Error ? error.message : "Validation failed",
      });
      addToast("❌ Validation error occurred. Please try again.", "error");
    } finally {
      setIsValidating(false);
    }
  };

  const handlePost = async () => {
    if (!validationResult || validationResult.status !== "success") {
      return;
    }

    setIsPosting(true);
    setErrors([]);

    try {
      const profileKey = user?.publicMetadata?.["Profile-Key"] as string;
      if (!profileKey) {
        throw new Error("Profile key not found");
      }

      const postData = {
        post: caption + (hashtags ? ` ${hashtags}` : ""),
        platforms: selectedPlatforms,
        mediaUrls: [mediaUrl],
        isVideo: true,
      };

      const response = await fetch("/api/ayrshare/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Profile-Key": profileKey,
        },
        body: JSON.stringify(postData),
      });

      const result = await response.json();
      setPostResult(result);

      if (result.status === "success") {
        addToast("🎉 Video posted successfully to all platforms!", "success");
        setCurrentStep(3);
        // Reset form on successful post
        setTimeout(() => {
          setCaption("");
          setHashtags("");
          setSelectedPlatforms([]);
          setValidationResult(null);
          onClose();
        }, 3000);
      } else {
        // Handle complex error response with posts array
        if (result.posts && Array.isArray(result.posts)) {
          const allErrors: string[] = [];
          result.posts.forEach(
            (post: {
              errors?: Array<{
                platform: string;
                message: string;
                code?: number;
                err?: { message: string };
              }>;
            }) => {
              if (post.errors && Array.isArray(post.errors)) {
                post.errors.forEach(
                  (error: {
                    platform: string;
                    message: string;
                    code?: number;
                    err?: { message: string };
                  }) => {
                    // Extract the most specific error message
                    const errorMessage = error.err?.message || error.message;
                    allErrors.push(`${error.platform}: ${errorMessage}`);
                  }
                );
              }
            }
          );
          setErrors(allErrors);
          addToast(
            `❌ Post failed: ${allErrors.length} error(s) occurred`,
            "error"
          );
        } else {
          setErrors(
            result.errors?.map(
              (error: { message: string }) => error.message
            ) || ["Failed to post video"]
          );
          addToast("❌ Failed to post video", "error");
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Posting failed";
      setErrors([errorMessage]);
      addToast(`❌ ${errorMessage}`, "error");
    } finally {
      setIsPosting(false);
    }
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const getSafeVideoName = (videoName: string): string => {
    if (!videoName) return "Untitled";
    const parts = videoName.split("#");
    return parts[0] || "Untitled";
  };

  const getCharacterCount = () => {
    const fullText = caption + (hashtags ? ` ${hashtags}` : "");
    return fullText.length;
  };

  const getMaxLength = () => {
    if (selectedPlatforms.length === 0) return 280;
    return Math.min(
      ...selectedPlatforms.map((platformKey) => {
        const platform =
          platformConfigs[platformKey as keyof typeof platformConfigs];
        return platform?.maxLength || 1000;
      })
    );
  };

  if (!isOpen) return null;

  const connectedPlatforms = getConnectedAccounts();
  const characterCount = getCharacterCount();
  const maxLength = getMaxLength();
  const isOverLimit = characterCount > maxLength;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Share2 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Share Your Video</h2>
                <p className="text-indigo-100 text-lg">
                  Post to multiple social platforms
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-3 transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="mt-6 flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 ${
                currentStep >= 1 ? "text-white" : "text-white/50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep >= 1 ? "bg-white text-indigo-600" : "bg-white/20"
                }`}
              >
                1
              </div>
              <span className="text-sm font-medium">Setup</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${
                currentStep >= 2 ? "text-white" : "text-white/50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep >= 2 ? "bg-white text-indigo-600" : "bg-white/20"
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium">Review</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${
                currentStep >= 3 ? "text-white" : "text-white/50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep >= 3 ? "bg-white text-indigo-600" : "bg-white/20"
                }`}
              >
                3
              </div>
              <span className="text-sm font-medium">Published</span>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
          {/* Content */}
          <div className="p-8 space-y-8">
            {/* Video Preview */}
            <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-6">
                  <div className="relative w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
                    <Play className="h-10 w-10 text-white" />
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      <Video className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {getSafeVideoName(video.name)}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(video.timeCreated).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{video.contentType}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center space-x-4">
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {video.size}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Ready to Share
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 1: Setup */}
            {currentStep === 1 && (
              <div className="space-y-8">
                {/* Media URL */}
                <div className="space-y-3">
                  <Label
                    htmlFor="mediaUrl"
                    className="text-base font-semibold text-gray-800 flex items-center space-x-2"
                  >
                    <Share2 className="h-5 w-5 text-indigo-600" />
                    <span>Media URL</span>
                  </Label>
                  <Input
                    id="mediaUrl"
                    type="url"
                    placeholder="Enter the public URL for your video..."
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-lg py-3"
                  />
                  <p className="text-sm text-gray-500 flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>
                      This should be a publicly accessible URL for your video
                    </span>
                  </p>
                </div>

                {/* Caption */}
                <div className="space-y-3">
                  <Label
                    htmlFor="caption"
                    className="text-base font-semibold text-gray-800 flex items-center space-x-2"
                  >
                    <Users className="h-5 w-5 text-indigo-600" />
                    <span>Post Text</span>
                  </Label>
                  <Textarea
                    id="caption"
                    placeholder="Write your post caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className={`min-h-[140px] border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-lg ${
                      isOverLimit
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                  />
                </div>

                {/* Hashtags */}
                <div className="space-y-3">
                  <Label
                    htmlFor="hashtags"
                    className="text-base font-semibold text-gray-800 flex items-center space-x-2"
                  >
                    <Hash className="h-5 w-5 text-indigo-600" />
                    <span>Hashtags</span>
                  </Label>
                  <Input
                    id="hashtags"
                    placeholder="#hashtag1 #hashtag2 #hashtag3"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-lg py-3"
                  />
                  <p className="text-sm text-gray-500 flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>
                      Add relevant hashtags to increase discoverability
                    </span>
                  </p>
                </div>

                {/* Character Count */}
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">
                    Character count
                  </span>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-lg font-bold ${
                          isOverLimit
                            ? "text-red-600"
                            : characterCount > maxLength * 0.8
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {characterCount}
                      </span>
                      <span className="text-gray-400">/</span>
                      <span className="text-lg font-medium text-gray-600">
                        {maxLength}
                      </span>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isOverLimit
                          ? "bg-red-500"
                          : characterCount > maxLength * 0.8
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                    ></div>
                  </div>
                </div>

                {/* Platform Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-800 flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-indigo-600" />
                    <span>
                      Select Platforms ({connectedPlatforms.length} connected)
                    </span>
                  </Label>

                  {connectedPlatforms.length === 0 ? (
                    <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
                      <CardContent className="text-center py-12">
                        <div className="text-yellow-600 mb-6">
                          <Share2 className="h-16 w-16 mx-auto" />
                        </div>
                        <h4 className="font-bold text-yellow-800 mb-3 text-xl">
                          No Connected Platforms
                        </h4>
                        <p className="text-yellow-700 mb-6 text-lg">
                          Please connect your social media accounts first.
                        </p>
                        <Button
                          onClick={onClose}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 text-lg rounded-xl"
                        >
                          Go to Dashboard
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {connectedPlatforms.map((platformKey) => {
                        const platform =
                          platformConfigs[
                            platformKey as keyof typeof platformConfigs
                          ];

                        if (!platform) return null;

                        const isSelected =
                          selectedPlatforms.includes(platformKey);
                        const IconComponent = platform.icon;

                        return (
                          <Card
                            key={platformKey}
                            className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                              isSelected
                                ? `ring-2 ring-offset-2 ${platform.borderColor} ${platform.bgColor} shadow-xl transform scale-105`
                                : "hover:shadow-lg border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedPlatforms((prev) =>
                                  prev.filter((p) => p !== platformKey)
                                );
                              } else {
                                setSelectedPlatforms((prev) => [
                                  ...prev,
                                  platformKey,
                                ]);
                              }
                            }}
                          >
                            <CardContent className="p-6 text-center">
                              <div
                                className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                  isSelected
                                    ? `bg-gradient-to-br ${platform.gradient} shadow-lg`
                                    : "bg-gray-100 hover:bg-gray-200"
                                }`}
                              >
                                <IconComponent
                                  className={`w-8 h-8 ${
                                    isSelected ? "text-white" : "text-gray-600"
                                  }`}
                                />
                              </div>
                              <div
                                className={`text-lg font-bold ${
                                  isSelected ? platform.color : "text-gray-700"
                                }`}
                              >
                                {platform.name}
                              </div>
                              <div className="text-sm text-gray-500 mt-2">
                                Max: {platform.maxLength.toLocaleString()}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Review */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Ready to Post!
                  </h3>
                  <p className="text-gray-600">
                    Review your content before publishing
                  </p>
                </div>

                <Card className="border-2 border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <h4 className="font-bold text-green-800 mb-4">
                      Post Preview
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Caption:
                        </span>
                        <p className="text-gray-900 mt-1">{caption}</p>
                      </div>
                      {hashtags && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">
                            Hashtags:
                          </span>
                          <p className="text-gray-900 mt-1">{hashtags}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Platforms:
                        </span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedPlatforms.map((platform) => {
                            const config =
                              platformConfigs[
                                platform as keyof typeof platformConfigs
                              ];
                            return (
                              <Badge
                                key={platform}
                                className="bg-white text-gray-700 border-gray-300"
                              >
                                {config?.name || platform}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Success */}
            {currentStep === 3 && (
              <div className="text-center space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    🎉 Published Successfully!
                  </h3>
                  <p className="text-xl text-gray-600">
                    Your video has been shared across all selected platforms
                  </p>
                </div>

                {postResult?.postIds && (
                  <Card className="border-2 border-green-200 bg-green-50">
                    <CardContent className="p-6">
                      <h4 className="font-bold text-green-800 mb-4 text-lg">
                        Published to:
                      </h4>
                      <div className="space-y-3">
                        {postResult.postIds.map(
                          (
                            postId: {
                              platform: string;
                              postUrl?: string;
                              id: string;
                            },
                            index: number
                          ) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200"
                            >
                              <span className="font-semibold text-gray-900">
                                {postId.platform}
                              </span>
                              {postId.postUrl ? (
                                <a
                                  href={postId.postUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-800 underline font-medium"
                                >
                                  View Post →
                                </a>
                              ) : (
                                <span className="text-sm text-gray-600">
                                  ID: {postId.id}
                                </span>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <Alert variant="destructive" className="border-red-300 bg-red-50">
                <XCircle className="h-5 w-5" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-2">
                    {errors.map((error, index) => (
                      <li key={index} className="font-medium">
                        {error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Validation Result */}
            {validationResult && validationResult.status === "error" && (
              <Alert variant="destructive" className="border-red-300 bg-red-50">
                <XCircle className="h-5 w-5" />
                <AlertDescription>
                  <div className="font-bold mb-2">
                    {validationResult.message}
                  </div>
                  {validationResult.warnings &&
                    validationResult.warnings.length > 0 && (
                      <div>
                        <div className="font-bold text-sm mb-2">Warnings:</div>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {validationResult.warnings.map(
                            (
                              warning: {
                                code: number;
                                message: string;
                                platform?: string;
                              },
                              index: number
                            ) => (
                              <li key={index}>
                                <strong>{warning.platform}:</strong>{" "}
                                {warning.message}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-8 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-4 h-4 rounded-full ${
                    selectedPlatforms.length > 0
                      ? "bg-green-500"
                      : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-lg text-gray-700 font-medium">
                  {selectedPlatforms.length} platform
                  {selectedPlatforms.length !== 1 ? "s" : ""} selected
                </span>
              </div>
              {isOverLimit && (
                <Badge
                  variant="destructive"
                  className="bg-red-100 text-red-800 border-red-300 text-lg px-4 py-2"
                >
                  Over character limit
                </Badge>
              )}
              {validationResult?.status === "success" && (
                <Badge className="bg-green-100 text-green-800 border-green-300 text-lg px-4 py-2">
                  ✓ Ready to post
                </Badge>
              )}
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 px-8 py-3 text-lg rounded-xl"
              >
                Cancel
              </Button>

              {currentStep === 1 && (
                <Button
                  onClick={validatePost}
                  disabled={
                    isValidating ||
                    selectedPlatforms.length === 0 ||
                    !caption.trim() ||
                    !mediaUrl.trim() ||
                    isOverLimit
                  }
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 text-lg rounded-xl shadow-lg"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-3" />
                      Validate & Continue
                    </>
                  )}
                </Button>
              )}

              {currentStep === 2 && (
                <Button
                  onClick={handlePost}
                  disabled={isPosting}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 text-lg rounded-xl shadow-lg"
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-3" />
                      Post Video
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
