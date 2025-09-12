import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({
        success: false,
        error: "Token is required"
      }, { status: 400 });
    }

    // Decode the token without verification first
    const decoded = jwt.decode(token);
    
    return NextResponse.json({
      success: true,
      decoded_token: decoded,
      token_info: {
        has_id: !!decoded?.id,
        has_email: !!decoded?.email,
        has_type: !!decoded?.type,
        type_value: decoded?.type,
        id_value: decoded?.id
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to decode token",
      details: error.message
    }, { status: 500 });
  }
}
