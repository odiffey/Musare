import { defineStore } from "pinia";

export const useWhatIsNewStore = props => {
	const { modalUuid } = props;
	return defineStore(`whatIsNew-${modalUuid}`, {
		state: () => ({
			news: null
		}),
		actions: {
			init({ news }) {
				this.news = news;
			}
		}
	})();
};