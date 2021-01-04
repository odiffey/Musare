import async from "async";

import { isAdminRequired, isLoginRequired } from "./hooks";

// const moduleManager = require("../../index");

import DBModule from "../db";
import UtilsModule from "../utils";
import CacheModule from "../cache";
import SongsModule from "../songs";
import ActivitiesModule from "../activities";

import queueSongs from "./queueSongs";

CacheModule.runJob("SUB", {
	channel: "song.removed",
	cb: songId => {
		UtilsModule.runJob("EMIT_TO_ROOM", {
			room: "admin.songs",
			args: ["event:admin.song.removed", songId]
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.added",
	cb: async songId => {
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" });
		songModel.findOne({ _id: songId }, (err, song) => {
			UtilsModule.runJob("EMIT_TO_ROOM", {
				room: "admin.songs",
				args: ["event:admin.song.added", song]
			});
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.updated",
	cb: async songId => {
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" });
		songModel.findOne({ _id: songId }, (err, song) => {
			UtilsModule.runJob("EMIT_TO_ROOM", {
				room: "admin.songs",
				args: ["event:admin.song.updated", song]
			});
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.like",
	cb: data => {
		UtilsModule.runJob("EMIT_TO_ROOM", {
			room: `song.${data.songId}`,
			args: [
				"event:song.like",
				{
					songId: data.songId,
					likes: data.likes,
					dislikes: data.dislikes
				}
			]
		});
		UtilsModule.runJob("SOCKETS_FROM_USER", { userId: data.userId }).then(response => {
			response.sockets.forEach(socket => {
				socket.emit("event:song.newRatings", {
					songId: data.songId,
					liked: true,
					disliked: false
				});
			});
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.dislike",
	cb: data => {
		UtilsModule.runJob("EMIT_TO_ROOM", {
			room: `song.${data.songId}`,
			args: [
				"event:song.dislike",
				{
					songId: data.songId,
					likes: data.likes,
					dislikes: data.dislikes
				}
			]
		});
		UtilsModule.runJob("SOCKETS_FROM_USER", { userId: data.userId }).then(response => {
			response.sockets.forEach(socket => {
				socket.emit("event:song.newRatings", {
					songId: data.songId,
					liked: false,
					disliked: true
				});
			});
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.unlike",
	cb: data => {
		UtilsModule.runJob("EMIT_TO_ROOM", {
			room: `song.${data.songId}`,
			args: [
				"event:song.unlike",
				{
					songId: data.songId,
					likes: data.likes,
					dislikes: data.dislikes
				}
			]
		});
		UtilsModule.runJob("SOCKETS_FROM_USER", { userId: data.userId }).then(response => {
			response.sockets.forEach(socket => {
				socket.emit("event:song.newRatings", {
					songId: data.songId,
					liked: false,
					disliked: false
				});
			});
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.undislike",
	cb: data => {
		UtilsModule.runJob("EMIT_TO_ROOM", {
			room: `song.${data.songId}`,
			args: [
				"event:song.undislike",
				{
					songId: data.songId,
					likes: data.likes,
					dislikes: data.dislikes
				}
			]
		});
		UtilsModule.runJob("SOCKETS_FROM_USER", { userId: data.userId }).then(response => {
			response.sockets.forEach(socket => {
				socket.emit("event:song.newRatings", {
					songId: data.songId,
					liked: false,
					disliked: false
				});
			});
		});
	}
});

export default {
	/**
	 * Returns the length of the songs list
	 *
	 * @param {object} session - the session object automatically added by socket.io
	 * @param cb
	 */
	length: isAdminRequired(async (session, cb) => {
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" });
		async.waterfall(
			[
				next => {
					songModel.countDocuments({}, next);
				}
			],
			async (err, count) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err });
					console.log("ERROR", "SONGS_LENGTH", `Failed to get length from songs. "${err}"`);
					return cb({ status: "failure", message: err });
				}
				console.log("SUCCESS", "SONGS_LENGTH", `Got length from songs successfully.`);
				return cb(count);
			}
		);
	}),

	/**
	 * Gets a set of songs
	 *
	 * @param {object} session - the session object automatically added by socket.io
	 * @param set - the set number to return
	 * @param cb
	 */
	getSet: isAdminRequired(async (session, set, cb) => {
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" });
		async.waterfall(
			[
				next => {
					songModel
						.find({})
						.skip(15 * (set - 1))
						.limit(15)
						.exec(next);
				}
			],
			async (err, songs) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err });
					console.log("ERROR", "SONGS_GET_SET", `Failed to get set from songs. "${err}"`);
					return cb({ status: "failure", message: err });
				}
				console.log("SUCCESS", "SONGS_GET_SET", `Got set from songs successfully.`);
				return cb(songs);
			}
		);
	}),

	/**
	 * Gets a song
	 *
	 * @param {object} session - the session object automatically added by socket.io
	 * @param {string} songId - the song id
	 * @param {Function} cb
	 */
	getSong: isAdminRequired((session, songId, cb) => {
		async.waterfall(
			[
				next => {
					SongsModule.runJob("GET_SONG_FROM_ID", { songId })
						.then(song => {
							next(null, song);
						})
						.catch(err => {
							next(err);
						});
				}
			],
			async (err, song) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err });
					console.log("ERROR", "SONGS_GET_SONG", `Failed to get song ${songId}. "${err}"`);
					return cb({ status: "failure", message: err });
				}
				console.log("SUCCESS", "SONGS_GET_SONG", `Got song ${songId} successfully.`);
				return cb({ status: "success", data: song });
			}
		);
	}),

	/**
	 * Obtains basic metadata of a song in order to format an activity
	 *
	 * @param {object} session - the session object automatically added by socket.io
	 * @param {string} songId - the song id
	 * @param {Function} cb - callback
	 */
	getSongForActivity: (session, songId, cb) => {
		async.waterfall(
			[
				next => {
					SongsModule.runJob("GET_SONG_FROM_ID", { songId })
						.then(response => next(null, response.song))
						.catch(next);
				}
			],
			async (err, song) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err });

					console.log(
						"ERROR",
						"SONGS_GET_SONG_FOR_ACTIVITY",
						`Failed to obtain metadata of song ${songId} for activity formatting. "${err}"`
					);

					return cb({ status: "failure", message: err });
				}

				if (song) {
					console.log(
						"SUCCESS",
						"SONGS_GET_SONG_FOR_ACTIVITY",
						`Obtained metadata of song ${songId} for activity formatting successfully.`
					);

					return cb({
						status: "success",
						data: {
							title: song.title,
							thumbnail: song.thumbnail
						}
					});
				}

				console.log(
					"ERROR",
					"SONGS_GET_SONG_FOR_ACTIVITY",
					`Song ${songId} does not exist so failed to obtain for activity formatting.`
				);

				return cb({ status: "failure" });
			}
		);
	},

	/**
	 * Updates a song
	 *
	 * @param {object} session - the session object automatically added by socket.io
	 * @param {string} songId - the song id
	 * @param {object} song - the updated song object
	 * @param {Function} cb
	 */
	update: isAdminRequired(async (session, songId, song, cb) => {
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" });
		async.waterfall(
			[
				next => {
					songModel.updateOne({ _id: songId }, song, { runValidators: true }, next);
				},

				(res, next) => {
					SongsModule.runJob("UPDATE_SONG", { songId })
						.then(song => {
							next(null, song);
						})
						.catch(next);
				}
			],
			async (err, song) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err });

					console.log("ERROR", "SONGS_UPDATE", `Failed to update song "${songId}". "${err}"`);

					return cb({ status: "failure", message: err });
				}

				console.log("SUCCESS", "SONGS_UPDATE", `Successfully updated song "${songId}".`);

				CacheModule.runJob("PUB", {
					channel: "song.updated",
					value: song.songId
				});

				return cb({
					status: "success",
					message: "Song has been successfully updated",
					data: song
				});
			}
		);
	}),

	/**
	 * Removes a song
	 *
	 * @param session
	 * @param songId - the song id
	 * @param cb
	 */
	remove: isAdminRequired(async (session, songId, cb) => {
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" });
		async.waterfall(
			[
				next => {
					songModel.deleteOne({ _id: songId }, next);
				},

				(res, next) => {
					// TODO Check if res gets returned from above
					CacheModule.runJob("HDEL", { table: "songs", key: songId })
						.then(() => {
							next();
						})
						.catch(next);
				}
			],
			async err => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err });

					console.log("ERROR", "SONGS_UPDATE", `Failed to remove song "${songId}". "${err}"`);

					return cb({ status: "failure", message: err });
				}

				console.log("SUCCESS", "SONGS_UPDATE", `Successfully remove song "${songId}".`);

				CacheModule.runJob("PUB", { channel: "song.removed", value: songId });

				return cb({
					status: "success",
					message: "Song has been successfully updated"
				});
			}
		);
	}),

	/**
	 * Adds a song
	 *
	 * @param session
	 * @param song - the song object
	 * @param cb
	 */
	add: isAdminRequired(async (session, song, cb) => {
		const SongModel = await DBModule.runJob("GET_MODEL", { modelName: "song" });
		async.waterfall(
			[
				next => {
					SongModel.findOne({ songId: song.songId }, next);
				},

				(existingSong, next) => {
					if (existingSong) return next("Song is already in rotation.");
					return next();
				},

				next => {
					const newSong = new SongModel(song);
					newSong.acceptedBy = session.userId;
					newSong.acceptedAt = Date.now();
					newSong.save(next);
				},

				(res, next) => {
					queueSongs.remove(session, song._id, () => {
						next();
					});
				}
			],
			async err => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err });

					console.log("ERROR", "SONGS_ADD", `User "${session.userId}" failed to add song. "${err}"`);

					return cb({ status: "failure", message: err });
				}

				console.log(
					"SUCCESS",
					"SONGS_ADD",
					`User "${session.userId}" successfully added song "${song.songId}".`
				);

				CacheModule.runJob("PUB", {
					channel: "song.added",
					value: song.songId
				});

				return cb({
					status: "success",
					message: "Song has been moved from the queue successfully."
				});
			}
		);
		// TODO Check if video is in queue and Add the song to the appropriate stations
	}),

	/**
	 * Likes a song
	 *
	 * @param session
	 * @param songId - the song id
	 * @param cb
	 */
	like: isLoginRequired(async (session, songId, cb) => {
		const userModel = await DBModule.runJob("GET_MODEL", { modelName: "user" });
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" });
		async.waterfall(
			[
				next => {
					songModel.findOne({ songId }, next);
				},

				(song, next) => {
					if (!song) return next("No song found with that id.");
					return next(null, song);
				}
			],
			async (err, song) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err });
					console.log(
						"ERROR",
						"SONGS_LIKE",
						`User "${session.userId}" failed to like song ${songId}. "${err}"`
					);
					return cb({ status: "failure", message: err });
				}

				const oldSongId = songId;
				songId = song._id;

				return userModel.findOne({ _id: session.userId }, (err, user) => {
					if (user.liked.indexOf(songId) !== -1)
						return cb({
							status: "failure",
							message: "You have already liked this song."
						});

					return userModel.updateOne(
						{ _id: session.userId },
						{
							$push: { liked: songId },
							$pull: { disliked: songId }
						},
						err => {
							if (!err) {
								return userModel.countDocuments({ liked: songId }, (err, likes) => {
									if (err)
										return cb({
											status: "failure",
											message: "Something went wrong while liking this song."
										});

									return userModel.countDocuments({ disliked: songId }, (err, dislikes) => {
										if (err)
											return cb({
												status: "failure",
												message: "Something went wrong while liking this song."
											});

										return songModel.update(
											{ _id: songId },
											{
												$set: {
													likes,
													dislikes
												}
											},
											err => {
												if (err)
													return cb({
														status: "failure",
														message: "Something went wrong while liking this song."
													});

												SongsModule.runJob("UPDATE_SONG", { songId });

												CacheModule.runJob("PUB", {
													channel: "song.like",
													value: JSON.stringify({
														songId: oldSongId,
														userId: session.userId,
														likes,
														dislikes
													})
												});

												ActivitiesModule.runJob("ADD_ACTIVITY", {
													userId: session.userId,
													activityType: "liked_song",
													payload: [songId]
												});

												return cb({
													status: "success",
													message: "You have successfully liked this song."
												});
											}
										);
									});
								});
							}
							return cb({
								status: "failure",
								message: "Something went wrong while liking this song."
							});
						}
					);
				});
			}
		);
	}),

	/**
	 * Dislikes a song
	 *
	 * @param session
	 * @param songId - the song id
	 * @param cb
	 */
	dislike: isLoginRequired(async (session, songId, cb) => {
		const userModel = await DBModule.runJob("GET_MODEL", { modelName: "user" });
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" });
		async.waterfall(
			[
				next => {
					songModel.findOne({ songId }, next);
				},

				(song, next) => {
					if (!song) return next("No song found with that id.");
					return next(null, song);
				}
			],
			async (err, song) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err });
					console.log(
						"ERROR",
						"SONGS_DISLIKE",
						`User "${session.userId}" failed to like song ${songId}. "${err}"`
					);
					return cb({ status: "failure", message: err });
				}
				const oldSongId = songId;
				songId = song._id;
				return userModel.findOne({ _id: session.userId }, (err, user) => {
					if (user.disliked.indexOf(songId) !== -1)
						return cb({
							status: "failure",
							message: "You have already disliked this song."
						});

					return userModel.updateOne(
						{ _id: session.userId },
						{
							$push: { disliked: songId },
							$pull: { liked: songId }
						},
						err => {
							if (!err) {
								return userModel.countDocuments({ liked: songId }, (err, likes) => {
									if (err)
										return cb({
											status: "failure",
											message: "Something went wrong while disliking this song."
										});

									return userModel.countDocuments({ disliked: songId }, (err, dislikes) => {
										if (err)
											return cb({
												status: "failure",
												message: "Something went wrong while disliking this song."
											});

										return songModel.update(
											{ _id: songId },
											{
												$set: {
													likes,
													dislikes
												}
											},
											err => {
												if (err)
													return cb({
														status: "failure",
														message: "Something went wrong while disliking this song."
													});

												SongsModule.runJob("UPDATE_SONG", { songId });
												CacheModule.runJob("PUB", {
													channel: "song.dislike",
													value: JSON.stringify({
														songId: oldSongId,
														userId: session.userId,
														likes,
														dislikes
													})
												});

												return cb({
													status: "success",
													message: "You have successfully disliked this song."
												});
											}
										);
									});
								});
							}
							return cb({
								status: "failure",
								message: "Something went wrong while disliking this song."
							});
						}
					);
				});
			}
		);
	}),

	/**
	 * Undislikes a song
	 *
	 * @param session
	 * @param songId - the song id
	 * @param cb
	 */
	undislike: isLoginRequired(async (session, songId, cb) => {
		const userModel = await DBModule.runJob("GET_MODEL", { modelName: "user" });
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" });
		async.waterfall(
			[
				next => {
					songModel.findOne({ songId }, next);
				},

				(song, next) => {
					if (!song) return next("No song found with that id.");
					return next(null, song);
				}
			],
			async (err, song) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err });
					console.log(
						"ERROR",
						"SONGS_UNDISLIKE",
						`User "${session.userId}" failed to like song ${songId}. "${err}"`
					);
					return cb({ status: "failure", message: err });
				}
				const oldSongId = songId;
				songId = song._id;
				return userModel.findOne({ _id: session.userId }, (err, user) => {
					if (user.disliked.indexOf(songId) === -1)
						return cb({
							status: "failure",
							message: "You have not disliked this song."
						});

					return userModel.updateOne(
						{ _id: session.userId },
						{ $pull: { liked: songId, disliked: songId } },
						err => {
							if (!err) {
								return userModel.countDocuments({ liked: songId }, (err, likes) => {
									if (err)
										return cb({
											status: "failure",
											message: "Something went wrong while undisliking this song."
										});

									return userModel.countDocuments({ disliked: songId }, (err, dislikes) => {
										if (err)
											return cb({
												status: "failure",
												message: "Something went wrong while undisliking this song."
											});

										return songModel.update(
											{ _id: songId },
											{
												$set: {
													likes,
													dislikes
												}
											},
											err => {
												if (err)
													return cb({
														status: "failure",
														message: "Something went wrong while undisliking this song."
													});
												SongsModule.runJob("UPDATE_SONG", { songId });
												CacheModule.runJob("PUB", {
													channel: "song.undislike",
													value: JSON.stringify({
														songId: oldSongId,
														userId: session.userId,
														likes,
														dislikes
													})
												});
												return cb({
													status: "success",
													message: "You have successfully undisliked this song."
												});
											}
										);
									});
								});
							}
							return cb({
								status: "failure",
								message: "Something went wrong while undisliking this song."
							});
						}
					);
				});
			}
		);
	}),

	/**
	 * Unlikes a song
	 *
	 * @param session
	 * @param songId - the song id
	 * @param cb
	 */
	unlike: isLoginRequired(async (session, songId, cb) => {
		const userModel = await DBModule.runJob("GET_MODEL", { modelName: "user" });
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" });
		async.waterfall(
			[
				next => {
					songModel.findOne({ songId }, next);
				},

				(song, next) => {
					if (!song) return next("No song found with that id.");
					return next(null, song);
				}
			],
			async (err, song) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err });
					console.log(
						"ERROR",
						"SONGS_UNLIKE",
						`User "${session.userId}" failed to like song ${songId}. "${err}"`
					);
					return cb({ status: "failure", message: err });
				}
				const oldSongId = songId;
				songId = song._id;
				return userModel.findOne({ _id: session.userId }, (err, user) => {
					if (user.liked.indexOf(songId) === -1)
						return cb({
							status: "failure",
							message: "You have not liked this song."
						});

					return userModel.updateOne(
						{ _id: session.userId },
						{ $pull: { liked: songId, disliked: songId } },
						err => {
							if (!err) {
								return userModel.countDocuments({ liked: songId }, (err, likes) => {
									if (err)
										return cb({
											status: "failure",
											message: "Something went wrong while unliking this song."
										});

									return userModel.countDocuments({ disliked: songId }, (err, dislikes) => {
										if (err)
											return cb({
												status: "failure",
												message: "Something went wrong while undiking this song."
											});
										return songModel.updateOne(
											{ _id: songId },
											{
												$set: {
													likes,
													dislikes
												}
											},
											err => {
												if (err)
													return cb({
														status: "failure",
														message: "Something went wrong while unliking this song."
													});
												SongsModule.runJob("UPDATE_SONG", { songId });
												CacheModule.runJob("PUB", {
													channel: "song.unlike",
													value: JSON.stringify({
														songId: oldSongId,
														userId: session.userId,
														likes,
														dislikes
													})
												});
												return cb({
													status: "success",
													message: "You have successfully unliked this song."
												});
											}
										);
									});
								});
							}
							return cb({
								status: "failure",
								message: "Something went wrong while unliking this song."
							});
						}
					);
				});
			}
		);
	}),

	/**
	 * Gets user's own song ratings
	 *
	 * @param session
	 * @param songId - the song id
	 * @param cb
	 */
	getOwnSongRatings: isLoginRequired(async (session, songId, cb) => {
		const userModel = await DBModule.runJob("GET_MODEL", { modelName: "user" });
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" });
		async.waterfall(
			[
				next => {
					songModel.findOne({ songId }, next);
				},

				(song, next) => {
					if (!song) return next("No song found with that id.");
					return next(null, song);
				}
			],
			async (err, song) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err });
					console.log(
						"ERROR",
						"SONGS_GET_OWN_RATINGS",
						`User "${session.userId}" failed to get ratings for ${songId}. "${err}"`
					);
					return cb({ status: "failure", message: err });
				}
				const newSongId = song._id;
				return userModel.findOne({ _id: session.userId }, async (err, user) => {
					if (!err && user) {
						return cb({
							status: "success",
							songId,
							liked: user.liked.indexOf(newSongId) !== -1,
							disliked: user.disliked.indexOf(newSongId) !== -1
						});
					}
					return cb({
						status: "failure",
						message: await UtilsModule.runJob("GET_ERROR", {
							error: err
						})
					});
				});
			}
		);
	})
};
