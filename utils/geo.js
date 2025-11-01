const fetch = require('node-fetch');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Haversine distance in kilometers
const haversineKm = (lat1, lon1, lat2, lon2) => {
	const toRad = d => (d * Math.PI) / 180;
	const R = 6371; // km
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
};

// Point in polygon (ray casting)
const isPointInPolygon = (point, polygon) => {
	const [x, y] = point; // [lng, lat]
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i][0], yi = polygon[i][1];
		const xj = polygon[j][0], yj = polygon[j][1];
		const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
};

// Geocode address -> { lat, lng, formattedAddress }
const geocodeAddress = async (address) => {
	if (!GOOGLE_MAPS_API_KEY) throw new Error('GOOGLE_MAPS_API_KEY missing');
	const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
	const res = await fetch(url);
	const json = await res.json();
	if (json.status !== 'OK' || !json.results[0]) throw new Error('Address not found');
	const r = json.results[0];
	return {
		lat: r.geometry.location.lat,
		lng: r.geometry.location.lng,
		formattedAddress: r.formatted_address,
		placeId: r.place_id
	};
};

// Reverse geocode lat,lng -> { address, area, city, postalCode }
const reverseGeocode = async (lat, lng) => {
	if (!GOOGLE_MAPS_API_KEY) throw new Error('GOOGLE_MAPS_API_KEY missing');
	const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
	const res = await fetch(url);
	const json = await res.json();
	if (json.status !== 'OK' || !json.results[0]) throw new Error('Location not found');
	const r = json.results[0];
	const components = Object.fromEntries(r.address_components.flatMap(c => c.types.map(t => [t, c.long_name])));
	return {
		address: r.formatted_address,
		area: components.sublocality || components.locality || '',
		city: components.administrative_area_level_2 || components.locality || '',
		state: components.administrative_area_level_1 || '',
		postalCode: components.postal_code || ''
	};
};

module.exports = {
	haversineKm,
	isPointInPolygon,
	geocodeAddress,
	reverseGeocode
};



