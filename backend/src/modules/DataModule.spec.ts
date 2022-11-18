// @ts-nocheck
import async from "async";
import chai, { expect } from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import { ObjectId } from "mongodb";
import JobContext from "../JobContext";
import JobQueue from "../JobQueue";
import LogBook from "../LogBook";
import ModuleManager from "../ModuleManager";
import DataModule from "./DataModule";

chai.should();
chai.use(sinonChai);

describe("Data Module", function () {
	const moduleManager = Object.getPrototypeOf(
		sinon.createStubInstance(ModuleManager)
	);
	moduleManager.logBook = sinon.createStubInstance(LogBook);
	moduleManager.jobQueue = sinon.createStubInstance(JobQueue);
	const dataModule = new DataModule(moduleManager);
	const jobContext = sinon.createStubInstance(JobContext);
	const testData = { abc: [] };

	before(async function () {
		await dataModule.startup();
		dataModule.redisClient = sinon.spy(dataModule.redisClient);
	});

	beforeEach(async function () {
		testData.abc = await async.map(Array(10), async () =>
			dataModule.collections?.abc.collection.insertOne({
				_id: new ObjectId(),
				name: `Test${Math.round(Math.random() * 1000)}`,
				autofill: {
					enabled: !!Math.floor(Math.random())
				},
				someNumbers: Array(Math.round(Math.random() * 50)).map(() =>
					Math.round(Math.random() * 10000)
				),
				songs: Array(Math.round(Math.random() * 10)).map(() => ({
					_id: new mongoose.Types.ObjectId()
				})),
				createdAt: Date.now(),
				updatedAt: Date.now(),
				testData: true
			})
		);
	});

	it("module loaded and started", function () {
		moduleManager.logBook.log.should.have.been.called;
		dataModule.getName().should.equal("data");
		dataModule.getStatus().should.equal("STARTED");
	});

	describe("find job", function () {
		// Run cache test twice to validate mongo and redis sourced data
		[false, true, true].forEach(useCache => {
			it(`filter by one _id string ${
				useCache ? "with" : "without"
			} cache`, async function () {
				const [document] = testData.abc;

				const find = await dataModule.find(jobContext, {
					collection: "abc",
					filter: { _id: document._id },
					limit: 1,
					useCache
				});

				find.should.be.an("object");
				find._id.should.deep.equal(document._id);
				find.createdAt.should.deep.equal(document.createdAt);

				if (useCache) {
					dataModule.redisClient?.GET.should.have.been.called;
				}
			});
		});

		it(`filter by name string without cache`, async function () {
			const [document] = testData.abc;

			const find = await dataModule.find(jobContext, {
				collection: "abc",
				filter: { name: document.name },
				limit: 1,
				useCache: false
			});

			find.should.be.an("object");
			find._id.should.deep.equal(document._id);
			find.should.have.keys([
				"_id",
				"createdAt",
				"updatedAt",
				// "name", - Name is restricted, so it won't be returned
				"autofill",
				"someNumbers",
				"songs"
			]);
		});
	});

	describe("normalize projection", function () {
		const dataModuleProjection = Object.getPrototypeOf(dataModule);

		it(`basics`, function () {
			dataModuleProjection.normalizeProjection.should.be.a("function");
		});

		it(`empty object/array projection`, function () {
			const expectedResult = { projection: [], mode: "includeAllBut" };

			const resultWithArray = dataModuleProjection.normalizeProjection(
				[]
			);
			const resultWithObject = dataModuleProjection.normalizeProjection(
				{}
			);

			resultWithArray.should.deep.equal(expectedResult);
			resultWithObject.should.deep.equal(expectedResult);
		});

		it(`null/undefined projection`, function () {
			const expectedResult = { projection: [], mode: "includeAllBut" };

			const resultWithNull =
				dataModuleProjection.normalizeProjection(null);
			const resultWithUndefined =
				dataModuleProjection.normalizeProjection(undefined);
			const resultWithNothing =
				dataModuleProjection.normalizeProjection();

			resultWithNull.should.deep.equal(expectedResult);
			resultWithUndefined.should.deep.equal(expectedResult);
			resultWithNothing.should.deep.equal(expectedResult);
		});

		it(`simple exclude projection`, function () {
			const expectedResult = {
				projection: [["name", false]],
				mode: "includeAllBut"
			};

			const resultWithBoolean = dataModuleProjection.normalizeProjection({
				name: false
			});
			const resultWithNumber = dataModuleProjection.normalizeProjection({
				name: 0
			});

			resultWithBoolean.should.deep.equal(expectedResult);
			resultWithNumber.should.deep.equal(expectedResult);
		});

		it(`simple include projection`, function () {
			const expectedResult = {
				projection: [["name", true]],
				mode: "excludeAllBut"
			};

			const resultWithObject = dataModuleProjection.normalizeProjection({
				name: true
			});
			const resultWithArray = dataModuleProjection.normalizeProjection([
				"name"
			]);

			resultWithObject.should.deep.equal(expectedResult);
			resultWithArray.should.deep.equal(expectedResult);
		});

		it(`simple include/exclude projection`, function () {
			const expectedResult = {
				projection: [
					["color", false],
					["name", true]
				],
				mode: "excludeAllBut"
			};

			const result = dataModuleProjection.normalizeProjection({
				color: false,
				name: true
			});

			result.should.deep.equal(expectedResult);
		});

		it(`simple nested include projection`, function () {
			const expectedResult = {
				projection: [["location.city", true]],
				mode: "excludeAllBut"
			};

			const resultWithObject = dataModuleProjection.normalizeProjection({
				location: {
					city: true
				}
			});
			const resultWithArray = dataModuleProjection.normalizeProjection([
				"location.city"
			]);

			resultWithObject.should.deep.equal(expectedResult);
			resultWithArray.should.deep.equal(expectedResult);
		});

		it(`simple nested exclude projection`, function () {
			const expectedResult = {
				projection: [["location.city", false]],
				mode: "includeAllBut"
			};

			const result = dataModuleProjection.normalizeProjection({
				location: {
					city: false
				}
			});

			result.should.deep.equal(expectedResult);
		});

		it(`path collision`, function () {
			expect(() => {
				dataModuleProjection.normalizeProjection({
					location: {
						city: false
					},
					"location.city": true
				});
			}).to.throw("Path collision, non-unique key");
		});

		it(`path collision 2`, function () {
			expect(() => {
				dataModuleProjection.normalizeProjection({
					location: {
						city: {
							extra: false
						}
					},
					"location.city": true
				});
			}).to.throw(
				"Path collision! location.city.extra collides with location.city"
			);
		});

		// TODO add more test cases
	});

	afterEach(async function () {
		sinon.reset();
		await dataModule.collections?.abc.collection.deleteMany({
			testData: true
		});
	});

	after(async function () {
		await dataModule.shutdown();
	});
});
