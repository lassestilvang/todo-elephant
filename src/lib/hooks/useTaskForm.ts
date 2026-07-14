import { useState, useEffect } from 'react';

export function useTaskForm(initialValues = {}) {
  const [task, setTask] = useState('');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setTask(initialValues.task || '');
    setPriority(initialValues.priority || 'medium');
    setDescription(initialValues.description || '');
    setError(initialValues.error || '');
  }, [initialValues.task, initialValues.priority, initialValues.description, initialValues.error]);

  const setForm = (updates) => {
    if (updates?.task !== undefined) setTask(updates.task);
    if (updates?.priority !== undefined) setPriority(updates.priority);
    if (updates?.description !== undefined) setDescription(updates.description);
    if (updates?.error !== undefined) setError(updates.error);
  };

  const handleSubmit = () => {
    if (!task.trim() || task.trim().length < 2) {
      setError('Please enter at least 2 characters');
      return;
    }

    // Clear form after successful submit
    setTask('');
    setPriority('medium');
    setDescription('');
    setError('');

    // Reset form in case there are residual values
    setForm({});
  };

  return { task, priority, description, error, handleSubmit, setForm };
}