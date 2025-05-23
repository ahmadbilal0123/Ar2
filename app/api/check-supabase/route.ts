import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Test the Supabase connection
    const { data, error } = await supabase.from("users").select("count").limit(1)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection successful",
      data,
    })
  } catch (error) {
    console.error("Error checking Supabase connection:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect to Supabase",
      },
      { status: 500 },
    )
  }
}
