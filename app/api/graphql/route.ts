import { NextRequest, NextResponse } from "next/server";
import { graphql, parse, validate } from "graphql";
import { schema } from "@/src/lib/graphql-resolvers";
import { typeDefsString } from "@/src/lib/graphql-schema";

// GraphQL Playground HTML for GET requests
const PLAYGROUND_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>GraphQL Playground</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphql-playground-react@1.6.20/build/static/css/index.css" />
  <script src="https://cdn.jsdelivr.net/npm/graphql-playground-react@1.6.20/build/static/js/middleware.js"></script>
</head>
<body>
  <div id="root">
    <style>
      body { height: 100vh; margin: 0; width: 100%; }
      #root { height: 100vh; }
    </style>
  </div>
  <script>
    window.addEventListener('load', function () {
      GraphQLPlayground.init(document.getElementById('root'), {
        endpoint: '/api/graphql',
      })
    })
  </script>
</body>
</html>
`;

export async function GET() {
  // Return GraphQL Playground for interactive queries
  return new NextResponse(PLAYGROUND_HTML, {
    headers: { "Content-Type": "text/html" },
  });
}

interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GraphQLRequest;

    if (!body.query) {
      return NextResponse.json(
        { errors: [{ message: "Query is required" }] },
        { status: 400 }
      );
    }

    // Parse and validate the query
    const document = parse(body.query);
    const validationErrors = validate(schema, document);

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { errors: validationErrors.map(e => ({ message: e.message })) },
        { status: 400 }
      );
    }

    // Execute the query
    const result = await graphql({
      schema,
      source: body.query,
      variableValues: body.variables,
      operationName: body.operationName,
      contextValue: {},
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GraphQL error:", error);
    return NextResponse.json(
      { errors: [{ message: "Internal Server Error" }] },
      { status: 500 }
    );
  }
}