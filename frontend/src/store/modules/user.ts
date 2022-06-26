/* eslint no-param-reassign: 0 */
/* eslint-disable import/no-cycle */

import validation from "@/validation";
import ws from "@/ws";
import auth from "@/api/auth";

const state = {};
const getters = {};
const actions = {};
const mutations = {};

const modules = {
	auth: {
		namespaced: true,
		state: {
			userIdMap: {},
			userIdRequested: {},
			pendingUserIdCallbacks: {},
			loggedIn: false,
			role: "",
			username: "",
			email: "",
			userId: "",
			banned: false,
			ban: {},
			gotData: false
		},
		actions: {
			/* eslint-disable-next-line no-unused-vars */
			register: ({ commit }, user) =>
				new Promise((resolve, reject) => {
					const { username, email, password } = user;

					if (!email || !username || !password)
						reject(new Error("Please fill in all fields"));
					else if (!validation.isLength(email, 3, 254))
						reject(
							new Error(
								"Email must have between 3 and 254 characters."
							)
						);
					else if (
						email.indexOf("@") !== email.lastIndexOf("@") ||
						!validation.regex.emailSimple.test(email)
					)
						reject(new Error("Invalid email format."));
					else if (!validation.isLength(username, 2, 32))
						reject(
							new Error(
								"Username must have between 2 and 32 characters."
							)
						);
					else if (!validation.regex.azAZ09_.test(username))
						reject(
							new Error(
								"Invalid username format. Allowed characters: a-z, A-Z, 0-9 and _."
							)
						);
					else if (username.replaceAll(/[_]/g, "").length === 0)
						reject(
							new Error(
								"Invalid username format. Allowed characters: a-z, A-Z, 0-9 and _, and there has to be at least one letter or number."
							)
						);
					else if (!validation.isLength(password, 6, 200))
						reject(
							new Error(
								"Password must have between 6 and 200 characters."
							)
						);
					else if (!validation.regex.password.test(password))
						reject(
							new Error(
								"Invalid password format. Must have one lowercase letter, one uppercase letter, one number and one special character."
							)
						);
					else
						auth.register(user)
							.then(res => resolve(res))
							.catch(err => reject(new Error(err.message)));
				}),
			/* eslint-disable-next-line no-unused-vars */
			login: ({ commit }, user) =>
				new Promise((resolve, reject) => {
					auth.login(user)
						.then(() => {
							lofig.get("cookie.SIDname").then(sid => {
								const bc = new BroadcastChannel(
									`${sid}.user_login`
								);
								bc.postMessage(true);
								bc.close();
							});
							resolve({
								status: "success",
								message: "Logged in!"
							});
						})
						.catch(err => reject(new Error(err.message)));
				}),
			logout: () =>
				new Promise<void>((resolve, reject) => {
					auth.logout()
						.then(() => resolve())
						.catch(() => reject());
				}),
			getBasicUser: ({ commit, state }, userId) =>
				new Promise(resolve => {
					if (typeof state.userIdMap[`Z${userId}`] !== "string") {
						if (state.userIdRequested[`Z${userId}`] !== true) {
							commit("requestingUserId", userId);
							ws.socket.dispatch(
								"users.getBasicUser",
								userId,
								res => {
									if (res.status === "success") {
										const user = res.data;

										commit("mapUserId", {
											userId,
											user: {
												name: user.name,
												username: user.username
											}
										});

										state.pendingUserIdCallbacks[
											`Z${userId}`
										].forEach(cb => cb(user));

										commit("clearPendingCallbacks", userId);

										return resolve(user);
									}
									return resolve(null);
								}
							);
						} else {
							commit("pendingUser", {
								userId,
								callback: user => resolve(user)
							});
						}
					} else {
						resolve(state.userIdMap[`Z${userId}`]);
					}
				}),
			authData: ({ commit }, data) => {
				commit("authData", data);
			},
			banUser: ({ commit }, ban) => {
				commit("banUser", ban);
			},
			updateUsername: ({ commit }, username) => {
				commit("updateUsername", username);
			}
		},
		mutations: {
			mapUserId(state, data) {
				state.userIdMap[`Z${data.userId}`] = data.user;
				state.userIdRequested[`Z${data.userId}`] = false;
			},
			requestingUserId(state, userId) {
				state.userIdRequested[`Z${userId}`] = true;
				if (!state.pendingUserIdCallbacks[`Z${userId}`])
					state.pendingUserIdCallbacks[`Z${userId}`] = [];
			},
			pendingUser(state, data) {
				state.pendingUserIdCallbacks[`Z${data.userId}`].push(
					data.callback
				);
			},
			clearPendingCallbacks(state, userId) {
				state.pendingUserIdCallbacks[`Z${userId}`] = [];
			},
			authData(state, data) {
				state.loggedIn = data.loggedIn;
				state.role = data.role;
				state.username = data.username;
				state.email = data.email;
				state.userId = data.userId;
				state.gotData = true;
			},
			banUser(state, ban) {
				state.banned = true;
				state.ban = ban;
			},
			updateUsername(state, username) {
				state.username = username;
			}
		}
	},
	playlists: {
		namespaced: true,
		state: {
			playlists: [],
			fetchedPlaylists: false
		},
		actions: {
			setPlaylists: ({ commit }, playlists) =>
				commit("setPlaylists", playlists),
			updatePlaylists: ({ commit }, playlists) =>
				commit("updatePlaylists", playlists),
			addPlaylist: ({ commit }, playlist) =>
				commit("addPlaylist", playlist),
			removePlaylist: ({ commit }, playlistId) =>
				commit("removePlaylist", playlistId)
		},
		mutations: {
			setPlaylists(state, playlists) {
				state.fetchedPlaylists = true;
				state.playlists = playlists;
			},
			updatePlaylists(state, playlists) {
				state.playlists = playlists;
			},
			addPlaylist(state, playlist) {
				state.playlists.push(playlist);
			},
			removePlaylist(state, playlistId) {
				state.playlists.forEach((playlist, index) => {
					if (playlist._id === playlistId)
						state.playlists.splice(index, 1);
				});
			}
		}
	},
	preferences: {
		namespaced: true,
		state: {
			nightmode: false,
			autoSkipDisliked: true,
			activityLogPublic: false,
			anonymousSongRequests: false,
			activityWatch: false
		},
		actions: {
			changeNightmode: ({ commit }, nightmode) => {
				commit("changeNightmode", nightmode);
			},
			changeAutoSkipDisliked: ({ commit }, autoSkipDisliked) => {
				commit("changeAutoSkipDisliked", autoSkipDisliked);
			},
			changeActivityLogPublic: ({ commit }, activityLogPublic) => {
				commit("changeActivityLogPublic", activityLogPublic);
			},
			changeAnonymousSongRequests: (
				{ commit },
				anonymousSongRequests
			) => {
				commit("changeAnonymousSongRequests", anonymousSongRequests);
			},
			changeActivityWatch: ({ commit }, activityWatch) => {
				commit("changeActivityWatch", activityWatch);
			}
		},
		mutations: {
			changeNightmode(state, nightmode) {
				state.nightmode = nightmode;
			},
			changeAutoSkipDisliked(state, autoSkipDisliked) {
				state.autoSkipDisliked = autoSkipDisliked;
			},
			changeActivityLogPublic(state, activityLogPublic) {
				state.activityLogPublic = activityLogPublic;
			},
			changeAnonymousSongRequests(state, anonymousSongRequests) {
				state.anonymousSongRequests = anonymousSongRequests;
			},
			changeActivityWatch(state, activityWatch) {
				state.activityWatch = activityWatch;
			}
		}
	}
};

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations,
	modules
};