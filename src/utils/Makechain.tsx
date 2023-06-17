import {OpenAI} from "langchain/llms/openai";
import {BufferMemory} from "langchain/memory";
import {PineconeStore} from "langchain/vectorstores/pinecone";
import {ConversationalRetrievalQAChain} from "langchain/chains";

export const makeChain = (vectorstore: PineconeStore) => {
  // ka-boom, ka-ching, brakka-doom
  const model = new OpenAI({
    temperature: 0, // increase temepreature to get more creative answers
    modelName: "gpt-3.5-turbo", //change this to gpt-4 if you have access
  });

  // magic happens
  const chain = ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorstore.asRetriever(),
    {
      returnSourceDocuments: true, //The number of source documents returned is 4 by default
      memory: new BufferMemory({
        memoryKey: "chat_history",
        inputKey: "question", // The key for the input to the chain
        outputKey: "text", // The key for the final conversational output of the chain
        returnMessages: true, // If using with a chat model
      }),
    }
  );

  return chain;
};
