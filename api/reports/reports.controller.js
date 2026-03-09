import { reportsService } from "./reports.service.js";
import { userService } from "../user/user.service.js";
import { logger } from "../../services/logger.service.js";
import { ObjectId } from "mongodb";
import { parse } from "csv-parse/sync";

export async function importCsv(req, res) {
  try {
    const csvText =
      req.file?.buffer?.toString("utf8") ||
      (typeof req.body?.csv === "string" ? req.body.csv : null);

    if (!csvText) {
      return res
        .status(400)
        .json({ error: "CSV data is required (file or body.csv)" });
    }

    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (!records.length) {
      return res.status(400).json({ error: "CSV file contains no data rows" });
    }
    // console.log("Parsed CSV records:", records); // Debugging log

    const result = await reportsService.createReportsFromCsv(
      // req.loggedinUser._id,
      records,
    );

    if (result?.error)
      return res.status(result.status || 400).json({ error: result.error });
    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ error: "Invalid CSV format" });
  }
}

export async function getReports(req, res) {
  try {
    const { agentCode, category, urgency, sortBy, sortDir } = req.query;

    const { loggedinUser } = req;

    const user = await userService.getById(loggedinUser._id);
    console.log("Logged in user:", user); // Debugging log

    if (loggedinUser?.role === "agent" && user.agentCode !== agentCode) {
      return res.status(403).json({ error: "Forbidden: Access denied" });
    }

    const filterBy = {
      agentCode: agentCode || undefined,
      category: category || undefined,
      urgency: urgency || undefined,
      sortBy: sortBy || undefined,
      sortDir: sortDir || undefined,
    };

    const reports = await reportsService.query(filterBy);
    res.json({ reports, length: reports.length });
  } catch (err) {
    console.error(" Failed to fetch reports:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
}

//GET SINGLE REPORT BY ID
export async function getReportById(req, res) {
  try {
    const { loggedinUser } = req;

    const user = await userService.getById(loggedinUser._id);
    console.log("Logged in user:", user); // Debugging log

    const reportId = req.params?.id;
    if (!reportId || !ObjectId.isValid(reportId)) {
      return res.status(400).json({ error: "Invalid report ID" });
    }

    const report = await reportsService.getById(reportId);
    console.log("loggedinUser:", loggedinUser); // Debugging log
    if (loggedinUser?.role === "agent" && user.agentCode !== report.agentCode) {
      return res.status(403).json({ error: "Forbidden: Access denied" });
    }
    res.json(report);
  } catch (err) {
    logger.error("Failed to fetch report", err);
    res.status(500).json({ error: "Failed to fetch report" });
  }
}

export async function getReportsByAgentCodeName(req, res) {
  console.log("req.params:", req.params);
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const reports = await reportsService.getReportsByAgentCodeName(userId); //  Use reportsService
    res.json(reports);
  } catch (error) {
    logger.error("Failed to fetch user reports:", error);
    res.status(500).json({ error: "Failed to fetch user reports" });
  }
}

// ADD NEW REPORT
export async function addReport(req, res) {
  console.log(
    "~ file: reports.controller.js ~ line 63 ~ addReport ~ req.body",
    req.body,
  );
  const user = req.loggedinUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { category, urgency, massege, img } = req.body;

  if (!category || !urgency || !massege) {
    return res
      .status(400)
      .json({ error: "Missing required fields: category, urgency, massege" });
  }

  const reportData = {
    category,
    urgency,
    massege,
    img: req.file ? `/uploads/reports/${req.file.filename}` : img || null,
  };

  try {
    const addedReport = await reportsService.add(reportData, user);
    res.json(addedReport);
  } catch (err) {
    logger.error("Failed to add report", err);
    res.status(500).json({ error: "Failed to add report" });
  }
}

// UPDATE REPORT
export async function updateReport(req, res) {
  try {
    const { status } = req.body; // Extract status from request body
    console.log("status:", status);
    const reportId = req.params.id;

    if (!ObjectId.isValid(reportId)) {
      return res.status(400).json({ error: "Invalid Report ID" }); // Handle invalid ObjectId
    }

    const updatedReport = await reportsService.updateReport(reportId, {
      status,
    }); // Use service
    if (!updatedReport)
      return res.status(404).json({ error: "Report not found" }); // Handle missing report

    res.json(updatedReport);
  } catch (err) {
    console.error(" Failed to update report:", err);
    res.status(500).json({ error: "Failed to update report" });
  }
}

// DELETE REPORT
export async function deleteReport(req, res) {
  try {
    await reportsService.remove(req.params.id);
    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    logger.error("Failed to delete report", err);
    res.status(500).json({ error: "Failed to delete report" });
  }
}
