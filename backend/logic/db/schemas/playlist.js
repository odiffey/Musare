import mongoose from "mongoose";

export default {
	displayName: { type: String, min: 2, max: 32, required: true },
	isUserModifiable: { type: Boolean, default: true, required: true },
	songs: [
		{
			_id: { type: mongoose.Schema.Types.ObjectId, required: false },
			youtubeId: { type: String },
			title: { type: String },
			duration: { type: Number },
			thumbnail: { type: String, required: false },
			artists: { type: Array, required: false },
			status: { type: String }
		}
	],
	createdBy: { type: String, required: true },
	createdAt: { type: Date, default: Date.now, required: true },
	createdFor: { type: String },
	privacy: { type: String, enum: ["public", "private"], default: "private" },
	type: { type: String, enum: ["user", "genre", "station", "artist"], required: true },
	documentVersion: { type: Number, default: 4, required: true }
};
