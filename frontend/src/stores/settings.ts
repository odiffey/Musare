/* eslint no-param-reassign: 0 */

import { defineStore } from "pinia";

// TODO fix/decide eslint rule properly
// eslint-disable-next-line
export const useSettingsStore = defineStore("settings", {
	state: () => ({
		originalUser: {},
		modifiedUser: {}
	}),
	actions: {
		updateOriginalUser(payload) {
			const { property, value } = payload;

			property.split(".").reduce(
				// eslint-disable-next-line no-return-assign
				(o, p, i) =>
					(o[p] =
						// eslint-disable-next-line no-plusplus
						property.split(".").length === ++i
							? JSON.parse(JSON.stringify(value))
							: o[p] || {}),
				this.originalUser
			);
		},
		setUser(user) {
			this.originalUser = user;
			this.modifiedUser = JSON.parse(JSON.stringify(user));
		}
	},
	getters: {
		isGithubLinked: state => state.originalUser.github,
		isPasswordLinked: state => state.originalUser.password
	}
});