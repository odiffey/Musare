/* eslint no-param-reassign: 0 */

// import Vue from "vue";
// import admin from "@/api/admin/index";

export default {
	namespaced: true,
	state: {
		discogsAlbum: {
			// album: {
			// 	genres: [],
			// 	artists: [],
			// 	artistIds: []
			// },
			// tracks: []
		},
		originalPlaylistSongs: [],
		playlistSongs: [],
		editingSongs: false,
		discogsTab: "search",
		prefillDiscogs: false
	},
	getters: {},
	actions: {
		showDiscogsTab: ({ commit }, tab) => commit("showDiscogsTab", tab),
		selectDiscogsAlbum: ({ commit }, discogsAlbum) =>
			commit("selectDiscogsAlbum", discogsAlbum),
		toggleDiscogsAlbum: ({ commit }) => {
			commit("toggleDiscogsAlbum");
		},
		setPlaylistSongs: ({ commit }, playlistSongs) =>
			commit("setPlaylistSongs", playlistSongs),
		updatePlaylistSongs: ({ commit }, playlistSongs) =>
			commit("updatePlaylistSongs", playlistSongs),
		updateEditingSongs: ({ commit }, editingSongs) =>
			commit("updateEditingSongs", editingSongs),
		resetPlaylistSongs: ({ commit }) => commit("resetPlaylistSongs"),
		togglePrefillDiscogs: ({ commit }) => commit("togglePrefillDiscogs")
	},
	mutations: {
		showDiscogsTab(state, tab) {
			state.discogsTab = tab;
		},
		selectDiscogsAlbum(state, discogsAlbum) {
			state.discogsAlbum = JSON.parse(JSON.stringify(discogsAlbum));
			if (state.discogsAlbum && state.discogsAlbum.tracks) {
				state.tracks = state.discogsAlbum.tracks.map(track => ({
					...track,
					songs: []
				}));
			}
		},
		toggleDiscogsAlbum(state) {
			state.discogsAlbum.expanded = !state.discogsAlbum.expanded;
		},
		setPlaylistSongs(state, playlistSongs) {
			state.originalPlaylistSongs = JSON.parse(
				JSON.stringify(playlistSongs)
			);
			state.playlistSongs = JSON.parse(JSON.stringify(playlistSongs));
		},
		updatePlaylistSongs(state, playlistSongs) {
			state.playlistSongs = JSON.parse(JSON.stringify(playlistSongs));
		},
		updateEditingSongs(state, editingSongs) {
			state.editingSongs = editingSongs;
		},
		resetPlaylistSongs(state) {
			state.playlistSongs = JSON.parse(
				JSON.stringify(state.originalPlaylistSongs)
			);
		},
		togglePrefillDiscogs(state) {
			state.prefillDiscogs = !state.prefillDiscogs;
		}
	}
};
