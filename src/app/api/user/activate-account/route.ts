import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Update user metadata to set account-active to true
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: {
        "account-active": true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account activated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error activating account:", error);
    return NextResponse.json(
      {
        error: "Failed to activate account",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
