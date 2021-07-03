/* eslint no-param-reassign: 0 */
/* eslint-disable import/no-cycle */

// import Vue from "vue";
import admin from "@/api/admin/index";

const Vue = {};

const state = {};
const getters = {};
const actions = {};
const mutations = {};

const modules = {
	hiddenSongs: {
		namespaced: true,
		state: {
			songs: []
		},
		getters: {},
		actions: {
			resetSongs: ({ commit }) => commit("resetSongs"),
			addSong: ({ commit }, song) => commit("addSong", song),
			removeSong: ({ commit }, songId) => commit("removeSong", songId),
			updateSong: ({ commit }, updatedSong) =>
				commit("updateSong", updatedSong)
		},
		mutations: {
			resetSongs(state) {
				state.songs = [];
			},
			addSong(state, song) {
				state.songs.push(song);
			},
			removeSong(state, songId) {
				state.songs = state.songs.filter(song => {
					return song._id !== songId;
				});
			},
			updateSong(state, updatedSong) {
				state.songs.forEach((song, index) => {
					if (song._id === updatedSong._id)
						Vue.set(state.songs, index, updatedSong);
				});
			}
		}
	},
	unverifiedSongs: {
		namespaced: true,
		state: {
			songs: []
		},
		getters: {},
		actions: {
			resetSongs: ({ commit }) => commit("resetSongs"),
			addSong: ({ commit }, song) => commit("addSong", song),
			removeSong: ({ commit }, songId) => commit("removeSong", songId),
			updateSong: ({ commit }, updatedSong) =>
				commit("updateSong", updatedSong)
		},
		mutations: {
			resetSongs(state) {
				state.songs = [];
			},
			addSong(state, song) {
				state.songs.push(song);
			},
			removeSong(state, songId) {
				state.songs = state.songs.filter(song => {
					return song._id !== songId;
				});
			},
			updateSong(state, updatedSong) {
				state.songs.forEach((song, index) => {
					if (song._id === updatedSong._id)
						Vue.set(state.songs, index, updatedSong);
				});
			}
		}
	},
	verifiedSongs: {
		namespaced: true,
		state: {
			songs: []
		},
		getters: {},
		actions: {
			resetSongs: ({ commit }) => commit("resetSongs"),
			addSong: ({ commit }, song) => commit("addSong", song),
			removeSong: ({ commit }, songId) => commit("removeSong", songId),
			updateSong: ({ commit }, updatedSong) =>
				commit("updateSong", updatedSong)
		},
		mutations: {
			resetSongs(state) {
				state.songs = [];
			},
			addSong(state, song) {
				state.songs.push(song);
			},
			removeSong(state, songId) {
				state.songs = state.songs.filter(song => {
					return song._id !== songId;
				});
			},
			updateSong(state, updatedSong) {
				state.songs.forEach((song, index) => {
					if (song._id === updatedSong._id)
						Vue.set(state.songs, index, updatedSong);
				});
			}
		}
	},
	stations: {
		namespaced: true,
		state: {
			stations: []
		},
		getters: {},
		actions: {
			loadStations: ({ commit }, stations) =>
				commit("loadStations", stations),
			stationRemoved: ({ commit }, stationId) =>
				commit("stationRemoved", stationId),
			stationAdded: ({ commit }, station) =>
				commit("stationAdded", station)
		},
		mutations: {
			loadStations(state, stations) {
				state.stations = stations;
			},
			stationAdded(state, station) {
				state.stations.push(station);
			},
			stationRemoved(state, stationId) {
				state.stations = state.stations.filter(station => {
					return station._id !== stationId;
				});
			}
		}
	},
	reports: {
		namespaced: true,
		state: {
			reports: []
		},
		getters: {},
		actions: {
			/* eslint-disable-next-line no-unused-vars */
			resolveReport: ({ commit }, reportId) => {
				return new Promise((resolve, reject) => {
					return admin.reports
						.resolve(reportId)
						.then(res => resolve(res))
						.catch(err => reject(new Error(err.message)));
				});
			},
			indexReports({ commit }, reports) {
				commit("indexReports", reports);
			}
		},
		mutations: {}
	},
	users: {
		namespaced: true,
		state: {},
		getters: {},
		actions: {},
		mutations: {}
	},
	news: {
		namespaced: true,
		state: {
			news: []
		},
		getters: {},
		actions: {
			setNews: ({ commit }, news) => commit("setNews", news),
			addNews: ({ commit }, news) => commit("addNews", news),
			removeNews: ({ commit }, newsId) => commit("removeNews", newsId),
			updateNews: ({ commit }, updatedNews) =>
				commit("updateNews", updatedNews)
		},
		mutations: {
			setNews(state, news) {
				state.news = news;
			},
			addNews(state, news) {
				state.news.push(news);
			},
			removeNews(state, newsId) {
				state.news = state.news.filter(news => {
					return news._id !== newsId;
				});
			},
			updateNews(state, updatedNews) {
				state.news.forEach((news, index) => {
					if (news._id === updatedNews._id)
						Vue.set(state.news, index, updatedNews);
				});
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
