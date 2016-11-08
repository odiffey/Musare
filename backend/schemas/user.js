module.exports = mongoose => mongoose.model('user', new mongoose.Schema({
	username: { type: String, required: true },
	email: {
		verified: { type: Boolean, default: false, required: true },
		verificationToken: String,
		address: String
	},
	services: {
		password: {
			password: String
		}
	},
	ban: {
		banned: { type: Boolean, default: false, required: true },
		reason: String,
		bannedAt: Date,
		bannedUntil: Date
	},
	statistics: {
		songsRequested: { type: Number, default: 0 }
	},
	createdAt: { type: Date, default: Date.now() }
}));

