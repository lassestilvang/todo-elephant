const { TodoModel } = require('../models/todo');

/**
 * Resolver functions for GraphQL queries and mutations.
 * These operate on the in‑memory Todo collection.
 */
module.exports = {
  Query: {
    // Return the full list of todos for the current user
    todos: async (_, __, { user }) => {
      if (!user) throw new Error('Unauthenticated');
      return await TodoModel.find({ userId: user.id }).sort({ createdAt: -1 });
    },

    // Return a single todo by its ID
    todo: async (_, args, { user }) => {
      if (!user) throw new Error('Unauthenticated');
      const todo = await TodoModel.findOne({ _id: args.id, userId: user.id });
      if (!todo) throw new Error('Todo not found');
      return todo;
    },

    // Return basic stats about the user's todo list
    todoStats: async (_, __, { user }) => {
      if (!user) throw new Error('Unauthenticated');
      const total = await TodoModel.countDocuments({ userId: user.id });
      const completed = await TodoModel.countDocuments({
        userId: user.id,
        completed: true,
      });
      const pending = total - completed;
      return { total, completed, pending };
    },
  },

  Mutation: {
    // Create a new todo item
    createTodo: async (_, args, { user }) => {
      if (!user) throw new Error('Unauthenticated');

      const { description } = args;
      if (!description) {
        throw new Error('Description cannot be empty');
      }

      const newTodo = new TodoModel({
        userId: user.id,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
        completed: false,
      });

      return await newTodo.save();
    },

    // Toggle the completed flag of a todo
    toggleTodo: async (_, args, { user }) => {
      if (!user) throw new Error('Unauthenticated');
      const todo = await TodoModel.findOne({ _id: args.id, userId: user.id });
      if (!todo) throw new Error('Todo not found');

      todo.completed = !todo.completed;
      todo.updatedAt = new Date();
      return await todo.save();
    },

    // Delete a todo permanently
    deleteTodo: async (_, args, { user }) => {
      if (!user) throw new Error('Unauthenticated');
      const result = await TodoModel.deleteOne({
        _id: args.id,
        userId: user.id,
      });
      if (result.deletedCount === 0) {
        throw new Error('Todo not found');
      }
      return { success: true };
    },
  },
};