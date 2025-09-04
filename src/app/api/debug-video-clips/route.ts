import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get user authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use the specific webhook URL for video clips
    const webhookUrl =
      "https://n8n.srv834400.hstgr.cloud/webhook/bcd49dcb-3103-4152-aefc-32c7d8c552fe";

    // Get profile key from user metadata
    const user = await (await clerkClient()).users.getUser(userId);
    const profileKey = user.publicMetadata?.["Profile-Key"] as string;

    if (!profileKey) {
      return NextResponse.json(
        { error: "Profile key not found in user metadata" },
        { status: 400 }
      );
    }

    console.log("Debug: Fetching video clips from:", webhookUrl);

    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      // Forward the request to the external webhook
      const response = await fetch(webhookUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "HomeHandshake/1.0",
          "profile-key": profileKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(
          "Webhook responded with error:",
          response.status,
          response.statusText
        );
        return NextResponse.json(
          { error: `Webhook error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      // Get the response data
      const data = await response.json();

      // Debug: Log the raw data structure
      console.log(
        "Debug: Raw webhook response:",
        JSON.stringify(data, null, 2)
      );
      console.log("Debug: Data type:", typeof data);
      console.log("Debug: Is array:", Array.isArray(data));
      console.log(
        "Debug: Data length:",
        Array.isArray(data) ? data.length : "Not an array"
      );

      // Ensure we return an array
      const videoClips = Array.isArray(data) ? data : [];

      console.log(
        `Debug: Successfully fetched ${videoClips.length} video clips`
      );

      // Return detailed debug information
      return NextResponse.json({
        success: true,
        webhookUrl,
        profileKey: profileKey.substring(0, 8) + "...",
        dataType: typeof data,
        isArray: Array.isArray(data),
        clipCount: videoClips.length,
        sampleClip: videoClips.length > 0 ? videoClips[0] : null,
        allClips: videoClips,
      });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error("Request timeout after 30 seconds");
        return NextResponse.json(
          { error: "Request timeout - webhook took too long to respond" },
          { status: 504 }
        );
      }

      throw fetchError;
    }
  } catch (error: unknown) {
    console.error("Error in debug endpoint:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch video clips",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
