import config from "config";
import async from "async";
import axios from "axios";

import isLoginRequired from "../hooks/loginRequired";
import { hasPermission, useHasPermission } from "../hooks/hasPermission";

// eslint-disable-next-line
import moduleManager from "../../index";

const UtilsModule = moduleManager.modules.utils;
const WSModule = moduleManager.modules.ws;
const YouTubeModule = moduleManager.modules.youtube;

export default {
	/**
	 * Fetches a list of songs from Youtube's API
	 *
	 * @param {object} session - user session
	 * @param {string} query - the query we'll pass to youtubes api
	 * @param {Function} cb - callback
	 * @returns {{status: string, data: object}} - returns an object
	 */
	searchYoutube: isLoginRequired(function searchYoutube(session, query, cb) {
		return YouTubeModule.runJob("SEARCH", { query }, this)
			.then(data => {
				this.log("SUCCESS", "APIS_SEARCH_YOUTUBE", `Searching YouTube successful with query "${query}".`);
				return cb({ status: "success", data });
			})
			.catch(async err => {
				err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);
				this.log("ERROR", "APIS_SEARCH_YOUTUBE", `Searching youtube failed with query "${query}". "${err}"`);
				return cb({ status: "error", message: err });
			});
	}),

	/**
	 * Fetches a specific page of search results from Youtube's API
	 *
	 * @param {object} session - user session
	 * @param {string} query - the query we'll pass to youtubes api
	 * @param {string} pageToken - identifies a specific page in the result set that should be retrieved
	 * @param {Function} cb - callback
	 * @returns {{status: string, data: object}} - returns an object
	 */
	searchYoutubeForPage: isLoginRequired(function searchYoutubeForPage(session, query, pageToken, cb) {
		return YouTubeModule.runJob("SEARCH", { query, pageToken }, this)
			.then(data => {
				this.log(
					"SUCCESS",
					"APIS_SEARCH_YOUTUBE_FOR_PAGE",
					`Searching YouTube successful with query "${query}".`
				);
				return cb({ status: "success", data });
			})
			.catch(async err => {
				err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);
				this.log(
					"ERROR",
					"APIS_SEARCH_YOUTUBE_FOR_PAGE",
					`Searching youtube failed with query "${query}". "${err}"`
				);
				return cb({ status: "error", message: err });
			});
	}),

	/**
	 * Gets Discogs data
	 *
	 * @param session
	 * @param query - the query
	 * @param {Function} cb
	 */
	searchDiscogs: useHasPermission("apis.searchDiscogs", function searchDiscogs(session, query, page, cb) {
		async.waterfall(
			[
				next => {
					const options = {
						params: { q: query, per_page: 20, page },
						headers: {
							"User-Agent": "Request",
							Authorization: `Discogs key=${config.get("apis.discogs.client")}, secret=${config.get(
								"apis.discogs.secret"
							)}`
						}
					};

					axios
						.get("https://api.discogs.com/database/search", options)
						.then(res => next(null, res.data))
						.catch(err => next(err));
				}
			],
			async (err, body) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);
					this.log(
						"ERROR",
						"APIS_SEARCH_DISCOGS",
						`Searching discogs failed with query "${query}". "${err}"`
					);
					return cb({ status: "error", message: err });
				}
				this.log(
					"SUCCESS",
					"APIS_SEARCH_DISCOGS",
					`User "${session.userId}" searched Discogs succesfully for query "${query}".`
				);
				return cb({
					status: "success",
					data: {
						results: body.results,
						pages: body.pagination.pages
					}
				});
			}
		);
	}),

	/**
	 * Joins a room
	 *
	 * @param {object} session - user session
	 * @param {string} room - the room to join
	 * @param {Function} cb - callback
	 */
	joinRoom(session, room, cb) {
		const roomName = room.split(".")[0];
		// const roomId = room.split(".")[1];
		const rooms = {
			home: null,
			news: null,
			profile: null,
			"view-youtube-video": null,
			"manage-station": null,
			// "manage-station": "stations.view",
			"edit-song": "songs.update",
			"edit-songs": "songs.update",
			"import-album": "songs.update",
			// "edit-playlist": "playlists.update",
			"view-report": "reports.get",
			"edit-user": "users.update",
			"view-api-request": "youtube.getApiRequest",
			"view-punishment": "punishments.get"
		};
		const join = (status, error) => {
			if (status === "success")
				WSModule.runJob("SOCKET_JOIN_ROOM", {
					socketId: session.socketId,
					room
				})
					.then(() => cb({ status: "success", message: "Successfully joined room." }))
					.catch(err => join("error", err.message));
			else {
				this.log("ERROR", `Joining room failed: ${error}`);
				cb({ status: "error", message: error });
			}
		};
		if (rooms[roomName] === null) join("success");
		else if (rooms[roomName])
			hasPermission(rooms[roomName], session)
				.then(() => join("success"))
				.catch(err => join("error", err));
		else join("error", "Room not found");
	},

	/**
	 * Leaves a room
	 *
	 * @param {object} session - user session
	 * @param {string} room - the room to leave
	 * @param {Function} cb - callback
	 */
	leaveRoom(session, room, cb) {
		if (
			room === "home" ||
			room.startsWith("profile.") ||
			room.startsWith("manage-station.") ||
			room.startsWith("edit-song.") ||
			room.startsWith("view-report.") ||
			room === "import-album" ||
			room === "edit-songs"
		) {
			WSModule.runJob("SOCKET_LEAVE_ROOM", {
				socketId: session.socketId,
				room
			})
				.then(() => {})
				.catch(err => {
					this.log("ERROR", `Leaving room failed: ${err.message}`);
				});
		}

		cb({ status: "success", message: "Successfully left room." });
	},

	/**
	 * Joins an admin room
	 *
	 * @param {object} session - user session
	 * @param {string} page - the admin room to join
	 * @param {Function} cb - callback
	 */
	joinAdminRoom(session, page, cb) {
		if (
			page === "songs" ||
			page === "stations" ||
			page === "reports" ||
			page === "news" ||
			page === "playlists" ||
			page === "users" ||
			page === "statistics" ||
			page === "punishments" ||
			page === "youtube" ||
			page === "youtubeVideos" ||
			page === "import" ||
			page === "dataRequests"
		) {
			hasPermission(`admin.view.${page}`, session.userId)
				.then(() =>
					WSModule.runJob("SOCKET_LEAVE_ROOMS", { socketId: session.socketId }).then(() => {
						WSModule.runJob(
							"SOCKET_JOIN_ROOM",
							{
								socketId: session.socketId,
								room: `admin.${page}`
							},
							this
						).then(() => cb({ status: "success", message: "Successfully joined admin room." }));
					})
				)
				.catch(() => cb({ status: "error", message: "Failed to join admin room." }));
		}
	},

	/**
	 * Leaves all rooms
	 *
	 * @param {object} session - user session
	 * @param {Function} cb - callback
	 */
	leaveRooms(session, cb) {
		WSModule.runJob("SOCKET_LEAVE_ROOMS", { socketId: session.socketId });

		cb({ status: "success", message: "Successfully left all rooms." });
	},

	/**
	 * Returns current date
	 *
	 * @param {object} session - user session
	 * @param {Function} cb - callback
	 */
	ping(session, cb) {
		cb({ status: "success", message: "Successfully pinged.", data: { date: Date.now() } });
	}
};
