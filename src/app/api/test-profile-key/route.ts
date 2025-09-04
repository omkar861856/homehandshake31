import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get user authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get profile key from user metadata
    const user = await (await clerkClient()).users.getUser(userId);
    const profileKey = user.publicMetadata?.["Profile-Key"] as string;

    if (!profileKey) {
      return NextResponse.json(
        { error: "Profile key not found in user metadata" },
        { status: 400 }
      );
    }

    // Test the webhook with the actual profile key
    const webhookUrl =
      "https://n8n.srv834400.hstgr.cloud/webhook/bcd49dcb-3103-4152-aefc-32c7d8c552fe";

    console.log(
      "Testing webhook with profile key:",
      profileKey.substring(0, 10) + "..."
    );

    const response = await fetch(webhookUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "profile-key": profileKey,
      },
    });

    const data = await response.json();

    return NextResponse.json({
      profileKey: profileKey.substring(0, 10) + "...",
      webhookStatus: response.status,
      webhookResponse: data,
      success: response.ok,
    });
  } catch (error) {
    console.error("Error testing profile key:", error);
    return NextResponse.json(
      { error: "Failed to test profile key" },
      { status: 500 }
    );
  }
}
