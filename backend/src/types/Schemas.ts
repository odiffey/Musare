import { Types } from "mongoose";
import { DocumentVersion } from "../schemas/plugins/documentVersion";
import { AbcSchemaType } from "../schemas/abc";
import { NewsSchemaType } from "../schemas/news";
import { SessionSchemaType } from "../schemas/session";
import { StationSchemaType } from "../schemas/station";
import { UserSchemaType } from "../schemas/user";

// eslint-disable-next-line
export interface BaseSchema extends DocumentVersion, TimestampsSchema {
	_id: Types.ObjectId;
}

export interface TimestampsSchema {
	createdAt: number;
	updatedAt: number;
}

export type Schemas = {
	abc: AbcSchemaType;
	news: NewsSchemaType;
	session: SessionSchemaType;
	station: StationSchemaType;
	user: UserSchemaType;
};