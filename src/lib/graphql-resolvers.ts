import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLBoolean, GraphQLList, GraphQLNonNull, graphql } from 'graphql';
import { Task, List, Label, FocusSession } from '@/types';

// Simple GraphQL schema for Todo Elephant
const TaskType = new GraphQLObjectType({
  name: "Task",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLInt) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    priority: { type: GraphQLString },
    status: { type: GraphQLString },
    dueDate: { type: GraphQLString },
  }),
});

const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    tasks: {
      type: new GraphQLList(TaskType),
      resolve: () => [],
    },
  },
});

export const schema = new GraphQLSchema({
  query: QueryType,
});

// Resolver stub
export const resolvers = {
  Query: {
    tasks: () => [],
  },
};