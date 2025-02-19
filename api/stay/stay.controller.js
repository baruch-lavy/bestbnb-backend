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
	console.log('req.body:', req)
    try {
        const updatedStay = await stayService.update(req.params.id, req.body)
        res.json(updatedStay)
    } catch (err) {
        res.status(500).json({ error: 'Failed to update stay' })
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
