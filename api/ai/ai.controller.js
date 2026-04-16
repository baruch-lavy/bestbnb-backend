import OpenAI from 'openai'
import { logger } from '../../services/logger.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SEARCH_LIMIT = 10
const LIMIT_MS = 24 * 60 * 60 * 1000 // 24 hours

const VALID_CATEGORIES = [
    'Villa', 'Cabin', 'Cottage', 'Penthouse', 'Apartment', 'Beachfront', 'Luxury',
    'Cabins', 'Countryside', 'Lakefront', 'Islands', 'Beach', 'Tiny homes', 'Design',
    'Camping', 'Arctic', 'Desert', 'Tropical', 'Windmills', 'Caves', 'Skiing', 'Farms',
    'Historical', 'Vineyard', 'Forest', 'Mountain', 'Lighthouse', 'Containers', 'Domes',
    'Boats', 'Treehouses', 'Yurts', 'Golfing', 'Lake', 'Surfing', 'A-frames', 'Barns',
    'Towers', 'Chalets', 'Riads', 'Trulli', 'Cycladic', 'Shepherd', 'Campers',
    'Earth homes', 'Creative spaces', 'Ryokans', 'Minsus', 'Hanoks', 'Off-grid',
    'Ski-in/out', 'Vineyards'
].join(', ')

const VALID_AMENITIES = [
    'Smoke alarm', 'Bay view', 'Shared beach access – Beachfront', 'Indoor fireplace: wood-burning',
    'BBQ grill: gas', 'Exercise equipment', 'Crib - always at the listing', 'EV charger',
    'Private pool', 'Private hot tub', 'Iron', 'Carbon monoxide alarm', 'Private entrance',
    'Long term stays allowed', 'Kitchen', 'Wifi', 'Self check-in', 'Free parking on premises',
    'Free washer – In building', 'Central air conditioning', 'Hair dryer', 'TV', 'Central heating',
    'Air conditioning', 'Essentials', 'Hangers', 'Bed linens', 'Ethernet connection',
    'Pool table', 'Theme room', 'Ceiling fan', 'Heating', 'Fire extinguisher', 'First aid kit',
    'Refrigerator', 'Microwave', 'Dishes and silverware', 'Dishwasher', 'Stove', 'Oven',
    'Coffee maker', 'Wine glasses', 'Toaster', 'Backyard', 'Fire pit', 'Outdoor furniture',
    'BBQ grill', 'Sun loungers', 'Lockbox'
].join(', ')

const SYSTEM_PROMPT = `You extract stay/accommodation search filters from natural language. Return ONLY valid JSON, no markdown, no explanation.

Valid categories (use "category" field ONLY for one of these exact values):
${VALID_CATEGORIES}

Valid amenities (use ONLY values from this list, pick the closest match):
${VALID_AMENITIES}

Rules:
- Omit fields the user did not mention
- Normalize neighborhoods to parent city (Manhattan→New York, Brooklyn→New York, Montmartre→Paris)
- NEVER set "category" for generic accommodation words like: apartment, flat, room, house, home, place, stay, unit, rental, דירה, חדר, בית, מקום — these are colloquial synonyms for "any accommodation" and should be ignored
- Use "category" ONLY when the user describes a specific property style (e.g. villa, cabin, treehouse, boat, dome) that exactly matches a value from the list above
- Map user amenity requests to the closest valid amenity label (e.g. "pool"→"Private pool", "parking"→"Free parking on premises", "AC"→"Air conditioning", "jacuzzi"→"Private hot tub")
- If no valid amenity match exists, omit it
- If user mentions beach/sea/ocean environment as a vibe, use category "Beach" or "Beachfront"
- guests format: { "adults": number, "children": number, "pets": boolean }
- dates: ISO 8601, assume year ${new Date().getFullYear()} unless stated otherwise

Available fields:
destination (string), minBedrooms (int), minBeds (int), minBathrooms (int),
guests (object), startDate (ISO string), endDate (ISO string),
minPrice (int), maxPrice (int), amenities (string[]), category (string)`

export async function parseFilter(req, res) {
    try {
        const { query } = req.body
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({ err: 'query is required' })
        }

        // Rate limiting
        const store = asyncLocalStorage.getStore()
        const usageKey = store?.loggedinUser?._id || req.ip
        const collection = await dbService.getCollection('ai_usage')
        const now = new Date()

        let usageDoc = await collection.findOne({ key: usageKey })

        if (usageDoc && usageDoc.resetAt > now) {
            // Within the 24h window
            if (usageDoc.count >= SEARCH_LIMIT) {
                return res.status(429).json({ err: 'LIMIT_REACHED', resetAt: usageDoc.resetAt })
            }
            await collection.updateOne({ key: usageKey }, { $inc: { count: 1 } })
        } else {
            // First search or window expired — reset
            await collection.updateOne(
                { key: usageKey },
                { $set: { key: usageKey, count: 1, resetAt: new Date(now.getTime() + LIMIT_MS) } },
                { upsert: true }
            )
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: query.trim() }
            ],
            max_tokens: 300,
            temperature: 0,
        })

        const parsed = JSON.parse(completion.choices[0].message.content)
        res.json(parsed)
    } catch (err) {
        logger.error('Failed to parse AI filter', err)
        res.status(500).json({ err: 'Failed to parse filter' })
    }
}
