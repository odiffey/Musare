<script setup lang="ts">
import { defineAsyncComponent, ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import Toast from "toasters";

import { useEditSongStore } from "@/stores/editSong";

import { useWebsocketsStore } from "@/stores/websockets";

const ReportInfoItem = defineAsyncComponent(
	() => import("@/components/ReportInfoItem.vue")
);

const props = defineProps({
	modalUuid: { type: String, required: true },
	modalModulePath: { type: String, default: "modals/editSong/MODAL_UUID" }
});

const editSongStore = useEditSongStore({ modalUuid: props.modalUuid });

const { socket } = useWebsocketsStore();

const tab = ref("sort-by-report");
const icons = ref({
	duration: "timer",
	video: "tv",
	thumbnail: "image",
	artists: "record_voice_over",
	title: "title",
	custom: "lightbulb"
});
const tabs = ref({});

const { reports } = storeToRefs(editSongStore);

const sortedByCategory = computed(() => {
	const categories = {};

	reports.value.forEach(report =>
		report.issues.forEach(issue => {
			if (categories[issue.category])
				categories[issue.category].push({
					...issue,
					reportId: report._id
				});
			else
				categories[issue.category] = [
					{ ...issue, reportId: report._id }
				];
		})
	);

	return categories;
});

const { resolveReport } = editSongStore;

const showTab = _tab => {
	tabs.value[`${_tab}-tab`].scrollIntoView({ block: "nearest" });
	tab.value = _tab;
};

const resolve = reportId => {
	socket.dispatch("reports.resolve", reportId, res => new Toast(res.message));
};

const toggleIssue = (reportId, issueId) => {
	socket.dispatch("reports.toggleIssue", reportId, issueId, res => {
		if (res.status !== "success") new Toast(res.message);
	});
};

onMounted(() => {
	socket.on(
		"event:admin.report.created",
		res => reports.value.unshift(res.data.report),
		{ modalUuid: props.modalUuid }
	);

	socket.on(
		"event:admin.report.resolved",
		res => resolveReport(res.data.reportId),
		{ modalUuid: props.modalUuid }
	);

	socket.on(
		"event:admin.report.issue.toggled",
		res => {
			reports.value.forEach((report, index) => {
				if (report._id === res.data.reportId) {
					const issue = reports.value[index].issues.find(
						issue => issue._id.toString() === res.data.issueId
					);

					issue.resolved = res.data.resolved;
				}
			});
		},
		{ modalUuid: props.modalUuid }
	);
});
</script>

<template>
	<div class="reports-tab tabs-container">
		<div class="tab-selection">
			<button
				class="button is-default"
				:ref="el => (tabs['sort-by-report-tab'] = el)"
				:class="{ selected: tab === 'sort-by-report' }"
				@click="showTab('sort-by-report')"
			>
				Sort by Report
			</button>
			<button
				class="button is-default"
				:ref="el => (tabs['sort-by-category-tab'] = el)"
				:class="{ selected: tab === 'sort-by-category' }"
				@click="showTab('sort-by-category')"
			>
				Sort by Category
			</button>
		</div>

		<div class="tab" v-if="tab === 'sort-by-category'">
			<div class="report-items" v-if="reports.length > 0">
				<div
					class="report-item"
					v-for="(issues, category) in sortedByCategory"
					:key="category"
				>
					<div class="report-item-header universal-item">
						<i
							class="material-icons"
							:content="category"
							v-tippy="{ theme: 'info' }"
						>
							{{ icons[category] }}
						</i>

						<p>{{ category }} Issues</p>
					</div>
					<div class="report-sub-items">
						<div
							class="report-sub-item report-sub-item-unresolved"
							:class="[
								'report',
								issue.resolved
									? 'report-sub-item-resolved'
									: 'report-sub-item-unresolved'
							]"
							v-for="(issue, issueIndex) in issues"
							:key="issueIndex"
						>
							<i
								class="material-icons duration-icon report-sub-item-left-icon"
								:content="issue.category"
								v-tippy
							>
								{{ icons[category] }}
							</i>

							<p class="report-sub-item-info">
								<span class="report-sub-item-title">
									{{ issue.title }}
								</span>
								<span
									class="report-sub-item-description"
									v-if="issue.description"
								>
									{{ issue.description }}
								</span>
							</p>

							<div
								class="report-sub-item-actions universal-item-actions"
							>
								<i
									class="material-icons resolve-icon"
									content="Resolve"
									v-tippy
									v-if="!issue.resolved"
									@click="
										toggleIssue(issue.reportId, issue._id)
									"
								>
									done
								</i>
								<i
									class="material-icons unresolve-icon"
									content="Unresolve"
									v-tippy
									v-else
									@click="
										toggleIssue(issue.reportId, issue._id)
									"
								>
									remove
								</i>
							</div>
						</div>
					</div>
				</div>
			</div>
			<p class="no-reports" v-else>There are no reports for this song.</p>
		</div>

		<div class="tab" v-if="tab === 'sort-by-report'">
			<div class="report-items" v-if="reports.length > 0">
				<div
					class="report-item"
					v-for="report in reports"
					:key="report._id"
				>
					<report-info-item
						:created-at="`${report.createdAt}`"
						:created-by="report.createdBy"
					>
						<template #actions>
							<i
								class="material-icons resolve-icon"
								content="Resolve all"
								v-tippy
								@click="resolve(report._id)"
							>
								done_all
							</i>
						</template>
					</report-info-item>

					<div class="report-sub-items">
						<div
							class="report-sub-item report-sub-item-unresolved"
							:class="[
								'report',
								issue.resolved
									? 'report-sub-item-resolved'
									: 'report-sub-item-unresolved'
							]"
							v-for="(issue, issueIndex) in report.issues"
							:key="issueIndex"
						>
							<i
								class="material-icons duration-icon report-sub-item-left-icon"
								:content="issue.category"
								v-tippy
							>
								{{ icons[issue.category] }}
							</i>
							<p class="report-sub-item-info">
								<span class="report-sub-item-title">
									{{ issue.title }}
								</span>
								<span
									class="report-sub-item-description"
									v-if="issue.description"
								>
									{{ issue.description }}
								</span>
							</p>

							<div
								class="report-sub-item-actions universal-item-actions"
							>
								<i
									class="material-icons resolve-icon"
									content="Resolve"
									v-tippy
									v-if="!issue.resolved"
									@click="toggleIssue(report._id, issue._id)"
								>
									done
								</i>
								<i
									class="material-icons unresolve-icon"
									content="Unresolve"
									v-tippy
									v-else
									@click="toggleIssue(report._id, issue._id)"
								>
									remove
								</i>
							</div>
						</div>
					</div>
				</div>
			</div>
			<p class="no-reports" v-else>There are no reports for this song.</p>
		</div>
	</div>
</template>

<style lang="less" scoped>
.night-mode {
	.report-items .report-item {
		background-color: var(--dark-grey-3) !important;
	}

	.report-items .report-item .report-item-header {
		background-color: var(--dark-grey-2) !important;
	}

	.label,
	p,
	strong {
		color: var(--light-grey-2);
	}

	.tabs-container .tab-selection .button {
		background: var(--dark-grey) !important;
		color: var(--white) !important;
	}
}

.reports-tab.tabs-container {
	.tab-selection {
		display: flex;
		overflow-x: auto;
		.button {
			border-radius: 0;
			border: 0;
			text-transform: uppercase;
			font-size: 14px;
			color: var(--dark-grey-3);
			background-color: var(--light-grey-2);
			flex-grow: 1;
			height: 32px;

			&:not(:first-of-type) {
				margin-left: 5px;
			}
		}

		.selected {
			background-color: var(--primary-color) !important;
			color: var(--white) !important;
			font-weight: 600;
		}
	}
	.tab {
		padding: 15px 0;
		border-radius: 0;
	}
}

.no-reports {
	text-align: center;
}

.report-items {
	.report-item {
		background-color: var(--white);
		border: 0.5px solid var(--primary-color);
		border-radius: @border-radius;
		padding: 8px;

		&:not(:first-of-type) {
			margin-bottom: 16px;
		}

		.report-item-header {
			justify-content: center;
			text-transform: capitalize;

			i {
				margin-right: 5px;
			}
		}

		.report-sub-items {
			.report-sub-item {
				border: 0.5px solid var(--black);
				margin-top: -1px;
				line-height: 24px;
				display: flex;
				padding: 4px;
				display: flex;

				&:first-child {
					border-radius: @border-radius @border-radius 0 0;
				}

				&:last-child {
					border-radius: 0 0 @border-radius @border-radius;
				}

				&.report-sub-item-resolved {
					.report-sub-item-description,
					.report-sub-item-title {
						text-decoration: line-through;
					}
				}

				.report-sub-item-left-icon {
					margin-right: 8px;
					margin-top: auto;
					margin-bottom: auto;
				}

				.report-sub-item-info {
					flex: 1;
					display: flex;
					flex-direction: column;

					.report-sub-item-title {
						font-size: 14px;
					}

					.report-sub-item-description {
						font-size: 12px;
						line-height: 16px;
					}
				}

				.report-sub-item-actions {
					height: 24px;
					margin-left: 8px;
					margin-top: auto;
					margin-bottom: auto;
				}
			}
		}

		.resolve-icon {
			color: var(--green);
			cursor: pointer;
		}

		.unresolve-icon {
			color: var(--dark-red);
			cursor: pointer;
		}
	}
}
</style>
