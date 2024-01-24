import { reactive, ref } from "vue";
import { defineStore } from "pinia";
import { generateUuid } from "@common/utils/generateUuid";
import { useWebsocketStore } from "./websocket";
import Model from "@/Model";

export const useModelStore = defineStore("model", () => {
	const { runJob, subscribe, unsubscribe } = useWebsocketStore();

	const models = ref([]);
	const permissions = ref({});
	const createdSubcription = ref(null);
	const subscriptions = ref({
		created: {},
		updated: {},
		deleted: {}
	});

	const getUserModelPermissions = async (modelName: string) => {
		if (permissions.value[modelName]) return permissions.value[modelName];

		const data = await runJob("data.users.getModelPermissions", {
			modelName
		});

		permissions.value[modelName] = data;

		return permissions.value[modelName];
	};

	const hasPermission = async (modelName: string, permission: string) => {
		const data = await getUserModelPermissions(modelName);

		return !!data[permission];
	};

	const unregisterModels = async modelIds =>
		Promise.all(
			(Array.isArray(modelIds) ? modelIds : [modelIds]).map(
				async modelId => {
					const model = models.value.find(
						model => model._id === modelId
					);

					if (!model || model.getUses() > 1) {
						model?.removeUse();

						return;
					}

					await model.unregisterRelations();

					const { updated, deleted } = model.getSubscriptions() ?? {};

					if (updated)
						await unsubscribe(
							`model.${model.getName()}.updated.${modelId}`,
							updated
						);

					if (deleted)
						await unsubscribe(
							`model.${model.getName()}.deleted.${modelId}`,
							deleted
						);

					models.value.splice(
						models.value.findIndex(model => model._id === modelId),
						1
					);
				}
			)
		);

	const onCreatedCallback = async (modelName: string, data) => {
		if (!subscriptions.value.created[modelName]) return;

		await Promise.all(
			Object.values(subscriptions.value.created[modelName]).map(
				async subscription => subscription(data) // TODO: Error handling
			)
		);
	};

	const onCreated = async (
		modelName: string,
		callback: (data?: any) => any
	) => {
		if (!createdSubcription.value)
			createdSubcription.value = await subscribe(
				`model.${modelName}.created`,
				data => onCreatedCallback(modelName, data)
			);

		const uuid = generateUuid();

		subscriptions.value.created[modelName] ??= {};
		subscriptions.value.created[modelName][uuid] = callback;

		return uuid;
	};

	const onUpdated = async (
		modelName: string,
		callback: (data?: any) => any
	) => {
		const uuid = generateUuid();

		subscriptions.value.updated[modelName] ??= {};
		subscriptions.value.updated[modelName][uuid] = callback;

		return uuid;
	};

	const onUpdatedCallback = async (modelName: string, { doc }) => {
		const model = models.value.find(model => model._id === doc._id);
		if (model) model.updateData(doc);

		if (!subscriptions.value.updated[modelName]) return;

		await Promise.all(
			Object.values(subscriptions.value.updated[modelName]).map(
				async subscription => subscription(data) // TODO: Error handling
			)
		);
	};

	const onDeleted = async (
		modelName: string,
		callback: (data?: any) => any
	) => {
		const uuid = generateUuid();

		subscriptions.value.deleted[modelName] ??= {};
		subscriptions.value.deleted[modelName][uuid] = callback;

		return uuid;
	};

	const onDeletedCallback = async (modelName: string, data) => {
		const { oldDoc } = data;

		if (subscriptions.value.deleted[modelName])
			await Promise.all(
				Object.values(subscriptions.value.deleted[modelName]).map(
					async subscription => subscription(data) // TODO: Error handling
				)
			);

		const index = models.value.findIndex(model => model._id === oldDoc._id);
		if (index > -1) await unregisterModels(oldDoc._id);
	};

	const removeCallback = async (
		modelName: string,
		type: "created" | "updated" | "deleted",
		uuid: string
	) => {
		if (
			!subscriptions.value[type][modelName] ||
			!subscriptions.value[type][modelName][uuid]
		)
			return;

		delete subscriptions.value[type][modelName][uuid];

		if (
			type === "created" &&
			Object.keys(subscriptions.value.created[modelName]).length === 0
		) {
			await unsubscribe(
				`model.${modelName}.created`,
				createdSubcription.value
			);

			createdSubcription.value = null;
		}
	};

	const registerModels = async (
		docs,
		relations?: Record<string, string | string[]>
	) =>
		Promise.all(
			(Array.isArray(docs) ? docs : [docs]).map(async _doc => {
				const existingRef = models.value.find(
					model => model._id === _doc._id
				);

				const docRef = existingRef ?? reactive(new Model(_doc));

				docRef.addUse();

				if (existingRef) return docRef;

				if (relations && relations[docRef._name])
					await docRef.loadRelations(relations[docRef._name]);

				models.value.push(docRef);

				const updatedUuid = await subscribe(
					`model.${docRef._name}.updated.${_doc._id}`,
					data => onUpdatedCallback(docRef._name, data)
				);

				const deletedUuid = await subscribe(
					`model.${docRef._name}.deleted.${_doc._id}`,
					data => onDeletedCallback(docRef._name, data)
				);

				docRef.setSubscriptions(updatedUuid, deletedUuid);

				return docRef;
			})
		);

	const findById = async (modelName: string, _id) => {
		const existingModel = models.value.find(model => model._id === _id);

		if (existingModel) return existingModel;

		return runJob(`data.${modelName}.findById`, { _id });
	};

	const loadModels = async (
		modelName: string,
		modelIds: string | string[],
		relations?: Record<string, string | string[]>
	) =>
		Promise.all(
			(Array.isArray(modelIds) ? modelIds : [modelIds]).map(
				async modelId => {
					let model = models.value.find(
						model =>
							model._id === modelId && model._name === modelName
					);

					model ??= await findById(modelName, modelId);

					const [ref] = await registerModels(model, relations);

					return ref;
				}
			)
		);

	return {
		models,
		permissions,
		subscriptions,
		onCreated,
		onUpdated,
		onDeleted,
		removeCallback,
		registerModels,
		unregisterModels,
		getUserModelPermissions,
		hasPermission,
		findById,
		loadModels
	};
});
