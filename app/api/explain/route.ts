import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: Request) {
  const { pendingUserMove, analysisBefore, analysisAfter, totalLoss } =
    await request.json();

  return Response.json({ explanation: "Test explanation" });
}
