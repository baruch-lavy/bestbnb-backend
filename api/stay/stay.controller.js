import { stayService } from './stay.service.js'

export const stayController = {
    getStays,
    getStayById,
    addStay,
    updateStay,
    deleteStay
}

// ✅ GET ALL STAYS
export async function getStays(req, res) {
    console.log("🔍 Querying stays with filter:", req.query)  // 🚀 Debugging incoming data
    try {
        const stays = await stayService.query(req.query)
        res.json(stays)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stays' })
    }
}

// ✅ GET SINGLE STAY
export async function getStayById(req, res) {
    try {
        const stay = await stayService.getById(req.params.id)
        res.json(stay)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stay' })
    }
}

// ✅ ADD STAY
export async function addStay(req, res) {
    try {
        const addedStay = await stayService.add(req.body)
        res.json(addedStay)
    } catch (err) {
        res.status(500).json({ error: 'Failed to add stay' })
    }
}

// ✅ UPDATE STAY
export async function updateStay(req, res) {
    try {
        const stayId = req.params.id
        const stayToSave = req.body

        console.log("🔍 Updating stay:", stayId, stayToSave)  // 🚀 Debugging incoming data

        if (!stayToSave || Object.keys(stayToSave).length === 0) {
            return res.status(400).json({ error: "Invalid stay data" })
        }

        const updatedStay = await stayService.update(stayId, stayToSave)

        if (!updatedStay) {
            return res.status(404).json({ error: "Stay not found" })
        }

        res.json(updatedStay)
    } catch (err) {
        console.error("❌ Error updating stay:", err)
        res.status(500).json({ error: "Failed to update stay" })
    }
}
// ✅ DELETE STAY
export async function deleteStay(req, res) {
    try {
        await stayService.remove(req.params.id)
        res.json({ message: 'Stay deleted successfully' })
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete stay' })
    }
}
