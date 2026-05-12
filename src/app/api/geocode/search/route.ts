import { NextRequest, NextResponse } from 'next/server'

// Comprehensive local places for Lanka and surrounding areas
const FALLBACK_PLACES = [
  // Lanka Core Area
  { id: 'fp1',  name: 'Lanka Bazar',           displayName: 'Lanka Bazar, Lanka, Hojai',           fullAddress: 'Lanka Bazar, Lanka, Hojai, Assam, India',                   lat: 25.9332, lng: 92.9435, type: 'market',      category: 'commerce',   importance: 0.8 },
  { id: 'fp2',  name: 'Lanka Railway Station', displayName: 'Lanka Railway Station, Lanka, Hojai', fullAddress: 'Lanka Railway Station, Lanka, Hojai, Assam, India',          lat: 25.9280, lng: 92.9400, type: 'railway',     category: 'transport',  importance: 0.8 },
  { id: 'fp3',  name: 'Lanka Town',            displayName: 'Lanka Town, Hojai, Assam',            fullAddress: 'Lanka, Hojai, Assam, India',                                 lat: 25.9335, lng: 92.9450, type: 'town',        category: 'place',      importance: 0.7 },
  { id: 'fp4',  name: 'Azarbari',              displayName: 'Azarbari, Lanka, Hojai',              fullAddress: 'Azarbari, Lanka, Hojai, Assam, India',                       lat: 25.9400, lng: 92.9350, type: 'village',     category: 'place',      importance: 0.6 },
  { id: 'fp5',  name: 'Jaysagar',              displayName: 'Jaysagar, Lanka, Hojai',              fullAddress: 'Jaysagar, Lanka, Hojai, Assam, India',                       lat: 25.9200, lng: 92.9500, type: 'village',     category: 'place',      importance: 0.6 },
  { id: 'fp6',  name: 'Lanka Public School',   displayName: 'Lanka Public School, Lanka, Hojai',   fullAddress: 'Lanka Public School, Lanka, Hojai, Assam, India',            lat: 25.9340, lng: 92.9470, type: 'school',      category: 'education',  importance: 0.7 },
  { id: 'fp7',  name: 'Lanka College',         displayName: 'Lanka College, Lanka, Hojai',         fullAddress: 'Lanka College, Lanka, Hojai, Assam, India',                  lat: 25.9345, lng: 92.9460, type: 'college',     category: 'education',  importance: 0.7 },
  { id: 'fp8',  name: 'Lanka Bus Stand',       displayName: 'Lanka Bus Stand, Lanka, Hojai',       fullAddress: 'Lanka Bus Stand, Lanka, Hojai, Assam, India',                lat: 25.9330, lng: 92.9430, type: 'bus_station', category: 'transport',  importance: 0.8 },
  { id: 'fp9',  name: 'Lanka Police Station',  displayName: 'Lanka Police Station, Lanka, Hojai',  fullAddress: 'Lanka Police Station, Lanka, Hojai, Assam, India',           lat: 25.9338, lng: 92.9440, type: 'police',      category: 'government', importance: 0.6 },
  { id: 'fp10', name: 'Lanka Hospital',        displayName: 'Lanka Hospital, Lanka, Hojai',        fullAddress: 'Lanka Civil Hospital, Lanka, Hojai, Assam, India',           lat: 25.9343, lng: 92.9458, type: 'hospital',    category: 'health',     importance: 0.7 },
  { id: 'fp11', name: 'Lanka Market',          displayName: 'Lanka Main Market, Lanka, Hojai',     fullAddress: 'Lanka Main Market, Lanka, Hojai, Assam, India',              lat: 25.9333, lng: 92.9437, type: 'market',      category: 'commerce',   importance: 0.8 },
  { id: 'fp12', name: 'Lanka Chariali',        displayName: 'Lanka Chariali, Lanka, Hojai',        fullAddress: 'Lanka Chariali, Lanka, Hojai, Assam, India',                 lat: 25.9328, lng: 92.9432, type: 'junction',    category: 'place',      importance: 0.7 },
  { id: 'fp13', name: 'Lanka Tiniali',         displayName: 'Lanka Tiniali, Lanka, Hojai',         fullAddress: 'Lanka Tiniali, Lanka, Hojai, Assam, India',                  lat: 25.9325, lng: 92.9428, type: 'junction',    category: 'place',      importance: 0.6 },
  { id: 'fp14', name: 'Lanka Post Office',     displayName: 'Lanka Post Office, Lanka, Hojai',     fullAddress: 'Lanka Post Office, Lanka, Hojai, Assam, India',              lat: 25.9336, lng: 92.9442, type: 'post_office', category: 'government', importance: 0.5 },
  { id: 'fp15', name: 'Lanka High School',     displayName: 'Lanka High School, Lanka, Hojai',     fullAddress: 'Lanka High School, Lanka, Hojai, Assam, India',              lat: 25.9337, lng: 92.9465, type: 'school',      category: 'education',  importance: 0.6 },
  { id: 'fp16', name: 'Lanka PHC',             displayName: 'Lanka PHC, Lanka, Hojai',             fullAddress: 'Lanka Primary Health Centre, Lanka, Hojai, Assam, India',    lat: 25.9342, lng: 92.9455, type: 'hospital',    category: 'health',     importance: 0.6 },
  { id: 'fp17', name: 'Lanka Block Office',    displayName: 'Lanka Block Office, Lanka, Hojai',    fullAddress: 'Lanka Development Block Office, Lanka, Hojai, Assam, India', lat: 25.9348, lng: 92.9448, type: 'office',      category: 'government', importance: 0.5 },
  { id: 'fp18', name: 'Lanka Court',           displayName: 'Lanka Court, Lanka, Hojai',           fullAddress: 'Lanka Civil Court, Lanka, Hojai, Assam, India',              lat: 25.9350, lng: 92.9445, type: 'courthouse',  category: 'government', importance: 0.6 },
  // Lanka Sub-localities
  { id: 'fp20', name: 'Rajabari',              displayName: 'Rajabari, Lanka, Hojai',              fullAddress: 'Rajabari, Lanka, Hojai, Assam, India',                       lat: 25.9360, lng: 92.9420, type: 'locality',    category: 'place',      importance: 0.5 },
  { id: 'fp21', name: 'Sadhutilla',            displayName: 'Sadhutilla, Lanka, Hojai',            fullAddress: 'Sadhutilla, Lanka, Hojai, Assam, India',                     lat: 25.9310, lng: 92.9480, type: 'locality',    category: 'place',      importance: 0.4 },
  { id: 'fp22', name: 'Panbari',               displayName: 'Panbari, Lanka, Hojai',               fullAddress: 'Panbari, Lanka, Hojai, Assam, India',                        lat: 25.9290, lng: 92.9380, type: 'locality',    category: 'place',      importance: 0.4 },
  { id: 'fp23', name: 'Lanka Gaon',            displayName: 'Lanka Gaon, Lanka, Hojai',            fullAddress: 'Lanka Gaon, Lanka, Hojai, Assam, India',                     lat: 25.9370, lng: 92.9460, type: 'locality',    category: 'place',      importance: 0.4 },
  { id: 'fp24', name: 'Dighalpukhuri',         displayName: 'Dighalpukhuri, Lanka, Hojai',         fullAddress: 'Dighalpukhuri, Lanka, Hojai, Assam, India',                  lat: 25.9355, lng: 92.9475, type: 'locality',    category: 'place',      importance: 0.4 },
  // Hojai District
  { id: 'fp30', name: 'Hojai Bus Stand',       displayName: 'Hojai Bus Stand, Hojai, Assam',       fullAddress: 'Hojai Bus Stand, Hojai, Assam, India',                       lat: 25.9800, lng: 92.8700, type: 'bus_station', category: 'transport',  importance: 0.7 },
  { id: 'fp31', name: 'Hojai Railway Station', displayName: 'Hojai Railway Station, Hojai, Assam', fullAddress: 'Hojai Railway Station, Hojai, Assam, India',                 lat: 25.9780, lng: 92.8650, type: 'railway',     category: 'transport',  importance: 0.7 },
  { id: 'fp32', name: 'Hojai Town',            displayName: 'Hojai Town, Hojai, Assam',            fullAddress: 'Hojai, Hojai, Assam, India',                                 lat: 25.9820, lng: 92.8720, type: 'town',        category: 'place',      importance: 0.7 },
  // Other major destinations
  { id: 'fp40', name: 'Nagaon Town',           displayName: 'Nagaon Town, Nagaon, Assam',          fullAddress: 'Nagaon, Nagaon, Assam, India',                               lat: 26.3550, lng: 92.6850, type: 'town',        category: 'place',      importance: 0.8 },
  { id: 'fp41', name: 'Nagaon Medical College',displayName: 'Nagaon Medical College, Nagaon',      fullAddress: 'Nagaon Medical College and Hospital, Nagaon, Assam, India',   lat: 26.3450, lng: 92.6950, type: 'hospital',    category: 'health',     importance: 0.7 },
  { id: 'fp42', name: 'Diphu Railway Station', displayName: 'Diphu Railway Station, Diphu, Assam', fullAddress: 'Diphu Railway Station, Diphu, Karbi Anglong, Assam, India',  lat: 25.8700, lng: 93.4300, type: 'railway',     category: 'transport',  importance: 0.6 },
  { id: 'fp43', name: 'Guwahati Paltan Bazar', displayName: 'Paltan Bazar, Guwahati, Assam',       fullAddress: 'Paltan Bazar, Guwahati, Kamrup, Assam, India',               lat: 26.1040, lng: 91.7470, type: 'commercial',  category: 'commerce',   importance: 0.7 },
  { id: 'fp44', name: 'Guwahati Airport',      displayName: 'Guwahati Airport (LGB), Assam',       fullAddress: 'Lokpriya Gopinath Bordoloi International Airport, Guwahati', lat: 26.1060, lng: 91.5860, type: 'airport',     category: 'transport',  importance: 0.9 },
  { id: 'fp45', name: 'Kaziranga National Park',displayName: 'Kaziranga National Park, Golaghat',  fullAddress: 'Kaziranga National Park, Golaghat, Assam, India',             lat: 26.5770, lng: 93.1720, type: 'national_park',category: 'tourism',  importance: 0.9 },
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const limit = parseInt(searchParams.get('limit') || '8')

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, results: [] })
    }

    // Default to Lanka town centre if no user location provided
    const userLat = lat ? parseFloat(lat) : 25.9335
    const userLng = lng ? parseFloat(lng) : 92.9445

    // Small viewbox: ~10km radius (~0.09 degrees) — keeps results hyper-local
    const radius = 0.09
    const viewbox = `${userLng - radius},${userLat - radius},${userLng + radius},${userLat + radius}`

    type LocationResult = {
      id: string | number
      name: string
      displayName: string
      fullAddress: string
      lat: number
      lng: number
      type: string
      category: string
      importance: number
    }

    let data: Record<string, unknown>[] = []

    // First attempt: bounded=1 (only inside viewbox)
    try {
      const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search')
      nominatimUrl.searchParams.set('q', query + ', Assam, India')
      nominatimUrl.searchParams.set('format', 'json')
      nominatimUrl.searchParams.set('limit', String(limit + 5))
      nominatimUrl.searchParams.set('countrycodes', 'in')
      nominatimUrl.searchParams.set('addressdetails', '1')
      nominatimUrl.searchParams.set('accept-language', 'en')
      nominatimUrl.searchParams.set('viewbox', viewbox)
      nominatimUrl.searchParams.set('bounded', '1')   // STRICT: no far-away results

      const response = await fetch(nominatimUrl.toString(), {
        headers: { 'User-Agent': 'GramYatri/1.0 (ride-hailing app for rural Assam)' },
        signal: AbortSignal.timeout(6000),
      })
      if (response.ok) data = await response.json()
    } catch { /* ignore */ }

    // Second attempt if bounded search empty: widen viewbox a bit, still bounded
    if (data.length === 0) {
      try {
        const r2 = radius * 3
        const vb2 = `${userLng - r2},${userLat - r2},${userLng + r2},${userLat + r2}`
        const url2 = new URL('https://nominatim.openstreetmap.org/search')
        url2.searchParams.set('q', query + ', Assam, India')
        url2.searchParams.set('format', 'json')
        url2.searchParams.set('limit', String(limit + 5))
        url2.searchParams.set('countrycodes', 'in')
        url2.searchParams.set('addressdetails', '1')
        url2.searchParams.set('accept-language', 'en')
        url2.searchParams.set('viewbox', vb2)
        url2.searchParams.set('bounded', '0')

        const response2 = await fetch(url2.toString(), {
          headers: { 'User-Agent': 'GramYatri/1.0' },
          signal: AbortSignal.timeout(5000),
        })
        if (response2.ok) data = await response2.json()
      } catch { /* ignore */ }
    }

    let results: LocationResult[] = []

    if (data.length > 0) {
      // Parse Nominatim results
      const raw = data.map((item: Record<string, unknown>) => {
        const address = item.address as Record<string, string> | undefined
        let displayName = ''
        if (address) {
          const name =
            address.shop || address.office || address.building || address.amenity ||
            address.tourism || address.historic || address.school || address.university ||
            address.hospital || address.bus_station || address.railway ||
            address.market || address.mall || address.place_of_worship ||
            address.neighbourhood || address.suburb ||
            address.village || address.town || String(item.name || '')
          const city     = address.city || address.town || address.village || ''
          const district = address.county || address.state_district || ''
          displayName = name
          if (city && city !== name) displayName += ', ' + city
          if (district && !displayName.includes(district)) displayName += ', ' + district
          if (!displayName.includes('Assam')) displayName += ', Assam'
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

      // Hard filter: max 30km from user
      const MAX_KM = 30
      results = raw.filter(r => {
        const dLat = (r.lat - userLat) * 111
        const dLng = (r.lng - userLng) * 111 * Math.cos(userLat * Math.PI / 180)
        return Math.sqrt(dLat * dLat + dLng * dLng) <= MAX_KM
      })
    }

    // Match fallback places
    const queryLower = query.toLowerCase()
    const matchingFallbacks = FALLBACK_PLACES.filter(p =>
      p.name.toLowerCase().includes(queryLower) ||
      p.displayName.toLowerCase().includes(queryLower)
    )

    // Merge: local fallbacks FIRST (highest priority), Nominatim after
    const fallbackNames = new Set(matchingFallbacks.map(p => p.name.toLowerCase()))
    const nomFiltered = results.filter(r => !fallbackNames.has(r.name.toLowerCase()))
    const merged = [...matchingFallbacks, ...nomFiltered].slice(0, limit)

    return NextResponse.json({ success: true, results: merged })
  } catch (error) {
    console.error('Geocode search error:', error)
    const query = new URL(req.url).searchParams.get('q') || ''
    const queryLower = query.toLowerCase()
    const fallbackResults = FALLBACK_PLACES.filter(p =>
      p.name.toLowerCase().includes(queryLower) ||
      p.displayName.toLowerCase().includes(queryLower)
    ).slice(0, 8)
    return NextResponse.json({ success: true, results: fallbackResults })
  }
}
