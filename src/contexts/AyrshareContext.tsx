"use client";

import { AyrshareService } from "@/lib/ayrshare";
import { useUser } from "@clerk/nextjs";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AyrshareContextType {
  profileKey: string | null;
  isLoading: boolean;
  error: string | null;
  refreshProfileKey: () => void;
  openSSOLogin: (options?: {
    expiresIn?: number;
    domain?: string;
    allowedSocial?: string[];
    redirect?: string;
    logout?: boolean;
    email?: string;
    verify?: boolean;
  }) => Promise<boolean>;
  generateSSOUrl: (options?: {
    expiresIn?: number;
    domain?: string;
    allowedSocial?: string[];
    redirect?: string;
    logout?: boolean;
    email?: string;
    verify?: boolean;
  }) => Promise<string | null>;
}

const AyrshareContext = createContext<AyrshareContextType | undefined>(
  undefined
);

export function AyrshareProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const [profileKey, setProfileKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ayrshareService, setAyrshareService] =
    useState<AyrshareService | null>(null);

  // Memoize the extractProfileKey function to prevent recreation on every render
  const extractProfileKey = useCallback(() => {
    if (!user) return null;

    // Debug: Log all available metadata
    console.log("User object:", user);
    console.log("User publicMetadata:", user.publicMetadata);
    console.log(
      "User publicMetadata keys:",
      Object.keys(user.publicMetadata || {})
    );

    // Get profile key from Clerk metadata - this is what users set in their profile
    // Note: Clerk stores it as "Profile-Key" (with hyphen), not "Profile_Key" (with underscore)
    const metadataProfileKey = user.publicMetadata?.["Profile-Key"] as string;

    if (metadataProfileKey) {
      console.log("Found Profile_Key in Clerk metadata:", metadataProfileKey);
      return metadataProfileKey;
    }

    // No Profile_Key found in metadata
    console.log("No Profile_Key found in Clerk metadata");
    console.log(
      "Available metadata keys:",
      Object.keys(user.publicMetadata || {})
    );
    return null;
  }, [user]);

  const refreshProfileKey = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const newProfileKey = extractProfileKey();
      setProfileKey(newProfileKey);

      if (newProfileKey) {
        console.log("Profile key updated:", newProfileKey);
      } else {
        setError("Unable to extract profile key from user metadata");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error extracting profile key:", errorMessage);
      setError(`Failed to extract profile key: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [extractProfileKey]);

  const openSSOLogin = useCallback(
    async (options?: {
      expiresIn?: number;
      domain?: string;
      allowedSocial?: string[];
      redirect?: string;
      logout?: boolean;
      email?: string;
      verify?: boolean;
    }): Promise<boolean> => {
      if (!profileKey) {
        setError("No profile key available for SSO login");
        return false;
      }

      if (!ayrshareService) {
        setError("Ayrshare service not initialized");
        return false;
      }

      try {
        const success = await ayrshareService.openSSOLogin(options);
        if (!success) {
          setError("Failed to open SSO login window");
        }
        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(`SSO login failed: ${errorMessage}`);
        return false;
      }
    },
    [profileKey, ayrshareService]
  );

  const generateSSOUrl = useCallback(
    async (options?: {
      expiresIn?: number;
      domain?: string;
      allowedSocial?: string[];
      redirect?: string;
      logout?: boolean;
      email?: string;
      verify?: boolean;
    }): Promise<string | null> => {
      if (!profileKey) {
        setError("No profile key available for SSO URL generation");
        return null;
      }

      if (!ayrshareService) {
        setError("Ayrshare service not initialized");
        return null;
      }

      try {
        return await ayrshareService.generateSSOUrl(options);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(`SSO URL generation failed: ${errorMessage}`);
        return null;
      }
    },
    [profileKey, ayrshareService]
  );

  // Initialize Ayrshare service only once when component mounts
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_AYRSHARE_API_KEY;
    if (apiKey) {
      setAyrshareService(new AyrshareService(apiKey));
    } else {
      console.warn("AYRSHARE_API_KEY not found in environment variables");
    }
  }, []); // Empty dependency array - only run once

  // Handle user profile key updates separately
  useEffect(() => {
    console.log("AyrshareContext useEffect triggered:", {
      isLoaded,
      user: !!user,
      userId: user?.id,
    });

    if (isLoaded) {
      refreshProfileKey();
    }
  }, [isLoaded, user, refreshProfileKey]);

  const value: AyrshareContextType = {
    profileKey,
    isLoading,
    error,
    refreshProfileKey,
    openSSOLogin,
    generateSSOUrl,
  };

  return (
    <AyrshareContext.Provider value={value}>
      {children}
    </AyrshareContext.Provider>
  );
}

export function useAyrshare() {
  const context = useContext(AyrshareContext);
  if (context === undefined) {
    throw new Error("useAyrshare must be used within an AyrshareProvider");
  }
  return context;
}
