import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Todo {
    id: ID!
    description: String!
  }

  type Query {
    todos: [Todo]
  }

  type Mutation {
    createTodo(description: String!): Todo
  }
`;