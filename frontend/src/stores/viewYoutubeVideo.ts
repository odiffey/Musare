import { defineStore } from "pinia";

export const useViewYoutubeVideoStore = props => {
	const { modalUuid } = props;
	if (!modalUuid) return null;
	return defineStore(`viewYoutubeVideo-${modalUuid}`, {
		state: () => ({
			videoId: null,
			youtubeId: null,
			video: {
				_id: null,
				youtubeId: null,
				title: null,
				author: null,
				duration: 0
			},
			player: {
				error: false,
				errorMessage: "",
				player: null,
				paused: true,
				playerReady: false,
				autoPlayed: false,
				duration: "0.000",
				currentTime: 0,
				playbackRate: 1,
				videoNote: "",
				volume: 0,
				muted: false,
				showRateDropdown: false
			}
		}),
		actions: {
			init({ videoId, youtubeId }) {
				this.videoId = videoId;
				this.youtubeId = youtubeId;
			},
			viewYoutubeVideo(video) {
				this.videoId = this.videoId || video._id;
				this.youtubeId = video.youtubeId || video.youtubeId;
				this.video = video;
			},
			updatePlayer(player) {
				this.player = Object.assign(this.player, player);
			},
			stopVideo() {
				if (this.player.player && this.player.player.pauseVideo) {
					this.player.player.pauseVideo();
					this.player.player.seekTo(0);
				}
			},
			loadVideoById(id) {
				this.player.player.loadVideoById(id);
			},
			pauseVideo(status) {
				if (
					(this.player.player && this.player.player.pauseVideo) ||
					this.player.playVideo
				) {
					if (status) this.player.player.pauseVideo();
					else this.player.player.playVideo();
				}
				this.player.paused = status;
			},
			setPlaybackRate(rate) {
				if (rate) {
					this.player.playbackRate = rate;
					this.player.player.setPlaybackRate(rate);
				} else if (
					this.player.player.getPlaybackRate() !== undefined &&
					this.player.playbackRate !==
						this.player.player.getPlaybackRate()
				) {
					this.player.player.setPlaybackRate(
						this.player.playbackRate
					);
					this.player.playbackRate =
						this.player.player.getPlaybackRate();
				}
			}
		}
	})();
};
