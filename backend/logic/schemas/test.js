import { GraphQLSchema, GraphQLObjectType, GraphQLString } from "graphql";

/**
 * Construct a GraphQL schema and define the necessary resolvers.
 *
 * type Query {
 *   hello: String
 * }
 * type Subscription {
 *   greetings: String
 * }
 */
// eslint-disable-next-line
export const schema = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: "Query",
		fields: {
			hello: {
				type: GraphQLString,
				resolve: () => "world"
			}
		}
	}),
	subscription: new GraphQLObjectType({
		name: "Subscription",
		fields: {
			greetings: {
				type: GraphQLString,
				async *subscribe() {
					// eslint-disable-next-line
					for (const hi of ["Hi", "Bonjour", "Hola", "Ciao", "Zdravo"]) {
						yield { greetings: hi };
					}
				}
			}
		}
	})
});
