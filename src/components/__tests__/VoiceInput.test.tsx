// Test utilities for the VoiceInput component
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoiceInput } from '../VoiceInput';

describe('VoiceInput', () => {
  const mockOnAddTask = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAddTask.mockClear();
    mockOnClose.mockClear();
  });

  it('renders correctly when open', () => {
    render(<VoiceInput onAddTask={mockOnAddTask} onClose={mockOnClose} isOpen={true} />);

    expect(screen.getByText('Voice Task Input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /click to start recording/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<VoiceInput onAddTask={mockOnAddTask} onClose={mockOnClose} isOpen={false} />);

    expect(screen.queryByText('Voice Task Input')).not.toBeInTheDocument();
  });

  it('handles speech recognition not supported', () => {
    // Mock SpeechRecognition as undefined
    const originalSpeechRecognition = window.SpeechRecognition;
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;

    render(<VoiceInput onAddTask={mockOnAddTask} onClose={mockOnClose} isOpen={true} />);

    // Should show error state
    expect(screen.getByText('Speech recognition not supported in this browser')).toBeInTheDocument();

    // Restore
    window.SpeechRecognition = originalSpeechRecognition;
  });

  it('calls onAddTask when submitting', async () => {
    render(<VoiceInput onAddTask={mockOnAddTask} onClose={mockOnClose} isOpen={true} />);

    // Simulate transcript
    const transcriptInput = screen.getByRole('textbox');
    fireEvent.change(transcriptInput, { target: { value: 'Test task' } });

    // Click submit
    const submitButton = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnAddTask).toHaveBeenCalledWith({
        title: 'Test task',
        priority: undefined,
        dueDate: undefined,
        labels: undefined
      });
    });
  });
});