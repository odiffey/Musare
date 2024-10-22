import config from "config";
import { readdir } from "fs/promises";
import path from "path";
import { forEachIn } from "@common/utils/forEachIn";
import {
	Sequelize,
	Model as SequelizeModel,
	ModelStatic,
	DataTypes,
	Utils,
	Options
} from "sequelize";
import { Dirent } from "fs";
import * as inflection from "inflection";
import { SequelizeStorage, Umzug } from "umzug";
import ObjectID from "bson-objectid";
import BaseModule, { ModuleStatus } from "@/BaseModule";
import DataModuleJob from "./DataModule/DataModuleJob";
import Job from "@/Job";
import EventsModule from "./EventsModule";
import { EventClass } from "./EventsModule/Event";

export type ObjectIdType = string;

// TODO fix TS
// TODO implement actual checking of ObjectId's
// TODO move to a better spot
// Strange behavior would result if we extended DataTypes.ABSTRACT because
// it's a class wrapped in a Proxy by Utils.classToInvokable.
export class OBJECTID extends DataTypes.ABSTRACT.prototype.constructor {
	// Mandatory: set the type key
	static key = "OBJECTID";

	key = OBJECTID.key;

	// Mandatory: complete definition of the new type in the database
	toSql() {
		return "VARCHAR(24)";
	}

	// Optional: validator function
	// eslint-disable-next-line
	// @ts-ignore
	validate() {
		// value, options
		return true;
		// return (typeof value === 'number') && (!Number.isNaN(value));
	}

	// Optional: sanitizer
	// eslint-disable-next-line
	// @ts-ignore
	_sanitize(value) {
		return value;
		// Force all numbers to be positive
		// return value < 0 ? 0 : Math.round(value);
	}

	// Optional: value stringifier before sending to database
	// eslint-disable-next-line
	// @ts-ignore
	_stringify(value) {
		if (value instanceof ObjectID) return value.toHexString();
		return value.toString();
	}

	// Optional: parser for values received from the database
	// eslint-disable-next-line
	// @ts-ignore
	static parse(value) {
		return value;
		// return Number.parseInt(value);
	}
}

// Optional: add the new type to DataTypes. Optionally wrap it on `Utils.classToInvokable` to
// be able to use this datatype directly without having to call `new` on it.
DataTypes.OBJECTID = Utils.classToInvokable(OBJECTID);

export class DataModule extends BaseModule {
	private _sequelize?: Sequelize;

	declare _jobs: Record<string, typeof Job | typeof DataModuleJob>;

	/**
	 * Data Module
	 */
	public constructor() {
		super("data");

		this._dependentModules = ["events"];
	}

	/**
	 * startup - Startup data module
	 */
	public override async startup() {
		await super.startup();

		await this._runMigrations();

		await this._setupSequelize();

		await super._started();
	}

	/**
	 * shutdown - Shutdown data module
	 */
	public override async shutdown() {
		await super.shutdown();
		await this._sequelize?.close();
		await this._stopped();
	}

	private async _createSequelizeInstance(options: Options = {}) {
		const { username, password, host, port, database } =
			config.get<any>("postgres");

		const sequelize = new Sequelize(database, username, password, {
			host,
			port,
			dialect: "postgres",
			logging: message =>
				this.log({
					type: "debug",
					category: "sql",
					message
				}),
			...options
		});

		await sequelize.authenticate();

		return sequelize;
	}

	private _setupSequelizeHooks() {
		const getEventFromModel = (
			model: SequelizeModel<any, any>,
			suffix: string
		): EventClass | null => {
			const modelName = (
				model.constructor as ModelStatic<any>
			).getTableName();
			let EventClass;

			try {
				EventClass = this.getEvent(`${modelName}.${suffix}`);
			} catch (error) {
				// TODO: Catch and ignore only event not found
				return null;
			}

			return EventClass;
		};

		this._sequelize!.addHook("afterCreate", async model => {
			const EventClass = getEventFromModel(model, "created");
			if (!EventClass) return;

			await EventsModule.publish(
				new EventClass({
					doc: model
				})
			);
		});

		this._sequelize!.addHook("afterUpdate", async model => {
			const EventClass = getEventFromModel(model, "updated");
			if (!EventClass) return;

			await EventsModule.publish(
				new EventClass(
					{
						doc: model,
						oldDoc: {
							_id: model.get("_id")
						}
					},
					model.get("_id")!.toString()
				)
			);
		});

		this._sequelize!.addHook("afterDestroy", async model => {
			const EventClass = getEventFromModel(model, "deleted");
			if (!EventClass) return;

			await EventsModule.publish(
				new EventClass(
					{
						oldDoc: {
							_id: model.get("_id")
						}
					},
					model.get("_id")!.toString()
				)
			);
		});

		// Make sure every update/destroy has individualhooks

		this._sequelize!.addHook("beforeValidate", async model => {
			// TODO review
			if (model.isNewRecord) {
				const key = (model.constructor as ModelStatic<any>)
					.primaryKeyAttribute;
				model.dataValues[key] ??= ObjectID();
			}
		});
	}

	/**
	 * setupSequelize - Setup sequelize instance
	 */
	private async _setupSequelize() {
		this._sequelize = await this._createSequelizeInstance({});

		await this._sequelize.authenticate();

		this._setupSequelizeHooks();

		const setupFunctions: (() => Promise<void>)[] = [];

		await forEachIn(
			await readdir(
				path.resolve(__dirname, `./${this.constructor.name}/models`),
				{
					withFileTypes: true
				}
			),
			async modelFile => {
				if (!modelFile.isFile() || modelFile.name.includes(".spec."))
					return;

				const {
					default: ModelClass,
					schema,
					options = {},
					setup
				} = await import(`${modelFile.path}/${modelFile.name}`);

				const tableName = inflection.camelize(
					inflection.pluralize(ModelClass.name),
					true
				);

				ModelClass.init(schema, {
					tableName,
					...options,
					sequelize: this._sequelize
				});

				if (typeof setup === "function") setupFunctions.push(setup);

				await this._loadModelEvents(ModelClass.name);

				await this._loadModelJobs(ModelClass.name);
			}
		);

		await forEachIn(setupFunctions, setup => setup());
	}

	/**
	 * getModel - Get model
	 *
	 * @returns Model
	 */
	public async getModel<ModelType extends SequelizeModel<any>>(
		name: string
	): Promise<ModelStatic<ModelType>> {
		if (!this._sequelize?.models) throw new Error("Models not loaded");

		if (this.getStatus() !== ModuleStatus.STARTED)
			throw new Error("Module not started");

		// TODO check if we want to do it via singularize&camelize, or another way
		const camelizedName = inflection.singularize(inflection.camelize(name));

		return this._sequelize.model(camelizedName) as ModelStatic<ModelType>; // This fails - news has not been defined
	}

	private async _loadModelJobs(modelClassName: string) {
		let jobs: Dirent[];

		try {
			jobs = await readdir(
				path.resolve(
					__dirname,
					`./${this.constructor.name}/models/${modelClassName}/jobs/`
				),
				{
					withFileTypes: true
				}
			);
		} catch (error) {
			if (
				error instanceof Error &&
				"code" in error &&
				error.code === "ENOENT"
			) {
				this.log(
					`Loading ${modelClassName} jobs failed - folder doesn't exist`
				);
				return;
			}

			throw error;
		}

		await forEachIn(jobs, async jobFile => {
			if (!jobFile.isFile() || jobFile.name.includes(".spec.")) return;

			const { default: JobClass } = await import(
				`${jobFile.path}/${jobFile.name}`
			);

			const jobName = JobClass.getName();
			if (this._jobs[jobName]) {
				throw new Error(`Two jobs with the same name: ${jobName}`);
			}
			this._jobs[jobName] = JobClass;
		});
	}

	private async _loadModelEvents(modelClassName: string) {
		let events: Dirent[];

		try {
			events = await readdir(
				path.resolve(
					__dirname,
					`./${this.constructor.name}/models/${modelClassName}/events/`
				),
				{
					withFileTypes: true
				}
			);
		} catch (error) {
			if (
				error instanceof Error &&
				"code" in error &&
				error.code === "ENOENT"
			)
				return;

			throw error;
		}

		await forEachIn(events, async eventFile => {
			if (!eventFile.isFile() || eventFile.name.includes(".spec."))
				return;

			const { default: EventClass } = await import(
				`${eventFile.path}/${eventFile.name}`
			);

			this._events[EventClass.getName()] = EventClass;
		});
	}

	private async _runMigrations() {
		const sequelize = await this._createSequelizeInstance({
			logging: message =>
				this.log({
					type: "debug",
					category: "migrations.sql",
					message
				})
		});

		const migrator = new Umzug({
			migrations: {
				glob: [
					`${this.constructor.name}/migrations/*.ts`,
					{ cwd: __dirname }
				]
			},
			context: sequelize,
			storage: new SequelizeStorage({
				sequelize: sequelize!
			}),
			logger: console
		});

		await migrator.up();

		await sequelize.close();
	}
}

export default new DataModule();
