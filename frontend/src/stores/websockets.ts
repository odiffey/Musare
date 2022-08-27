import { defineStore } from "pinia";
import { CustomWebSocket } from "@/types/customWebSocket";

export const useWebsocketsStore = defineStore("websockets", {
	state: () => ({
		socket: <CustomWebSocket>{
			dispatcher: {}
		}
	}),
	actions: {
		createSocket(socket) {
			const { listeners } = this.socket.dispatcher;
			this.socket = socket;

			// only executes if the websocket object is being replaced
			if (listeners) {
				// for each listener type
				Object.keys(listeners).forEach(listenerType =>
					// for each callback previously present for the listener type
					listeners[listenerType].forEach(element => {
						// add the listener back after the websocket object is reset
						this.socket.dispatcher.addEventListener(
							listenerType,
							element.cb
						);
					})
				);
			}
		}
	},
	getters: {
		getSocket() {
			return this.socket;
		}
	}
});
