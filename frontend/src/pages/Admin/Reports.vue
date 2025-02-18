<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";
import Toast from "toasters";
import { useModalsStore } from "@/stores/modals";
import { useUserAuthStore } from "@/stores/userAuth";
import { useReports } from "@/composables/useReports";
import { TableColumn, TableFilter, TableEvents } from "@/types/advancedTable";
import utils from "@/utils";

const AdvancedTable = defineAsyncComponent(
	() => import("@/components/AdvancedTable.vue")
);
const UserLink = defineAsyncComponent(
	() => import("@/components/UserLink.vue")
);

const columnDefault = ref<TableColumn>({
	sortable: true,
	hidable: true,
	defaultVisibility: "shown",
	draggable: true,
	resizable: true,
	minWidth: 150,
	maxWidth: 600
});
const columns = ref<TableColumn[]>([
	{
		name: "options",
		displayName: "Options",
		properties: ["_id", "resolved"],
		sortable: false,
		hidable: false,
		resizable: false,
		minWidth: 85,
		defaultWidth: 85
	},
	{
		name: "_id",
		displayName: "Report ID",
		properties: ["_id"],
		sortProperty: "_id",
		minWidth: 215,
		defaultWidth: 215
	},
	{
		name: "songId",
		displayName: "Song ID",
		properties: ["song"],
		sortProperty: "song._id",
		minWidth: 215,
		defaultWidth: 215
	},
	{
		name: "songYoutubeId",
		displayName: "Song YouTube ID",
		properties: ["song"],
		sortProperty: "song.youtubeId",
		minWidth: 165,
		defaultWidth: 165
	},
	{
		name: "resolved",
		displayName: "Resolved",
		properties: ["resolved"],
		sortProperty: "resolved"
	},
	{
		name: "categories",
		displayName: "Categories",
		properties: ["issues"],
		sortable: false
	},
	{
		name: "createdBy",
		displayName: "Created By",
		properties: ["createdBy"],
		sortProperty: "createdBy",
		defaultWidth: 150
	},
	{
		name: "createdAt",
		displayName: "Created At",
		properties: ["createdAt"],
		sortProperty: "createdAt",
		defaultWidth: 150
	}
]);
const filters = ref<TableFilter[]>([
	{
		name: "_id",
		displayName: "Report ID",
		property: "_id",
		filterTypes: ["exact"],
		defaultFilterType: "exact"
	},
	{
		name: "songId",
		displayName: "Song ID",
		property: "song._id",
		filterTypes: ["exact"],
		defaultFilterType: "exact"
	},
	{
		name: "songYoutubeId",
		displayName: "Song YouTube ID",
		property: "song.youtubeId",
		filterTypes: ["contains", "exact", "regex"],
		defaultFilterType: "contains"
	},
	{
		name: "resolved",
		displayName: "Resolved",
		property: "resolved",
		filterTypes: ["boolean"],
		defaultFilterType: "boolean"
	},
	{
		name: "categories",
		displayName: "Categories",
		property: "issues.category",
		filterTypes: ["contains", "exact", "regex"],
		defaultFilterType: "contains"
	},
	{
		name: "createdBy",
		displayName: "Created By",
		property: "createdBy",
		filterTypes: ["contains", "exact", "regex"],
		defaultFilterType: "contains"
	},
	{
		name: "createdAt",
		displayName: "Created At",
		property: "createdAt",
		filterTypes: ["datetimeBefore", "datetimeAfter"],
		defaultFilterType: "datetimeBefore"
	}
]);
const events = ref<TableEvents>({
	adminRoom: "reports",
	updated: {
		event: "admin.report.updated",
		id: "report._id",
		item: "report"
	},
	removed: {
		event: "admin.report.removed",
		id: "reportId"
	}
});

const { openModal } = useModalsStore();

const { resolveReport } = useReports();

const userAuthStore = useUserAuthStore();
const { hasPermission } = userAuthStore;

const resolve = (reportId, value) =>
	resolveReport({ reportId, value })
		.then((res: any) => {
			if (res.status !== "success") new Toast(res.message);
		})
		.catch(err => new Toast(err.message));
</script>

<template>
	<div class="admin-tab container">
		<page-metadata title="Admin | Reports" />
		<div class="card tab-info">
			<div class="info-row">
				<h1>Reports</h1>
				<p>Manage song reports</p>
			</div>
		</div>
		<advanced-table
			:column-default="columnDefault"
			:columns="columns"
			:filters="filters"
			data-action="reports.getData"
			name="admin-reports"
			:max-width="1200"
			:events="events"
		>
			<template #column-options="slotProps">
				<div class="row-options">
					<button
						class="button is-primary icon-with-button material-icons"
						@click="
							openModal({
								modal: 'viewReport',
								props: { reportId: slotProps.item._id }
							})
						"
						:disabled="slotProps.item.removed"
						content="View Report"
						v-tippy
					>
						open_in_full
					</button>
					<button
						v-if="
							slotProps.item.resolved &&
							hasPermission('reports.update')
						"
						class="button is-danger material-icons icon-with-button"
						@click="resolve(slotProps.item._id, false)"
						:disabled="slotProps.item.removed"
						content="Unresolve Report"
						v-tippy
					>
						remove_done
					</button>
					<button
						v-else-if="
							!slotProps.item.resolved &&
							hasPermission('reports.update')
						"
						class="button is-success material-icons icon-with-button"
						@click="resolve(slotProps.item._id, true)"
						:disabled="slotProps.item.removed"
						content="Resolve Report"
						v-tippy
					>
						done_all
					</button>
				</div>
			</template>
			<template #column-_id="slotProps">
				<span :title="slotProps.item._id">{{
					slotProps.item._id
				}}</span>
			</template>
			<template #column-songId="slotProps">
				<span :title="slotProps.item.song._id">{{
					slotProps.item.song._id
				}}</span>
			</template>
			<template #column-songYoutubeId="slotProps">
				<a
					:href="
						'https://www.youtube.com/watch?v=' +
						`${slotProps.item.song.youtubeId}`
					"
					target="_blank"
				>
					{{ slotProps.item.song.youtubeId }}
				</a>
			</template>
			<template #column-resolved="slotProps">
				<span :title="slotProps.item.resolved">{{
					slotProps.item.resolved
				}}</span>
			</template>
			<template #column-categories="slotProps">
				<span
					:title="
						slotProps.item.issues
							.map(issue => issue.category)
							.join(', ')
					"
					>{{
						slotProps.item.issues
							.map(issue => issue.category)
							.join(", ")
					}}</span
				>
			</template>
			<template #column-createdBy="slotProps">
				<span v-if="slotProps.item.createdBy === 'Musare'">Musare</span>
				<user-link v-else :user-id="slotProps.item.createdBy" />
			</template>
			<template #column-createdAt="slotProps">
				<span :title="new Date(slotProps.item.createdAt).toString()">{{
					utils.getDateFormatted(slotProps.item.createdAt)
				}}</span>
			</template>
		</advanced-table>
	</div>
</template>
