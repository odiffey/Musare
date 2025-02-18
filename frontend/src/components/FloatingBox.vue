<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from "vue";
import { useDragBox } from "@/composables/useDragBox";

const props = defineProps({
	id: { type: String, default: null },
	column: { type: Boolean, default: true },
	title: { type: String, default: null },
	persist: { type: Boolean, default: false },
	initial: { type: String, default: "align-top" },
	minWidth: { type: Number, default: 100 },
	maxWidth: { type: Number, default: 1000 },
	minHeight: { type: Number, default: 100 },
	maxHeight: { type: Number, default: 1000 }
});

const {
	dragBox,
	setInitialBox,
	onDragBox,
	resetBoxPosition,
	setOnDragBoxUpdate
} = useDragBox();
const debounceTimeout = ref();
const shown = ref(false);
const box = ref();

const saveBox = () => {
	if (props.id === null) return;
	localStorage.setItem(
		`box:${props.id}`,
		JSON.stringify({
			height: dragBox.value.height,
			width: dragBox.value.width,
			top: dragBox.value.top,
			left: dragBox.value.left,
			shown: shown.value
		})
	);
	setInitialBox({
		top:
			props.initial === "align-bottom"
				? Math.max(
						document.body.clientHeight - 10 - dragBox.value.height,
						0
				  )
				: 10,
		left: 10
	});
};

const setBoxDimensions = (width, height) => {
	dragBox.value.height = Math.min(
		Math.max(height, props.minHeight),
		props.maxHeight,
		document.body.clientHeight
	);
	dragBox.value.width = Math.min(
		Math.max(width, props.minWidth),
		props.maxWidth,
		document.body.clientWidth
	);
};

const onResizeBox = e => {
	if (e.target !== box.value) return;

	document.onmouseup = () => {
		document.onmouseup = null;
		const { width, height } = e.target.style;
		setBoxDimensions(
			width
				.split("")
				.splice(0, width.length - 2)
				.join(""),
			height
				.split("")
				.splice(0, height.length - 2)
				.join("")
		);
		saveBox();
	};
};

const toggleBox = () => {
	shown.value = !shown.value;
	saveBox();
};

const resetBox = () => {
	resetBoxPosition();
	setBoxDimensions(200, 200);
	saveBox();
};

const onWindowResize = () => {
	if (debounceTimeout.value) clearTimeout(debounceTimeout.value);

	debounceTimeout.value = setTimeout(() => {
		const { width, height } = dragBox.value;
		setBoxDimensions(width + 0, height + 0);
		saveBox();
	}, 50);
};

const onDragBoxUpdate = () => {
	onWindowResize();
};

setOnDragBoxUpdate(onDragBoxUpdate);

onMounted(async () => {
	let initial = {
		top: 10,
		left: 10,
		width: 200,
		height: 400
	};
	if (props.id !== null && localStorage[`box:${props.id}`]) {
		const json = JSON.parse(localStorage.getItem(`box:${props.id}`));
		initial = { ...initial, ...json };
		shown.value = json.shown;
	} else {
		initial.top =
			props.initial === "align-bottom"
				? Math.max(document.body.clientHeight - 10 - initial.height, 0)
				: 10;
	}
	setInitialBox(initial, true);

	await nextTick();

	onWindowResize();
	window.addEventListener("resize", onWindowResize);
});

onUnmounted(() => {
	window.removeEventListener("resize", onWindowResize);
	if (debounceTimeout.value) clearTimeout(debounceTimeout.value);
});

defineExpose({
	resetBox,
	toggleBox
});
</script>

<template>
	<div
		ref="box"
		:class="{
			'floating-box': true,
			column
		}"
		:id="id"
		v-if="persist || shown"
		:style="{
			width: dragBox.width + 'px',
			height: dragBox.height + 'px',
			top: dragBox.top + 'px',
			left: dragBox.left + 'px'
		}"
		@mousedown.left="onResizeBox"
	>
		<div class="box-header item-draggable" @mousedown.left="onDragBox">
			<span class="drag material-icons" @dblclick="resetBox()"
				>drag_indicator</span
			>
			<span v-if="title" class="box-title" :title="title">{{
				title
			}}</span>
			<span
				v-if="!persist"
				class="delete material-icons"
				@click="toggleBox()"
				>highlight_off</span
			>
		</div>
		<div class="box-body">
			<slot name="body"></slot>
		</div>
	</div>
</template>

<style lang="less" scoped>
.night-mode .floating-box {
	background-color: var(--dark-grey-2) !important;
	border: 0 !important;
	.box-body b {
		color: var(--light-grey-2) !important;
	}
}

.floating-box {
	display: flex;
	flex-direction: column;
	background-color: var(--white);
	color: var(--black);
	position: fixed;
	z-index: 10000000;
	resize: both;
	overflow: auto;
	border: 1px solid var(--light-grey-2);
	border-radius: @border-radius;
	padding: 0;

	.box-header {
		display: flex;
		height: 30px;
		width: 100%;
		background-color: var(--primary-color);
		color: var(--white);
		z-index: 100000001;

		.box-title {
			font-size: 16px;
			font-weight: 600;
			line-height: 30px;
			margin-right: 5px;
			text-overflow: ellipsis;
			white-space: nowrap;
			overflow: hidden;
		}

		.material-icons {
			font-size: 20px;
			line-height: 30px;

			&:hover,
			&:focus {
				filter: brightness(90%);
			}

			&.drag {
				margin: 0 5px;
			}

			&.delete {
				margin: 0 5px 0 auto;
				cursor: pointer;
			}
		}
	}

	.box-body {
		display: flex;
		flex-wrap: wrap;
		padding: 10px;
		height: calc(100% - 30px); /* 30px is the height of the box-header */
		overflow: auto;

		span {
			padding: 3px 6px;
		}
	}

	&.column .box-body {
		flex-flow: column;
		span {
			flex: 1;
			display: block;
		}
	}
}
</style>
