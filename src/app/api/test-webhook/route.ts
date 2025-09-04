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

    const webhookUrl =
      "https://n8n.srv834400.hstgr.cloud/webhook/bcd49dcb-3103-4152-aefc-32c7d8c552fe";

    console.log(
      "Testing webhook with profile key:",
      profileKey.substring(0, 10) + "..."
    );

    // Test different authentication methods
    const testResults = [];

    // Test 1: With profile-key header
    try {
      const response1 = await fetch(webhookUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "profile-key": profileKey,
        },
      });
      testResults.push({
        method: "profile-key header",
        status: response1.status,
        statusText: response1.statusText,
        data: await response1.text(),
      });
    } catch (error) {
      testResults.push({
        method: "profile-key header",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 2: With Authorization header
    try {
      const response2 = await fetch(webhookUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${profileKey}`,
        },
      });
      testResults.push({
        method: "Authorization Bearer",
        status: response2.status,
        statusText: response2.statusText,
        data: await response2.text(),
      });
    } catch (error) {
      testResults.push({
        method: "Authorization Bearer",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 3: With X-API-Key header
    try {
      const response3 = await fetch(webhookUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": profileKey,
        },
      });
      testResults.push({
        method: "X-API-Key header",
        status: response3.status,
        statusText: response3.statusText,
        data: await response3.text(),
      });
    } catch (error) {
      testResults.push({
        method: "X-API-Key header",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 4: With query parameter
    try {
      const response4 = await fetch(
        `${webhookUrl}?key=${encodeURIComponent(profileKey)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      testResults.push({
        method: "query parameter",
        status: response4.status,
        statusText: response4.statusText,
        data: await response4.text(),
      });
    } catch (error) {
      testResults.push({
        method: "query parameter",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return NextResponse.json({
      webhookUrl,
      profileKeyLength: profileKey.length,
      profileKeyPrefix: profileKey.substring(0, 10) + "...",
      testResults,
    });
  } catch (error) {
    console.error("Error in test webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to test webhook",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
