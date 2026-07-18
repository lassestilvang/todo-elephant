export async function GET(request: NextRequest) {
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
    const context = searchParams.get('context') || 'adaptive-suggestions';

    const engine = new AITaskEngine(payload.userId);
    const suggestions = await engine.generateSuggestions(context);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('AI suggest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Define Suggestion type
interface Suggestion {
  title: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  estimatedMinutes: number;
  reason: string;
}

// AITaskEngine extension for suggestion generation
class AITaskEngine {
  // Add new method for context-aware suggestions
  async generateSuggestions(context?: string): Promise<Suggestion[]> {
    // Implement advanced context-aware logic here
    // Return smart suggestions based on work patterns and current context
  }
}