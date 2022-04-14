/* eslint no-param-reassign: 0 */

const state = {
	station: {},
	autoRequest: [],
	autoRequestLock: false,
	editing: {},
	userCount: 0,
	users: {
		loggedIn: [],
		loggedOut: []
	},
	currentSong: {},
	previousSong: null,
	nextSong: null,
	songsList: [],
	stationPaused: true,
	localPaused: false,
	noSong: true,
	autofill: [],
	blacklist: []
};

const getters = {};

const actions = {
	joinStation: ({ commit }, station) => {
		commit("joinStation", station);
	},
	leaveStation: ({ commit }, station) => {
		commit("leaveStation", station);
	},
	editStation: ({ commit }, station) => {
		commit("editStation", station);
	},
	updateStation: ({ commit }, station) => {
		commit("updateStation", station);
	},
	updateUserCount: ({ commit }, userCount) => {
		commit("updateUserCount", userCount);
	},
	updateUsers: ({ commit }, users) => {
		commit("updateUsers", users);
	},
	updateCurrentSong: ({ commit }, currentSong) => {
		commit("updateCurrentSong", currentSong);
	},
	updatePreviousSong: ({ commit }, previousSong) => {
		commit("updatePreviousSong", previousSong);
	},
	updateNextSong: ({ commit }, nextSong) => {
		commit("updateNextSong", nextSong);
	},
	updateSongsList: ({ commit }, songsList) => {
		commit("updateSongsList", songsList);
	},
	repositionSongInList: ({ commit }, song) => {
		commit("repositionSongInList", song);
	},
	updateStationPaused: ({ commit }, stationPaused) => {
		commit("updateStationPaused", stationPaused);
	},
	updateLocalPaused: ({ commit }, localPaused) => {
		commit("updateLocalPaused", localPaused);
	},
	updateNoSong: ({ commit }, noSong) => {
		commit("updateNoSong", noSong);
	},
	updateAutoRequest: ({ commit }, playlists) => {
		commit("updateAutoRequest", playlists);
	},
	updateAutoRequestLock: ({ commit }, lock) => {
		commit("updateAutoRequestLock", lock);
	},
	updateIfStationIsFavorited: ({ commit }, { isFavorited }) => {
		commit("updateIfStationIsFavorited", isFavorited);
	},
	setAutofillPlaylists: ({ commit }, autofillPlaylists) => {
		commit("setAutofillPlaylists", autofillPlaylists);
	},
	setBlacklist: ({ commit }, blacklist) => {
		commit("setBlacklist", blacklist);
	},
	updateCurrentSongRatings: ({ commit }, songRatings) => {
		commit("updateCurrentSongRatings", songRatings);
	},
	updateOwnCurrentSongRatings: ({ commit }, ownSongRatings) => {
		commit("updateOwnCurrentSongRatings", ownSongRatings);
	},
	updateCurrentSongSkipVotes: (
		{ commit },
		{ skipVotes, skipVotesCurrent }
	) => {
		commit("updateCurrentSongSkipVotes", { skipVotes, skipVotesCurrent });
	},
	addPlaylistToAutoRequest: ({ commit }, playlist) => {
		commit("addPlaylistToAutoRequest", playlist);
	},
	removePlaylistFromAutoRequest: ({ commit }, playlistId) => {
		commit("removePlaylistFromAutoRequest", playlistId);
	}
};

const mutations = {
	joinStation(state, station) {
		state.station = { ...station };
	},
	leaveStation(state) {
		state.station = {};
		state.autoRequest = [];
		state.autoRequestLock = false;
		state.editing = {};
		state.userCount = 0;
		state.users = {
			loggedIn: [],
			loggedOut: []
		};
		state.currentSong = {};
		state.previousSong = null;
		state.nextSong = null;
		state.songsList = [];
		state.stationPaused = true;
		state.localPaused = false;
		state.noSong = true;
		state.autofill = [];
		state.blacklist = [];
	},
	editStation(state, station) {
		state.editing = { ...station };
	},
	updateStation(state, station) {
		state.station = { ...state.station, ...station };
	},
	updateUserCount(state, userCount) {
		state.userCount = userCount;
	},
	updateUsers(state, users) {
		state.users = users;
	},
	updateCurrentSong(state, currentSong) {
		state.currentSong = currentSong;
	},
	updatePreviousSong(state, previousSong) {
		state.previousSong = previousSong;
	},
	updateNextSong(state, nextSong) {
		state.nextSong = nextSong;
	},
	updateSongsList(state, songsList) {
		state.songsList = songsList;
	},
	repositionSongInList(state, song) {
		if (
			state.songsList[song.newIndex] &&
			state.songsList[song.newIndex].youtubeId === song.youtubeId
		)
			return;

		const { songsList } = state;

		songsList.splice(
			song.newIndex,
			0,
			songsList.splice(song.oldIndex, 1)[0]
		);

		state.songsList = songsList;
	},
	updateStationPaused(state, stationPaused) {
		state.stationPaused = stationPaused;
	},
	updateLocalPaused(state, localPaused) {
		state.localPaused = localPaused;
	},
	updateNoSong(state, noSong) {
		state.noSong = noSong;
	},
	updateAutoRequest(state, playlists) {
		state.autoRequest = playlists;
	},
	updateAutoRequestLock(state, lock) {
		state.autoRequestLock = lock;
	},
	updateIfStationIsFavorited(state, isFavorited) {
		state.station.isFavorited = isFavorited;
	},
	setAutofillPlaylists(state, autofillPlaylists) {
		state.autofill = JSON.parse(JSON.stringify(autofillPlaylists));
	},
	setBlacklist(state, blacklist) {
		state.blacklist = JSON.parse(JSON.stringify(blacklist));
	},
	updateCurrentSongRatings(state, songRatings) {
		state.currentSong.likes = songRatings.likes;
		state.currentSong.dislikes = songRatings.dislikes;
	},
	updateOwnCurrentSongRatings(state, ownSongRatings) {
		state.currentSong.liked = ownSongRatings.liked;
		state.currentSong.disliked = ownSongRatings.disliked;
	},
	updateCurrentSongSkipVotes(state, { skipVotes, skipVotesCurrent }) {
		state.currentSong.skipVotes = skipVotes;
		if (skipVotesCurrent !== null)
			state.currentSong.skipVotesCurrent = skipVotesCurrent;
	},
	addPlaylistToAutoRequest(state, playlist) {
		state.autoRequest.push(playlist);
	},
	removePlaylistFromAutoRequest(state, playlistId) {
		state.autoRequest.forEach((playlist, index) => {
			if (playlist._id === playlistId) {
				state.autoRequest.splice(index, 1);
			}
		});
	}
};

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations
};
