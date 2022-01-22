/* eslint no-param-reassign: 0 */

export default {
	namespaced: true,
	state: {
		songIds: [],
		songPrefillData: {}
	},
	getters: {},
	actions: {
		editSongs: ({ commit }, songs) => commit("editSongs", songs),
		resetSongs: ({ commit }) => commit("resetSongs")
	},
	mutations: {
		editSongs(state, songs) {
			state.songIds = songs.map(song => song.songId);
			state.songPrefillData = Object.fromEntries(
				songs.map(song => [
					song.songId,
					song.prefill ? song.prefill : {}
				])
			);
		},
		resetSongs(state) {
			state.songIds = [];
			state.songPrefillData = {};
		}
	}
};
