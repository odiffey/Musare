import { setActivePinia, createPinia } from "pinia";
import { useLongJobsStore } from "@/stores/longJobs";

describe("longJobs store", () => {
	beforeEach(context => {
		setActivePinia(createPinia());
		context.longJobsStore = useLongJobsStore();
	});

	test("setJobs", ({ longJobsStore }) => {
		const jobs = [
			{
				id: "f9c51c9b-2709-4c79-8263-998026fd8afb",
				name: "Bulk verifying songs",
				status: "success",
				message: "2 songs have been successfully verified"
			}
		];
		longJobsStore.setJobs(jobs);
		expect(longJobsStore.activeJobs).toEqual(jobs);
	});

	test("setJob new", ({ longJobsStore }) => {
		const job = {
			id: "f9c51c9b-2709-4c79-8263-998026fd8afb",
			name: "Bulk verifying songs",
			status: "success",
			message: "2 songs have been successfully verified"
		};
		longJobsStore.setJob(job);
		expect(longJobsStore.activeJobs).toEqual([job]);
	});

	test("setJob update", ({ longJobsStore }) => {
		longJobsStore.setJob({
			id: "f9c51c9b-2709-4c79-8263-998026fd8afb",
			name: "Bulk verifying songs",
			status: "started",
			message: "Verifying 2 songs.."
		});
		const updatedJob = {
			id: "f9c51c9b-2709-4c79-8263-998026fd8afb",
			name: "Bulk verifying songs",
			status: "success",
			message: "2 songs have been successfully verified"
		};
		longJobsStore.setJob(updatedJob);
		expect(longJobsStore.activeJobs).toEqual([updatedJob]);
	});

	test("setJob already removed", ({ longJobsStore }) => {
		const job = {
			id: "f9c51c9b-2709-4c79-8263-998026fd8afb",
			name: "Bulk verifying songs",
			status: "success",
			message: "2 songs have been successfully verified"
		};
		longJobsStore.setJob(job);
		longJobsStore.removeJob("f9c51c9b-2709-4c79-8263-998026fd8afb");
		longJobsStore.setJob(job);
		expect(longJobsStore.activeJobs.length).toBe(0);
		expect(longJobsStore.removedJobIds).toEqual([
			"f9c51c9b-2709-4c79-8263-998026fd8afb"
		]);
	});

	test("removeJob", ({ longJobsStore }) => {
		longJobsStore.setJobs([
			{
				id: "f9c51c9b-2709-4c79-8263-998026fd8afb",
				name: "Bulk verifying songs",
				status: "success",
				message: "2 songs have been successfully verified"
			}
		]);
		longJobsStore.removeJob("f9c51c9b-2709-4c79-8263-998026fd8afb");
		expect(longJobsStore.activeJobs.length).toBe(0);
		expect(longJobsStore.removedJobIds).toContain(
			"f9c51c9b-2709-4c79-8263-998026fd8afb"
		);

		longJobsStore.removeJob("e58fb1a6-14eb-4ce9-aed9-96c8afe17cbe");
		expect(longJobsStore.removedJobIds).not.toContain(
			"e58fb1a6-14eb-4ce9-aed9-96c8afe17cbe"
		);
	});
});
