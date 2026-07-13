// Elephant Content Calendar API
// Handles content planning and scheduling with persistent storage

import { NextApiRequest, NextApiResponse } from 'next';

// In-memory store for demo (in production: use database)
let contentCalendar = {
  events: [],
  themes: ['Wildlife Conservation', 'Elephant Care', 'Habitat Preservation', 'Community Outreach', 'Education'],
  nextId: 1
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'GET':
      // Get calendar events and themes
      res.status(200).json({
        success: true,
        data: contentCalendar
      });
      break;

    case 'POST':
      // Add new event
      try {
        const { title, description, date, theme } = req.body;

        if (!title || !date) {
          return res.status(400).json({
            success: false,
            error: 'Title and date are required'
          });
        }

        const newEvent = {
          id: contentCalendar.nextId++,
          title,
          description: description || '',
          date,
          theme: theme || contentCalendar.themes[0],
          createdAt: new Date().toISOString()
        };

        contentCalendar.events.push(newEvent);
        res.status(201).json({
          success: true,
          data: newEvent
        });
      } catch (error) {
        console.error('Error adding calendar event:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to add event'
        });
      }
      break;

    case 'PUT':
      // Update existing event
      try {
        const { id, title, description, date, theme } = req.body;

        if (!id) {
          return res.status(400).json({
            success: false,
            error: 'Event ID is required'
          });
        }

        const eventIndex = contentCalendar.events.findIndex(e => e.id === id);
        if (eventIndex === -1) {
          return res.status(404).json({
            success: false,
            error: 'Event not found'
          });
        }

        contentCalendar.events[eventIndex] = {
          ...contentCalendar.events[eventIndex],
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(date !== undefined && { date }),
          ...(theme !== undefined && { theme }),
          updatedAt: new Date().toISOString()
        };

        res.status(200).json({
          success: true,
          data: contentCalendar.events[eventIndex]
        });
      } catch (error) {
        console.error('Error updating calendar event:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update event'
        });
      }
      break;

    case 'DELETE':
      // Delete event
      try {
        const { id } = req.body;

        if (!id) {
          return res.status(400).json({
            success: false,
            error: 'Event ID is required'
          });
        }

        const initialLength = contentCalendar.events.length;
        contentCalendar.events = contentCalendar.events.filter(e => e.id !== id);

        if (contentCalendar.events.length === initialLength) {
          return res.status(404).json({
            success: false,
            error: 'Event not found'
          });
        }

        res.status(200).json({
          success: true,
          message: 'Event deleted successfully'
        });
      } catch (error) {
        console.error('Error deleting calendar event:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to delete event'
        });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

export default handler;