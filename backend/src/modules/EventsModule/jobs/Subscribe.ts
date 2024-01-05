import Job from "@/Job";
import EventsModule from "@/modules/EventsModule";
import { JobOptions } from "@/types/JobOptions";

export default class Subscribe extends Job {
	public constructor(
		payload?: any,
		options?: Omit<JobOptions, "runDirectly">
	) {
		super(EventsModule, payload, options);
	}

	protected override async _authorize() {
		const [, moduleName, modelName, event, modelId] =
			/^([a-z]+)\.([a-z]+)\.([A-z]+)\.?([A-z0-9]+)?$/.exec(
				this._payload?.channel
			) ?? [];

		let permission = `event.${this._payload?.channel}`;

		if (
			moduleName === "model" &&
			modelName &&
			(modelId || event === "created")
		) {
			if (event === "created")
				permission = `event.model.${modelName}.created`;
			else permission = `data.${modelName}.findById.${modelId}`;
		}

		await this._context.assertPermission(permission);
	}

	protected async _execute({ channel }: { channel: string }) {
		const socketId = this._context.getSocketId();

		if (!socketId) throw new Error("No socketId specified");

		await EventsModule.subscribeSocket(channel, socketId);
	}
}