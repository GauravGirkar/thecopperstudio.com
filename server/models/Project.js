import mongoose from "mongoose";
import { defineModel } from "../db/defineModel.js";

const stageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: { type: String, enum: ["not_started", "in_progress", "completed"], default: "not_started" },
    startDate: { type: Date },
    endDate: { type: Date },
    notes: { type: String, default: "" },
    completedAt: { type: Date }
  },
  { _id: true, strict: false }
);

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Buyer's original project wording from checkout. `name` may later be
    // rewritten to the coded "<Company>-Project N-MMYY" format when a company
    // adopts the project, so this keeps the human-readable intent.
    clientProjectName: { type: String, default: "" },
    description: { type: String, default: "" },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null, index: true },
    developerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    packageName: { type: String, default: "" },
    status: { type: String, default: "not_started" },
    clientStatus: { type: String, default: "" },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    currentPhase: { type: String, default: "" },
    startDate: { type: Date },
    expectedEndDate: { type: Date },
    actualEndDate: { type: Date },
    stages: [stageSchema],
    adminNotes: { type: String, default: "" },
    deliverables: [{ type: String }],
    meetingLink: { type: String, default: "" },
    activity: { type: [mongoose.Schema.Types.Mixed], default: [] }
  },
  { timestamps: true, strict: false }
);

export default defineModel({
  name: "Project",
  table: "projects",
  schema,
  defaults: {
    clientProjectName: "",
    description: "",
    clientId: null,
    companyId: null,
    developerIds: [],
    packageName: "",
    status: "not_started",
    clientStatus: "",
    progress: 0,
    currentPhase: "",
    stages: [],
    adminNotes: "",
    deliverables: [],
    meetingLink: "",
    activity: []
  }
});
