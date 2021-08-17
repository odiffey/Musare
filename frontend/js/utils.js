export default {
	guid: () => {
		[1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1]
			.map(b =>
				b
					? Math.floor((1 + Math.random()) * 0x10000)
							.toString(16)
							.substring(1)
					: "-"
			)
			.join("");
	},
	formatTime: originalDuration => {
		if (originalDuration) {
			if (originalDuration < 0) return "0:00";

			let duration = originalDuration;
			let hours = Math.floor(duration / (60 * 60));
			duration -= hours * 60 * 60;
			let minutes = Math.floor(duration / 60);
			duration -= minutes * 60;
			let seconds = Math.floor(duration);

			if (hours === 0) {
				hours = "";
			}

			if (hours > 0) {
				if (minutes < 10) minutes = `0${minutes}`;
			}

			if (seconds < 10) {
				seconds = `0${seconds}`;
			}

			return `${hours}${hours ? ":" : ""}${minutes}:${seconds}`;
		}
		return false;
	},
	formatTimeLong: duration => {
		if (duration <= 0) return "0 seconds";

		const hours = Math.floor(duration / (60 * 60));
		const formatHours = () => {
			if (hours > 0) {
				if (hours > 1) return `${hours} hours `;
				return `${hours} hour `;
			}
			return "";
		};

		const minutes = Math.floor((duration - hours * 60 * 60) / 60);
		const formatMinutes = () => {
			if (minutes > 0) {
				if (minutes > 1) return `${minutes} minutes `;
				return `${minutes} minute `;
			}
			return "";
		};

		const seconds = Math.floor(duration - hours * 60 * 60 - minutes * 60);
		const formatSeconds = () => {
			if (seconds > 0) {
				if (seconds > 1) return `${seconds} seconds `;
				return `${seconds} second `;
			}
			return "";
		};

		return formatHours() + formatMinutes() + formatSeconds();
	}
};
