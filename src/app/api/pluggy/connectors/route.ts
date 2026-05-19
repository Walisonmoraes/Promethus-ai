import { NextRequest, NextResponse } from 'next/server'
import { pluggyClient } from '@/lib/pluggy'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching connectors...')
    console.log('Pluggy client exists:', !!pluggyClient)
    
    if (!pluggyClient) {
      console.error('Pluggy client not configured')
      return NextResponse.json({ error: 'Pluggy client not configured' }, { status: 500 })
    }

    console.log('Calling listConnectors...')
    const connectors = await pluggyClient.listConnectors()
    console.log('Connectors fetched:', connectors.length)
    
    // Filtrar apenas conectores brasileiros principais
    const brazilianConnectors = connectors.filter(
      (connector: any) => connector.country === 'BR' || connector.sandbox
    )
    console.log('Brazilian connectors:', brazilianConnectors.length)

    return NextResponse.json({ connectors: brazilianConnectors })
  } catch (error) {
    console.error('Error fetching connectors:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Failed to fetch connectors', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
