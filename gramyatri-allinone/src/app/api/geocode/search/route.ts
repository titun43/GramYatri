import { NextRequest, NextResponse } from 'next/server'

// Fallback local places when Nominatim is unavailable
const FALLBACK_PLACES = [
  { id: 'fp1', name: 'Lanka Bazar', displayName: 'Lanka Bazar, Lanka, Hojai, Assam', fullAddress: 'Lanka Bazar, Lanka, Hojai, Assam, India', lat: 25.933, lng: 92.943, type: 'market', category: 'commerce', importance: 0.5 },
  { id: 'fp2', name: 'Lanka Railway Station', displayName: 'Lanka Railway Station, Lanka, Hojai, Assam', fullAddress: 'Lanka Railway Station, Lanka, Hojai, Assam, India', lat: 25.928, lng: 92.940, type: 'railway', category: 'transport', importance: 0.5 },
  { id: 'fp3', name: 'Lanka Town', displayName: 'Lanka Town, Hojai, Assam', fullAddress: 'Lanka, Hojai, Assam, India', lat: 25.935, lng: 92.945, type: 'town', category: 'place', importance: 0.6 },
  { id: 'fp4', name: 'Azarbari', displayName: 'Azarbari, Lanka, Hojai, Assam', fullAddress: 'Azarbari, Lanka, Hojai, Assam, India', lat: 25.940, lng: 92.935, type: 'village', category: 'place', importance: 0.3 },
  { id: 'fp5', name: 'Jaysagar', displayName: 'Jaysagar, Lanka, Hojai, Assam', fullAddress: 'Jaysagar, Lanka, Hojai, Assam, India', lat: 25.920, lng: 92.950, type: 'village', category: 'place', importance: 0.3 },
  { id: 'fp6', name: 'Lanka Public School', displayName: 'Lanka Public School, Lanka, Hojai, Assam', fullAddress: 'Lanka Public School, Lanka, Hojai, Assam, India', lat: 25.934, lng: 92.947, type: 'school', category: 'education', importance: 0.4 },
  { id: 'fp7', name: 'Hojai Bus Stand', displayName: 'Hojai Bus Stand, Hojai, Assam', fullAddress: 'Hojai Bus Stand, Hojai, Assam, India', lat: 25.980, lng: 92.870, type: 'bus_station', category: 'transport', importance: 0.5 },
  { id: 'fp8', name: 'Hojai Railway Station', displayName: 'Hojai Railway Station, Hojai, Assam', fullAddress: 'Hojai Railway Station, Hojai, Assam, India', lat: 25.978, lng: 92.865, type: 'railway', category: 'transport', importance: 0.5 },
  { id: 'fp9', name: 'Nagaon Town', displayName: 'Nagaon Town, Nagaon, Assam', fullAddress: 'Nagaon, Nagaon, Assam, India', lat: 26.355, lng: 92.685, type: 'town', category: 'place', importance: 0.7 },
  { id: 'fp10', name: 'Diphu Railway Station', displayName: 'Diphu Railway Station, Diphu, Karbi Anglong, Assam', fullAddress: 'Diphu Railway Station, Diphu, Karbi Anglong, Assam, India', lat: 25.870, lng: 93.430, type: 'railway', category: 'transport', importance: 0.5 },
  { id: 'fp11', name: 'Guwahati Paltan Bazar', displayName: 'Paltan Bazar, Guwahati, Kamrup, Assam', fullAddress: 'Paltan Bazar, Guwahati, Kamrup, Assam, India', lat: 26.104, lng: 91.747, type: 'commercial', category: 'commerce', importance: 0.6 },
  { id: 'fp12', name: 'Guwahati Airport', displayName: 'Lokpriya Gopinath Bordoloi Airport, Guwahati, Assam', fullAddress: 'Lokpriya Gopinath Bordoloi International Airport, Borjhar, Guwahati, Assam, India', lat: 26.106, lng: 91.586, type: 'airport', category: 'transport', importance: 0.8 },
  { id: 'fp13', name: 'Nagaon Medical College', displayName: 'Nagaon Medical College, Nagaon, Assam', fullAddress: 'Nagaon Medical College and Hospital, Nagaon, Assam, India', lat: 26.345, lng: 92.695, type: 'hospital', category: 'health', importance: 0.5 },
  { id: 'fp14', name: 'Kaziranga National Park', displayName: 'Kaziranga National Park, Golaghat, Assam', fullAddress: 'Kaziranga National Park, Golaghat, Assam, India', lat: 26.577, lng: 93.172, type: 'national_park', category: 'tourism', importance: 0.9 },
  { id: 'fp15', name: 'Hojai Court', displayName: 'Hojai Court, Hojai, Assam', fullAddress: 'Hojai Civil Court, Hojai, Assam, India', lat: 25.985, lng: 92.875, type: 'courthouse', category: 'government', importance: 0.3 },
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const limit = searchParams.get('limit') || '8'

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, results: [] })
    }

    // Build Nominatim search URL with viewbox for local prioritization
    const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search')
    nominatimUrl.searchParams.set('q', query + ', Assam, India')
    nominatimUrl.searchParams.set('format', 'json')
    nominatimUrl.searchParams.set('limit', limit)
    nominatimUrl.searchParams.set('countrycodes', 'in')
    nominatimUrl.searchParams.set('addressdetails', '1')
    nominatimUrl.searchParams.set('accept-language', 'en')

    // If user's location is known, add viewbox to prioritize nearby results
    if (lat && lng) {
      const latNum = parseFloat(lat)
      const lngNum = parseFloat(lng)
      const radius = 0.5 // ~50km radius for viewbox
      nominatimUrl.searchParams.set('viewbox', `${lngNum - radius},${latNum - radius},${lngNum + radius},${latNum + radius}`)
      nominatimUrl.searchParams.set('bounded', '0')
    }

    let data: Record<string, unknown>[] = []

    try {
      const response = await fetch(nominatimUrl.toString(), {
        headers: {
          'User-Agent': 'GramYatri/1.0 (ride-hailing app for rural Assam)',
          'Accept-Language': 'en',
        },
        signal: AbortSignal.timeout(8000), // 8 second timeout
      })

      if (response.ok) {
        data = await response.json()
      }
    } catch (fetchError) {
      // Nominatim unavailable - use fallback local places
      console.log('Nominatim unavailable, using fallback places:', fetchError)
    }

    // If Nominatim returned results, transform them
    let results: Array<{
      id: string | number
      name: string
      displayName: string
      fullAddress: string
      lat: number
      lng: number
      type: string
      category: string
      importance: number
    }> = []

    if (data.length > 0) {
      results = data.map((item: Record<string, unknown>) => {
        const address = item.address as Record<string, string> | undefined

        // Build a clean display name
        let displayName = ''
        if (address) {
          const name = address.shop || address.office || address.building || address.amenity ||
            address.tourism || address.historic || address.school || address.university ||
            address.hospital || address.bus_station || address.railway ||
            address.market || address.mall || address.place_of_worship ||
            address.village || address.town || address.suburb || address.neighbourhood ||
            String(item.name || '')

          const city = address.city || address.town || address.village || ''
          const district = address.county || address.state_district || ''
          const state = address.state || ''

          displayName = name
          if (city && city !== name) displayName += ', ' + city
          if (district && !displayName.includes(district)) displayName += ', ' + district
          if (state === 'Assam' && !displayName.includes('Assam')) displayName += ', Assam'
        }

        if (!displayName) {
          displayName = String(item.display_name || '').split(',').slice(0, 3).join(',')
        }

        return {
          id: item.place_id || Math.random().toString(36).slice(2),
          name: String(item.name || ''),
          displayName: displayName.trim(),
          fullAddress: String(item.display_name || ''),
          lat: parseFloat(String(item.lat || '0')),
          lng: parseFloat(String(item.lon || '0')),
          type: String(item.type || ''),
          category: String(item.category || ''),
          importance: parseFloat(String(item.importance || '0')),
        }
      })
    }

    // Always include matching fallback places (these are prioritized local results)
    const queryLower = query.toLowerCase()
    const matchingFallbacks = FALLBACK_PLACES.filter(p =>
      p.name.toLowerCase().includes(queryLower) ||
      p.displayName.toLowerCase().includes(queryLower)
    )

    // Merge: fallback first (local prioritized), then Nominatim results
    const fallbackIds = new Set(matchingFallbacks.map(p => p.name.toLowerCase()))
    const nomResultsFiltered = results.filter(r => !fallbackIds.has(r.name.toLowerCase()))
    results = [...matchingFallbacks, ...nomResultsFiltered]

    // Limit total results
    results = results.slice(0, parseInt(limit))

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Geocode search error:', error)
    // Return fallback places on any error
    const query = new URL(req.url).searchParams.get('q') || ''
    const queryLower = query.toLowerCase()
    const fallbackResults = FALLBACK_PLACES.filter(p =>
      p.name.toLowerCase().includes(queryLower) ||
      p.displayName.toLowerCase().includes(queryLower)
    ).slice(0, 8)
    return NextResponse.json({ success: true, results: fallbackResults })
  }
}
