const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { geocodeAddress, reverseGeocode, haversineKm, isPointInPolygon } = require('../utils/geo');

const router = express.Router();

// Geocode an address
router.get('/geocode', [query('address').notEmpty()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { address } = req.query;
    const result = await geocodeAddress(address);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Reverse geocode
router.get('/reverse-geocode', [query('lat').isFloat(), query('lng').isFloat()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { lat, lng } = req.query;
    const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// List zones
router.get('/zones', async (_req, res) => {
  try {
    const zones = await prisma.zone.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    res.json({ success: true, data: { zones } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch zones' });
  }
});

// Create/update zones (Admin)
router.post('/zones', [
  authenticateToken,
  requireRole('ADMIN'),
  body('name').notEmpty(),
  body('city').notEmpty(),
  body('polygon').isArray({ min: 3 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { id, name, city, polygon, isActive = true } = req.body;
    const zone = id ?
      await prisma.zone.update({ where: { id }, data: { name, city, polygon, isActive } }) :
      await prisma.zone.create({ data: { name, city, polygon, isActive } });
    res.json({ success: true, data: { zone } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to save zone' });
  }
});

// Seed Tirunelveli zones (Admin)
router.post('/zones/seed', authenticateToken, requireRole('ADMIN'), async (_req, res) => {
  try {
    const seed = [
      { name: 'Tirunelveli Central', city: 'Tirunelveli', polygon: [ [77.704,8.729], [77.740,8.729], [77.740,8.765], [77.704,8.765] ] },
      { name: 'Palayamkottai', city: 'Tirunelveli', polygon: [ [77.729,8.706], [77.765,8.706], [77.765,8.740], [77.729,8.740] ] },
      { name: 'Melapalayam', city: 'Tirunelveli', polygon: [ [77.700,8.700], [77.735,8.700], [77.735,8.730], [77.700,8.730] ] }
    ];
    for (const z of seed) {
      await prisma.zone.upsert({ where: { name: z.name }, update: z, create: z });
    }
    res.json({ success: true, message: 'Zones seeded' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to seed zones' });
  }
});

// Update provider location (Provider)
router.post('/providers/location', [
  authenticateToken,
  requireRole('PROVIDER'),
  body('lat').isFloat(),
  body('lng').isFloat(),
  body('address').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { lat, lng, address } = req.body;
    // find zone containing point
    const zones = await prisma.zone.findMany({ where: { isActive: true } });
    let zoneMatch = null;
    for (const zone of zones) {
      const poly = zone.polygon;
      if (Array.isArray(poly) && poly.length >= 3) {
        if (isPointInPolygon([lng, lat], poly)) { zoneMatch = zone; break; }
      }
    }
    const location = await prisma.providerLocation.create({
      data: {
        providerId: req.user.id,
        lat,
        lng,
        address: address || null,
        zoneId: zoneMatch ? zoneMatch.id : null
      }
    });
    res.json({ success: true, data: { location } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update location' });
  }
});

// Nearby providers search
router.get('/search/nearby', [query('lat').isFloat(), query('lng').isFloat(), query('radiusKm').optional().isFloat()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { lat, lng, radiusKm = 10 } = req.query;
    const latNum = parseFloat(lat), lngNum = parseFloat(lng), radius = parseFloat(radiusKm);
    // naive search using last known provider location
    const locations = await prisma.providerLocation.findMany({
      include: {
        provider: {
          include: {
            user: { include: { profile: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    const results = [];
    for (const loc of locations) {
      const d = haversineKm(latNum, lngNum, loc.lat, loc.lng);
      if (d <= radius) {
        results.push({ providerId: loc.providerId, businessName: loc.provider.businessName, lat: loc.lat, lng: loc.lng, distanceKm: Number(d.toFixed(2)) });
      }
    }
    results.sort((a,b) => a.distanceKm - b.distanceKm);
    res.json({ success: true, data: { providers: results } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to search providers' });
  }
});

module.exports = router;



