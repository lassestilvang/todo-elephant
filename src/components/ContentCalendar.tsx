import React, { useState, useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import dayjs from 'dayjs';
import { DateCalendar, Fab, IconButton, Tooltip, TextField } from '@mui/material';
import { Add, MoreHoriz } from '@mui/icons-material';

const useStyles = makeStyles((theme) => ({
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing(2),
    fontWeight: theme.typography.fontWeightMedium,
  },
  datePicker: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: theme.spacing(2),
  },
  eventList: {
    marginTop: theme.spacing(2),
  },
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
}));

const ContentCalendar = () => {
  const classes = useStyles();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: '', date: '' });

  useEffect(() => {
    // Fetch existing events from API
    fetch('/api/elephant/calendar')
      .then(res => res.json())
      .then(data => setEvents(data.events || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    // Add new event via API
    await fetch('/api/elephant/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newEvent.title,
        date: newEvent.date,
        description: newEvent.description || ''
      })
    );

    // Refresh events
    const refreshed = await fetch('/api/elephant/calendar');
    const refreshedData = await refreshed.json();
    setEvents(refreshedData.events || []);

    // Reset form
    setNewEvent({ title: '', date: '', description: '' });
  };

  const handleDelete = async (eventId) => {
    await fetch(`/api/elephant/calendar/${eventId}`, { method: 'DELETE' });
    const refreshed = await fetch('/api/elephant/calendar');
    const refreshedData = await refreshed.json();
    setEvents(refreshedData.events || []);
  };

  const formatDate = (date) => dayjs(date).format('YYYY-MM-DD');

  return (
    <div className={classes.container}>
      <h2 className={classes.title}>Content Calendar</h2>

      <div className={classes.datePicker}>
        <DateCalendar
          value={selectedDate}
          onChange={(newValue) => setSelectedDate(newValue)}
        />
      </div>

      <form onSubmit={handleSubmit} className={`${classes.container} margin-top-2`}>
        <TextField
          label="Event Title"
          value={newEvent.title}
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
          required
        />
        <TextField
          label="Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={formatDate(newEvent.date)}
          onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
          required
        />
        <TextField
          label="Description"
          multiline
          rows={3}
          value={newEvent.description}
          onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
        />
        < button type="submit">Create Event</button>
      </form>

      <div className={classes.eventList}>
        {events
          .filter(e => formatDate(e.date) === formatDate(selectedDate))
          .map((event) => (
            <div key={event.id} className="border rounded p-2 mb-2 shadow-sm">
              <strong>{event.title}</strong>
              <span className="text-muted small">
                ({formatDate(event.date)})
                {event.description && ` - ${event.description}`}
              </span>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  sx={{ ml: 1 }}
                  onClick={() => handleDelete(event.id)}
                >
                  <Icon button>
                    <Delete color="error" fontSize="small" />
                  </Icon>
                </IconButton>
              </Tooltip>
            </div>
          ))}
      </div>

      <Fab
        className={classes.fab}
        color="primary"
        aria-label="add"
        onClick={() => {
          // Open a simple prompt to add an event quickly
          const title = prompt('Event Title:');
          const date = prompt('Date (YYYY-MM-DD):');
          if (title && date) {
            handleSubmit({ target: { } } as any);
          }
        }}
      >
        <Add fontSize="large" />
      </Fab>
    </div>
  );
};

export default ContentCalendar;