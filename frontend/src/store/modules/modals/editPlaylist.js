/* eslint no-param-reassign: 0 */

export default {
	namespaced: true,
	state: {
		playlistId: null,
		tab: "settings",
		playlist: { songs: [] }
	},
	getters: {},
	actions: {
		init: ({ commit }, data) => commit("init", data),
		showTab: ({ commit }, tab) => commit("showTab", tab),
		setPlaylist: ({ commit }, playlist) => commit("setPlaylist", playlist),
		clearPlaylist: ({ commit }) => commit("clearPlaylist"),
		addSong: ({ commit }, song) => commit("addSong", song),
		removeSong: ({ commit }, youtubeId) => commit("removeSong", youtubeId),
		updatePlaylistSongs: ({ commit }, playlistSongs) =>
			commit("updatePlaylistSongs", playlistSongs),
		repositionedSong: ({ commit }, song) => commit("repositionedSong", song)
	},
	mutations: {
		init(state, { playlistId }) {
			state.playlistId = playlistId;
		},
		showTab(state, tab) {
			state.tab = tab;
		},
		setPlaylist(state, playlist) {
			state.playlist = { ...playlist };
			state.playlist.songs.sort((a, b) => a.position - b.position);
		},
		clearPlaylist(state) {
			state.playlist = { songs: [] };
		},
		addSong(state, song) {
			state.playlist.songs.push(song);
		},
		removeSong(state, youtubeId) {
			state.playlist.songs = state.playlist.songs.filter(
				song => song.youtubeId !== youtubeId
			);
		},
		updatePlaylistSongs(state, playlistSongs) {
			state.playlist.songs = playlistSongs;
		},
		repositionedSong(state, song) {
			if (
				state.playlist.songs[song.newIndex] &&
				state.playlist.songs[song.newIndex].youtubeId === song.youtubeId
			)
				return;

			state.playlist.songs.splice(
				song.newIndex,
				0,
				state.playlist.songs.splice(song.oldIndex, 1)[0]
			);
		}
	}
};
