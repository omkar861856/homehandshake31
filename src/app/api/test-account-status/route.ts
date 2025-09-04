import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    return NextResponse.json({
      userId,
      publicMetadata: user.publicMetadata,
      activeAccount: user.publicMetadata?.["account-active"],
      activeAccountType: typeof user.publicMetadata?.["account-active"],
    });
  } catch (error) {
    console.error("Error checking account status:", error);
    return NextResponse.json(
      {
        error: "Failed to check account status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { activeAccount } = body;

    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: {
        "account-active": activeAccount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Account status set to: ${activeAccount}`,
    });
  } catch (error) {
    console.error("Error setting account status:", error);
    return NextResponse.json(
      {
        error: "Failed to set account status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
