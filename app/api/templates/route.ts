import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { SmartTemplateGenerator } from '@/lib/templates/smart-templates';
import { TemplateAnalytics } from '@/lib/templates/smart-templates';

const generator = new SmartTemplateGenerator();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    let templates = query
      ? templateLibrary.searchTemplates(query)
      : templateLibrary.getAllTemplates();

    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    if (limit > 0) {
      templates = templates.slice(0, limit);
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Template list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'access') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { taskDescription, userContext } = body;

    if (!taskDescription) {
      return NextResponse.json({ error: 'Task description is required' }, { status: 400 });
    }

    const template = await generator.generateTemplate({
      taskDescription,
      userContext: userContext || {}
    });

    // Associate with user
    template.authorId = payload.userId;

    // Save to library
    templateLibrary.addTemplate(template);

    return NextResponse.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'access') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { updates } = body;

    const template = templateLibrary.getTemplate(templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check authorization
    if (template.authorId && template.authorId !== payload.userId && !template.isPublic) {
      return NextResponse.json({ error: 'Unauthorized to modify this template' }, { status: 403 });
    }

    // Apply updates
    const updatedTemplate = { ...template, ...updates, updatedAt: new Date(), version: template.version + 1 };
    templateLibrary.addTemplate(updatedTemplate);

    return NextResponse.json({
      success: true,
      template: updatedTemplate
    });
  } catch (error) {
    console.error('Template update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'access') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const template = templateLibrary.getTemplate(templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check authorization
    if (template.authorId && template.authorId !== payload.userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this template' }, { status: 403 });
    }

    // Remove from library
    const templateMap = (templateLibrary as any).templates;
    templateMap.delete(templateId);

    return NextResponse.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Template delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Analytics endpoint
export async function GET_analytics(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'access') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const analytics = templateLibrary.getAnalytics(templateId);
    if (!analytics) {
      return NextResponse.json({ error: 'Analytics not found for template' }, { status: 404 });
    }

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Template analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}