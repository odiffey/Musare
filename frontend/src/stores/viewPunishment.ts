import { defineStore } from "pinia";

export const useViewPunishmentStore = props => {
	const { modalUuid } = props;
	if (!modalUuid) return null;
	return defineStore(`viewPunishment-${modalUuid}`, {
		state: () => ({
			punishmentId: null,
			punishment: {
				_id: null
			}
		}),
		actions: {
			init({ punishmentId }) {
				this.punishmentId = punishmentId;
			},
			viewPunishment(punishment) {
				this.punishment = punishment;
			},
			deactivatePunishment() {
				this.punishment.active = false;
			}
		}
	})();
};
