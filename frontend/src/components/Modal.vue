<script setup lang="ts">
import { defineAsyncComponent, ref, onMounted } from "vue";
import { useModalsStore } from "@/stores/modals";

const ChristmasLights = defineAsyncComponent(
	() => import("@/components/ChristmasLights.vue")
);

defineProps({
	title: { type: String, default: "Modal" },
	size: { type: String, default: null },
	split: { type: Boolean, default: false }
});

const christmas = ref(false);

const { closeCurrentModal } = useModalsStore();

onMounted(async () => {
	christmas.value = await lofig.get("siteSettings.christmas");
});
</script>

<template>
	<div class="modal is-active">
		<div class="modal-background" @click="closeCurrentModal()" />
		<slot name="sidebar" />
		<div
			:class="{
				'modal-card': true,
				'modal-slim': size === 'slim',
				'modal-wide': size === 'wide',
				'modal-split': split
			}"
		>
			<header class="modal-card-head">
				<slot name="toggleMobileSidebar" />
				<h2 class="modal-card-title is-marginless">
					{{ title }}
				</h2>
				<span class="delete material-icons" @click="closeCurrentModal()"
					>highlight_off</span
				>
				<Transition>
					<christmas-lights v-if="christmas" small :lights="5" />
				</Transition>
			</header>
			<section class="modal-card-body">
				<slot name="body" />
			</section>
			<footer
				:class="{
					'modal-card-foot': true,
					blank: $slots['footer'] == null
				}"
			>
				<slot name="footer" />
			</footer>
		</div>
	</div>
</template>

<style lang="less">
.night-mode .modal .modal-card {
	.modal-card-head,
	.modal-card-foot {
		background-color: var(--dark-grey-3);
		border: none;
	}

	.modal-card-body {
		background-color: var(--dark-grey-4) !important;
	}

	.modal-card-head .delete.material-icons,
	.modal-card-title {
		color: var(--white);
	}

	p,
	label,
	td,
	th {
		color: var(--light-grey-2) !important;
	}

	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		color: var(--white) !important;
	}
}

.modal {
	display: flex;
	position: fixed;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	z-index: 1984;
	justify-content: center;
	align-items: center;

	.modal-background {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: rgba(10, 10, 10, 0.85);
	}

	.modal-card {
		display: flex;
		flex-direction: column;
		position: relative;
		width: 800px;
		max-width: calc(100% - 40px);
		max-height: calc(100vh - 40px);
		overflow: visible;
		margin: 0;
		font-size: 16px;

		&.modal-slim {
			width: 640px;
		}

		&.modal-wide {
			width: 1300px;
		}

		&.modal-split {
			height: 100%;

			.modal-card-body {
				display: flex;
				flex-wrap: wrap;
				height: 100%;
				row-gap: 24px;

				.left-section,
				.right-section {
					flex-basis: 50%;
					max-height: 100%;
					overflow-y: auto;
					flex-grow: 1;

					.section {
						display: flex;
						flex-direction: column;
						flex-grow: 1;
						width: auto;
						padding: 15px !important;
						margin: 0 10px;
					}

					@media screen and (max-width: 1100px) {
						flex-basis: 100%;
						max-height: unset;
					}
				}
			}
		}

		.modal-card-head,
		.modal-card-foot {
			display: flex;
			flex-shrink: 0;
			position: relative;
			justify-content: flex-start;
			align-items: center;
			padding: 20px;
			background-color: var(--light-grey);
		}

		.modal-card-head {
			border-bottom: 1px solid var(--light-grey-2);
			border-radius: @border-radius @border-radius 0 0;

			.modal-card-title {
				display: flex;
				flex: 1;
				margin: 0;
				font-size: 26px;
				font-weight: 600;
			}

			.delete.material-icons {
				font-size: 28px;
				cursor: pointer;
				user-select: none;
				-webkit-user-drag: none;
				&:hover,
				&:focus {
					filter: brightness(90%);
				}
			}
		}

		.modal-card-foot {
			border-top: 1px solid var(--light-grey-2);
			border-radius: 0 0 @border-radius @border-radius;
			overflow-x: auto;
			column-gap: 16px;

			& > div {
				display: flex;
				flex-grow: 1;
				column-gap: 16px;
			}

			.right {
				display: flex;
				margin-left: auto;
				margin-right: 0;
				justify-content: flex-end;
				column-gap: 16px;
			}

			&.blank {
				padding: 10px;
			}
		}

		.modal-card-body {
			flex: 1;
			flex-wrap: wrap;
			padding: 20px;
			overflow: auto;
			background-color: var(--white);
		}

		@media screen and (max-width: 650px) {
			max-height: 100vh;
			height: 100%;
			max-width: 100%;
			.modal-card-head,
			.modal-card-foot {
				border-radius: 0;
			}
		}
	}
}

.christmas-mode .modal .modal-card-head .christmas-lights {
	top: 69px !important;
}
</style>
