// Elephant Content Calendar API
// Handles content planning and scheduling with persistent storage

import { NextRequest, NextResponse } from 'next/server';

interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  theme?: string;
  createdAt: string;
  updatedAt?: string;
}

// In-memory store for demo (in production: use database)
let contentCalendar: {
  events: CalendarEvent[];
  themes: string[];
  nextId: number;
} = {
  events: [],
  themes: ['Wildlife Conservation', 'Elephant Care', 'Habitat Preservation', 'Community Outreach', 'Education'],
  nextId: 1
};

// GET endpoint - list events
export async function GET() {
  return NextResponse.json({
    success: true,
    data: contentCalendar
  });
}

// POST endpoint - create event
export async function POST(request: NextRequest) {
  try {
    const { title, description, date, theme } = await request.json();

    if (!title || !date) {
      return NextResponse.json({
        success: false,
        error: 'Title and date are required'
      }, { status: 400 });
    }

    const newEvent: CalendarEvent = {
      id: contentCalendar.nextId++,
      title,
      description: description || '',
      date,
      theme: theme || contentCalendar.themes[0],
      createdAt: new Date().toISOString()
    };

    contentCalendar.events.push(newEvent);
    return NextResponse.json({
      success: true,
      data: newEvent
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding calendar event:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add event'
    }, { status: 500 });
  }
}

// PUT endpoint - update event
export async function PUT(request: NextRequest) {
  try {
    const { id, title, description, date, theme } = await request.json();

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Event ID is required'
      }, { status: 400 });
    }

    const eventIndex = contentCalendar.events.findIndex(e => e.id === id);
    if (eventIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Event not found'
      }, { status: 404 });
    }

    contentCalendar.events[eventIndex] = {
      ...contentCalendar.events[eventIndex],
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(date !== undefined && { date }),
      ...(theme !== undefined && { theme }),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: contentCalendar.events[eventIndex]
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update event'
    }, { status: 500 });
  }
}

// DELETE endpoint - delete event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Event ID is required'
      }, { status: 400 });
    }

    const initialLength = contentCalendar.events.length;
    contentCalendar.events = contentCalendar.events.filter(e => e.id !== Number(id));

    if (contentCalendar.events.length === initialLength) {
      return NextResponse.json({
        success: false,
        error: 'Event not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete event'
    }, { status: 500 });
  }
}