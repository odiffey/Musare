export const forEachIn = async <
	ItemsType extends Array<any>,
	CallbackType extends (
		item: ItemsType[number],
		index: number
	) => Promise<any>,
	CallbackReturnType = Awaited<ReturnType<CallbackType>>
>(
	items: ItemsType,
	callback: CallbackType,
	concurrency = 10
): Promise<CallbackReturnType[]> => {
	const queued = items.slice();
	const failed: any[] = []; // TODO: Report these errors and abortOnError option
	const completed: CallbackReturnType[] = [];

	const next = async () => {
		const [item] = queued.splice(0, 1);

		if (typeof item === "undefined") return;

		const index = items.indexOf(item);

		try {
			completed[index] = await callback(item, index);
		} catch (error) {
			failed[index] = error;
		}

		await next();
	};

	await Promise.all(
		Array.from(Array(Math.min(items.length, concurrency)).keys()).map(next)
	);

	return completed;
};