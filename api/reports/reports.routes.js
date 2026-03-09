import express from 'express'
import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import {importCsv, getReports, getReportById, addReport, updateReport, deleteReport , getReportsByAgentCodeName } from './reports.controller.js'
import multer from 'multer'


const router = express.Router()

const upload = multer({ dest: 'uploads/', storage: multer.memoryStorage() }) // Configure multer to save files to 'uploads/' directory
const reportImageUpload = multer({
	dest: 'uploads/reports/',
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		if (file.mimetype?.startsWith('image/')) return cb(null, true)
		return cb(new Error('Only image files are allowed'))
	},
})

// Public Routes
router.get('/', requireAuth, getReports)
router.get('/:id', requireAuth, getReportById)

//Protected Routes (Require Auth)
router.post('/', requireAuth, reportImageUpload.single('img'), addReport)
router.post('/import', requireAuth, upload.single('file'), importCsv) 
router.put('/:id', requireAuth, updateReport)
router.delete('/:id', requireAuth, deleteReport)
router.get('/user/:userId', requireAuth, getReportsByAgentCodeName)
// router.get('/host',requireAuth, getReportsByHost)



export const reportsRoutes = router
