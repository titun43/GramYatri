import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: 'lat and lng are required' },
        { status: 400 }
      )
    }

    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)

    // Try Nominatim reverse geocoding
    try {
      const nominatimUrl = new URL('https://nominatim.openstreetmap.org/reverse')
      nominatimUrl.searchParams.set('lat', lat)
      nominatimUrl.searchParams.set('lon', lng)
      nominatimUrl.searchParams.set('format', 'json')
      nominatimUrl.searchParams.set('addressdetails', '1')
      nominatimUrl.searchParams.set('accept-language', 'en')
      nominatimUrl.searchParams.set('zoom', '16')

      const response = await fetch(nominatimUrl.toString(), {
        headers: {
          'User-Agent': 'GramYatri/1.0 (ride-hailing app for rural Assam)',
          'Accept-Language': 'en',
        },
        signal: AbortSignal.timeout(8000),
      })

      if (response.ok) {
        const data = await response.json()

        if (!data.error) {
          const address = data.address as Record<string, string> | undefined

          let displayName = ''
          let specificName = ''

          if (address) {
            specificName = address.shop || address.office || address.building ||
              address.amenity || address.tourism || address.historic ||
              address.school || address.university || address.hospital ||
              address.bus_station || address.railway || address.road ||
              address.market || address.mall || address.place_of_worship ||
              address.neighbourhood || address.suburb ||
              address.village || address.town || ''
          }

          const cityName = address?.city || address?.town || address?.village || ''
          const districtName = address?.county || address?.state_district || ''

          if (specificName) {
            displayName = specificName
            if (cityName && cityName !== specificName) displayName += ', ' + cityName
          } else if (cityName) {
            displayName = cityName
          } else if (data.name) {
            displayName = String(data.name)
          } else {
            displayName = String(data.display_name || '').split(',').slice(0, 2).join(',')
          }

          if (districtName && !displayName.includes(districtName)) {
            displayName += ', ' + districtName
          }
          if (!displayName.includes('Assam')) {
            displayName += ', Assam'
          }

          return NextResponse.json({
            success: true,
            result: {
              name: String(data.name || ''),
              displayName: displayName.trim(),
              fullAddress: String(data.display_name || ''),
              lat: latNum,
              lng: lngNum,
              address: data.address || {},
              road: address?.road || '',
              village: address?.village || '',
              town: address?.town || '',
              city: address?.city || '',
              county: address?.county || '',
              state: address?.state || '',
              postcode: address?.postcode || '',
            },
          })
        }
      }
    } catch (fetchError) {
      console.log('Nominatim reverse unavailable, using fallback:', fetchError)
    }

    // Fallback: Generate a basic location name from coordinates
    // Determine approximate area based on coordinates
    let areaName = 'Unknown Location'
    if (latNum > 25.9 && latNum < 26.0 && lngNum > 92.9 && lngNum < 93.0) {
      areaName = 'Lanka, Hojai, Assam'
    } else if (latNum > 25.95 && latNum < 26.05 && lngNum > 92.8 && lngNum < 92.95) {
      areaName = 'Hojai, Assam'
    } else if (latNum > 26.3 && latNum < 26.4 && lngNum > 92.6 && lngNum < 92.75) {
      areaName = 'Nagaon, Assam'
    } else if (latNum > 26.05 && latNum < 26.15 && lngNum > 91.7 && lngNum < 91.8) {
      areaName = 'Guwahati, Assam'
    } else {
      areaName = `Location (${latNum.toFixed(3)}, ${lngNum.toFixed(3)})`
    }

    return NextResponse.json({
      success: true,
      result: {
        name: areaName.split(',')[0],
        displayName: areaName,
        fullAddress: areaName,
        lat: latNum,
        lng: lngNum,
        address: {},
        road: '',
        village: '',
        town: '',
        city: '',
        county: '',
        state: 'Assam',
        postcode: '',
      },
    })
  } catch (error) {
    console.error('Reverse geocode error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reverse geocode' },
      { status: 500 }
    )
  }
}
