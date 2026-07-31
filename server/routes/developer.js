import express from "express";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireRole("developer"));

async function getDeveloperProjectIds(userId) {
  const projects = await Project.find({ developerIds: userId }).select("_id").lean();
  return new Set(projects.map((project) => String(project._id)));
}

async function publicProject(project) {
  const company = project.companyId ? await Company.findById(project.companyId).select("name").lean() : null;
  return {
    ...project,
    id: project._id,
    companyName: company?.name || "",
    team: project.developerIds?.length ? project.developerIds.map((id) => String(id)) : [],
    assignedTeam: project.developerIds?.length ? project.developerIds.map((id) => String(id)) : []
  };
}

router.get("/me", async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub).select("_id name email phone company jobTitle role status preferences");
    res.json({ user: user || null });
  } catch (error) {
    next(error);
  }
});

router.get("/projects", async (req, res, next) => {
  try {
    const projects = await Project.find({ developerIds: req.auth.sub }).sort({ updatedAt: -1 }).lean();
    const hydrated = [];
    for (const project of projects) {
      hydrated.push(await publicProject(project));
    }
    res.json(hydrated);
  } catch (error) {
    next(error);
  }
});

export default router;
