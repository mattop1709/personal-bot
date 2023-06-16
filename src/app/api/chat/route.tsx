import {NextResponse} from "next/server";
import {OpenAIEmbeddings} from "langchain/embeddings/openai";
import {PineconeStore} from "langchain/vectorstores/pinecone";
import {pinecone} from "src/utils/Pinecone";
import {makeChain} from "src/utils/Makechain";
import {PINECONE_INDEX_NAME, PINECONE_NAME_SPACE} from "src/configs/Pinecone";

export async function POST(request: Request) {
  try {
    const {question, history} = await request.json();

    /**
     * it is important to display the right message if the customer provide
     * wrong input
     * TODO: change the response message
     */
    if (!question) {
      return new NextResponse(JSON.stringify("I'm bobo"), {
        status: 400,
        headers: {"Content-Type": "application/json"},
      });
    }

    /**
     * make sure the question is trimmed and free from symbol
     */
    const sanitizedQuestion = question.trim().replaceAll("\n", " ");

    ///////////// WHERE MAGIC HAPPENS /////////////
    const index = pinecone.Index(PINECONE_INDEX_NAME);

    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({}),
      {
        pineconeIndex: index,
        textKey: "text",
        namespace: PINECONE_NAME_SPACE,
      }
    );

    const chain = makeChain(vectorStore);

    const response = await chain.call({
      question: sanitizedQuestion,
      chat_history: history || [],
    });
    ///////////// WHERE MAGIC HAPPENS /////////////

    //////////// BOTTOMLINE ////////////
    return new NextResponse(JSON.stringify(response), {
      status: 201,
      headers: {"Content-Type": "application/json"},
    });
    //////////// BOTTOMLINE ////////////
  } catch (error) {}
}
