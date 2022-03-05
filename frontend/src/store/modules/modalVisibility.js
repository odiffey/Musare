/* eslint no-param-reassign: 0 */
import ws from "@/ws";

const state = {
	modals: {
		whatIsNew: false,
		manageStation: false,
		login: false,
		register: false,
		createStation: false,
		importPlaylist: false,
		editPlaylist: false,
		createPlaylist: false,
		report: false,
		removeAccount: false,
		editNews: false,
		editUser: false,
		editSong: false,
		editSongs: false,
		importAlbum: false,
		viewReport: false,
		viewPunishment: false,
		confirm: false,
		editSongConfirm: false,
		editSongsConfirm: false,
		bulkActions: false
	},
	currentlyActive: []
};

const getters = {};

const actions = {
	closeModal: ({ commit }, modal) => {
		if (modal === "register")
			lofig.get("recaptcha.enabled").then(enabled => {
				if (enabled) window.location.reload();
			});

		commit("closeModal", modal);
	},
	openModal: ({ commit }, modal) => {
		commit("openModal", modal);
	},
	closeCurrentModal: ({ commit }) => {
		commit("closeCurrentModal");
	}
};

const mutations = {
	closeModal(state, modal) {
		state.modals[modal] = false;
		const index = state.currentlyActive.indexOf(modal);
		if (index > -1) state.currentlyActive.splice(index, 1);
	},
	openModal(state, modal) {
		state.modals[modal] = true;
		state.currentlyActive.unshift(modal);
	},
	closeCurrentModal(state) {
		// remove any websocket listeners for the modal
		ws.destroyModalListeners(state.currentlyActive[0]);

		state.modals[state.currentlyActive[0]] = false;
		state.currentlyActive.shift();
	}
};

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations
};
