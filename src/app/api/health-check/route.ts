import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Supabase environment variables are missing',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Execute simple query to profiles table
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.error('Health check query failed:', error)
      return NextResponse.json(
        {
          status: 'error',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    console.log("Health check query executed successfully")
    return NextResponse.json({
      status: 'ok',
      message: 'Health check query executed successfully',
      profileCount: count ?? 0,
      timestamp: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Health check unexpected error:', err)
    return NextResponse.json(
      {
        status: 'error',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
