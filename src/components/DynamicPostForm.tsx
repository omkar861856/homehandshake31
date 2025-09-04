"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@clerk/nextjs";
import { AlertCircle, CheckCircle, Loader2, Send, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface ConnectedAccount {
  platform: string;
  name: string;
  id: string;
  status: "active" | "inactive";
}

interface PlatformRequirements {
  [key: string]: {
    requiredFields: string[];
    optionalFields: string[];
    characterLimit: number;
    mediaTypes: string[];
    maxMediaCount: number;
  };
}

interface ValidationResult {
  status: "success" | "error";
  message: string;
  warnings?: Array<{
    platform: string;
    code: number;
    message: string;
  }>;
}

const platformRequirements: PlatformRequirements = {
  instagram: {
    requiredFields: ["post"],
    optionalFields: ["mediaUrls", "instagramOptions"],
    characterLimit: 2200,
    mediaTypes: ["image", "video"],
    maxMediaCount: 10,
  },
  linkedin: {
    requiredFields: ["post"],
    optionalFields: ["mediaUrls", "linkedInOptions"],
    characterLimit: 3000,
    mediaTypes: ["image", "video", "document"],
    maxMediaCount: 9,
  },
  twitter: {
    requiredFields: ["post"],
    optionalFields: ["mediaUrls", "twitterOptions"],
    characterLimit: 280,
    mediaTypes: ["image", "video"],
    maxMediaCount: 4,
  },
  facebook: {
    requiredFields: ["post"],
    optionalFields: ["mediaUrls", "faceBookOptions"],
    characterLimit: 63206,
    mediaTypes: ["image", "video"],
    maxMediaCount: 10,
  },
  youtube: {
    requiredFields: ["post", "youTubeOptions.title"],
    optionalFields: ["youTubeOptions.visibility", "youTubeOptions.tags"],
    characterLimit: 5000,
    mediaTypes: ["video"],
    maxMediaCount: 1,
  },
  threads: {
    requiredFields: ["post"],
    optionalFields: ["mediaUrls", "threadsOptions"],
    characterLimit: 500,
    mediaTypes: ["image", "video"],
    maxMediaCount: 20,
  },
  tiktok: {
    requiredFields: ["post"],
    optionalFields: ["mediaUrls", "tikTokOptions"],
    characterLimit: 2200,
    mediaTypes: ["video"],
    maxMediaCount: 1,
  },
  pinterest: {
    requiredFields: ["post"],
    optionalFields: ["mediaUrls", "pinterestOptions"],
    characterLimit: 500,
    mediaTypes: ["image"],
    maxMediaCount: 1,
  },
  reddit: {
    requiredFields: ["post", "redditOptions.title", "redditOptions.subreddit"],
    optionalFields: ["mediaUrls", "redditOptions.link"],
    characterLimit: 40000,
    mediaTypes: ["image"],
    maxMediaCount: 1,
  },
  snapchat: {
    requiredFields: ["post"],
    optionalFields: ["mediaUrls", "snapChatOptions"],
    characterLimit: 250,
    mediaTypes: ["image", "video"],
    maxMediaCount: 1,
  },
  telegram: {
    requiredFields: ["post"],
    optionalFields: ["mediaUrls", "telegramOptions"],
    characterLimit: 4096,
    mediaTypes: ["image", "video", "document"],
    maxMediaCount: 10,
  },
  bluesky: {
    requiredFields: ["post"],
    optionalFields: ["mediaUrls", "blueskyOptions"],
    characterLimit: 300,
    mediaTypes: ["image"],
    maxMediaCount: 4,
  },
  gmb: {
    requiredFields: ["post"],
    optionalFields: ["mediaUrls", "gmbOptions"],
    characterLimit: 1500,
    mediaTypes: ["image", "video"],
    maxMediaCount: 10,
  },
};

export default function DynamicPostForm() {
  const { user } = useUser();
  const [connectedAccounts, setConnectedAccounts] = useState<
    ConnectedAccount[]
  >([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [postText, setPostText] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [postResult, setPostResult] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Platform-specific options
  const [platformOptions, setPlatformOptions] = useState<{
    [key: string]: any;
  }>({});

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const fetchConnectedAccounts = async () => {
    try {
      const profileKey = user?.publicMetadata?.["Profile-Key"] as string;
      if (!profileKey) return;

      const response = await fetch(
        `/api/ayrshare/user?profileKey=${profileKey}&instagramDetails=true`
      );
      const data = await response.json();

      if (data.activeSocialAccounts) {
        const accounts: ConnectedAccount[] = data.activeSocialAccounts.map(
          (account: any) => ({
            platform: account.platform,
            name: account.name || account.platform,
            id: account.id || account.platform,
            status: "active",
          })
        );
        setConnectedAccounts(accounts);
      }
    } catch (error) {
      console.error("Error fetching connected accounts:", error);
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleMediaUrlChange = (index: number, value: string) => {
    const newUrls = [...mediaUrls];
    newUrls[index] = value;
    setMediaUrls(newUrls.filter((url) => url.trim() !== ""));
  };

  const addMediaUrl = () => {
    setMediaUrls([...mediaUrls, ""]);
  };

  const removeMediaUrl = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const validatePost = async () => {
    if (selectedPlatforms.length === 0) {
      setErrors(["Please select at least one platform"]);
      return;
    }

    if (!postText.trim()) {
      setErrors(["Post text is required"]);
      return;
    }

    setIsValidating(true);
    setErrors([]);

    try {
      const profileKey = user?.publicMetadata?.["Profile-Key"] as string;
      if (!profileKey) {
        throw new Error("Profile key not found");
      }

      const postData = buildPostData();

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
      } else {
        setValidationResult({
          status: "error",
          message: result.message || "Validation failed",
        });
      }
    } catch (error) {
      setValidationResult({
        status: "error",
        message: error instanceof Error ? error.message : "Validation failed",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const buildPostData = () => {
    const postData: any = {
      post: postText,
      platforms: selectedPlatforms,
    };

    if (mediaUrls.length > 0) {
      postData.mediaUrls = mediaUrls.filter((url) => url.trim() !== "");
    }

    // Add platform-specific options
    selectedPlatforms.forEach((platform) => {
      const options = platformOptions[platform];
      if (options && Object.keys(options).length > 0) {
        const optionKey = `${platform}Options`;
        postData[optionKey] = options;
      }
    });

    return postData;
  };

  const publishPost = async () => {
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

      const postData = buildPostData();

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
        // Reset form on successful post
        setPostText("");
        setMediaUrls([]);
        setSelectedPlatforms([]);
        setPlatformOptions({});
        setValidationResult(null);
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Posting failed"]);
    } finally {
      setIsPosting(false);
    }
  };

  const getCharacterCount = () => {
    return postText.length;
  };

  const getMaxCharacterLimit = () => {
    if (selectedPlatforms.length === 0) return 0;
    return Math.min(
      ...selectedPlatforms.map(
        (platform) => platformRequirements[platform]?.characterLimit || 999999
      )
    );
  };

  const isCharacterLimitExceeded = () => {
    const maxLimit = getMaxCharacterLimit();
    return maxLimit > 0 && getCharacterCount() > maxLimit;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Dynamic Post Form
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connected Accounts */}
          <div>
            <Label className="text-base font-medium">Connected Accounts</Label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {connectedAccounts.map((account) => (
                <Card
                  key={account.platform}
                  className={`cursor-pointer transition-all ${
                    selectedPlatforms.includes(account.platform)
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handlePlatformToggle(account.platform)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-sm font-medium capitalize">
                      {account.platform}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {account.name}
                    </div>
                    <Badge
                      variant={
                        account.status === "active" ? "default" : "secondary"
                      }
                      className="mt-2 text-xs"
                    >
                      {account.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            {connectedAccounts.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No social media accounts connected. Please connect your
                  accounts first.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Post Text */}
          <div>
            <Label htmlFor="post-text" className="text-base font-medium">
              Post Content
            </Label>
            <Textarea
              id="post-text"
              placeholder="Write your post content..."
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              className="mt-2 min-h-[120px]"
            />
            <div className="mt-2 flex justify-between text-sm">
              <span
                className={
                  isCharacterLimitExceeded() ? "text-red-500" : "text-gray-500"
                }
              >
                {getCharacterCount()} / {getMaxCharacterLimit()} characters
              </span>
              {selectedPlatforms.length > 0 && (
                <span className="text-gray-500">
                  {selectedPlatforms.length} platform
                  {selectedPlatforms.length > 1 ? "s" : ""} selected
                </span>
              )}
            </div>
          </div>

          {/* Media URLs */}
          <div>
            <Label className="text-base font-medium">
              Media URLs (Optional)
            </Label>
            <div className="mt-2 space-y-2">
              {mediaUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={url}
                    onChange={(e) =>
                      handleMediaUrlChange(index, e.target.value)
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMediaUrl(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addMediaUrl}>
                Add Media URL
              </Button>
            </div>
          </div>

          {/* Platform Requirements Info */}
          {selectedPlatforms.length > 0 && (
            <div>
              <Label className="text-base font-medium">
                Platform Requirements
              </Label>
              <div className="mt-2 space-y-2">
                {selectedPlatforms.map((platform) => {
                  const req = platformRequirements[platform];
                  if (!req) return null;

                  return (
                    <Card key={platform} className="p-3">
                      <div className="text-sm font-medium capitalize">
                        {platform}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Character limit: {req.characterLimit} | Max media:{" "}
                        {req.maxMediaCount} | Types: {req.mediaTypes.join(", ")}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Result */}
          {validationResult && (
            <Alert
              variant={
                validationResult.status === "success"
                  ? "default"
                  : "destructive"
              }
            >
              {validationResult.status === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {validationResult.message}
                {validationResult.warnings &&
                  validationResult.warnings.length > 0 && (
                    <div className="mt-2">
                      <div className="font-medium">Warnings:</div>
                      <ul className="list-disc list-inside text-sm">
                        {validationResult.warnings.map((warning, index) => (
                          <li key={index}>
                            {warning.platform}: {warning.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </AlertDescription>
            </Alert>
          )}

          {/* Post Result */}
          {postResult && (
            <Alert
              variant={
                postResult.status === "success" ? "default" : "destructive"
              }
            >
              {postResult.status === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="font-medium">
                  {postResult.status === "success"
                    ? "Post Published Successfully!"
                    : "Post Failed"}
                </div>
                {postResult.postIds && (
                  <div className="mt-2 text-sm">
                    <div className="font-medium">Published to:</div>
                    <ul className="list-disc list-inside">
                      {postResult.postIds.map((postId: any, index: number) => (
                        <li key={index}>
                          {postId.platform}:{" "}
                          {postId.postUrl ? (
                            <a
                              href={postId.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              View Post
                            </a>
                          ) : (
                            `ID: ${postId.id}`
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={validatePost}
              disabled={
                isValidating ||
                selectedPlatforms.length === 0 ||
                !postText.trim()
              }
              className="flex-1"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                "Validate Post"
              )}
            </Button>

            {validationResult?.status === "success" && (
              <Button
                onClick={publishPost}
                disabled={isPosting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isPosting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publish Post
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


