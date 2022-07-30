import { defineStore } from "pinia";

// TODO fix/decide eslint rule properly
// eslint-disable-next-line
export const useConfirmStore = props => {
	const { modalUuid } = props;
	return defineStore(`confirm-${modalUuid}`, {
		state: () => ({
			message: "",
			onCompleted: null,
			action: null,
			params: null
		}),
		actions: {
			init({ message, onCompleted, action, params }) {
				this.message = message;
				this.onCompleted = onCompleted;
				this.action = action;
				this.params = params;
			},
			confirm() {
				this.onCompleted({
					action: this.action,
					params: this.params
				});
			}
		}
	})();
};