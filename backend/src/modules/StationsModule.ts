import JobContext from "@/JobContext";
import { UniqueMethods } from "@/types/Modules";
import BaseModule from "@/BaseModule";
import JobQueue from "@/JobQueue";

export class StationsModule extends BaseModule {
	/**
	 * Station Module
	 */
	public constructor() {
		super("stations");

		this._dependentModules = ["data"];
	}

	/**
	 * startup - Startup station module
	 */
	public override async startup() {
		await super.startup();
		this.log("Station Startup");
		await super._started();
	}

	/**
	 * shutdown - Shutdown station module
	 */
	public override async shutdown() {
		await super.shutdown();
		await super._stopped();
	}

	/**
	 * addToQueue - Add media to queue
	 *
	 * @param payload - Payload
	 */
	public async addToQueue(context: JobContext, payload: { songId: string }) {
		const { songId } = payload;
		context.log(`Adding song ${songId} to the queue.`);
		await new Promise((resolve, reject) => {
			setTimeout(() => {
				if (Math.round(Math.random())) reject(new Error("Test321"));
				else resolve(true);
			}, Math.random() * 1000);
		});
	}

	public async addA(context: JobContext) {
		context.log("ADDA");
		await JobQueue.runJob("stations", "addB", {}, { priority: 5 });
		return { number: 123 };
	}

	public async addB(context: JobContext) {
		context.log("ADDB");
		await JobQueue.runJob("stations", "addToQueue", {
			songId: "test"
		});
		await JobQueue.runJob("stations", "addC", {});
	}

	public async addC(context: JobContext) {
		context.log("ADDC");
		// await new Promise(() => {});
	}
}

export type StationsModuleJobs = {
	[Property in keyof UniqueMethods<StationsModule>]: {
		payload: Parameters<UniqueMethods<StationsModule>[Property]>[1];
		returns: Awaited<ReturnType<UniqueMethods<StationsModule>[Property]>>;
	};
};

export default new StationsModule();