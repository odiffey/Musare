import FindByIdJob from "@/modules/DataModule/FindByIdJob";

export default class FindById extends FindByIdJob {
	protected static _modelName = "minifiedUsers";

	protected static _hasPermission = true;
}
