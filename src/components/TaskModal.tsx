/* Add AI Subtask Generation Section */

const generateSubtasks = async (task: Task) => {
  const response = await fetch("/api/ai-subtasks", {
    method: "POST",
    body: JSON.stringify({ title: task.title, priority: task.priority })
  });

  const data = await response.json();
  return data.subtasks.map(sub => (
    { id: sub.id, title: sub.title, description: sub.description }
  ));
};

// Modify form handling to include subtasks
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!taskTitle.trim() || taskTitle.trim().length < 2) {
    setError("Please enter at least 2 characters");
    return;
  }

  // Generate subtasks if enabled
  const subtasks = generateSubtasks({ title: taskTitle, priority: taskPriority });

  // Submit main task and subtasks
  await actions.submitTask({
    mode: form.modalMode,
    editingTask: form.currentEditingTask,
    data: {
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      dueDate: taskDueDate,
      priority: taskPriority,
      status: taskStatus,
      listId: Number(taskListId),
      labels: taskLabelsSelected,
      subtasks,
      dependsOnTaskId: taskDependsOn,
      isImportant: taskIsImportant,
      isUrgent: taskIsUrgent,
      recurrence: taskRecurrence,
    },
    onSuccess: () => {
      form.setIsModalOpen(false);
      form.resetForm();
    },
  });
};

// Add checkbox to enable AI subtasks in TimeMachineView.tsx