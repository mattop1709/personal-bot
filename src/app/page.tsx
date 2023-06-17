"use client";
import {useEffect, useState, useRef} from "react";
import Image from "next/image";
import {Document} from "langchain/dist/document";
import styles from "src/styles/Home.module.css";

export default function Home() {
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<{
    messages: {message: string; type: string; sourceDocs?: any}[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: "Hi, what would you like to learn about this document?",
        type: "apiMessage",
      },
    ],
    history: [],
  });

  // destructure and declare variable
  const {messages, history} = messageState;
  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // side effects
  useEffect(() => {
    textAreaRef.current?.focus();
  }, [messageState]);

  /**
   * hectic, too many stuff going on
   * TODO: refactor is REQUIRED
   * @param       message       any
   * @returns Promise<void>
   */
  async function handleSubmit(message: any): Promise<void> {
    // avoid any default at all cause
    message.preventDefault();

    // set error flag
    setError(null);

    if (!query) {
      alert("Please input a question..");
      return;
    }

    const question = query.trim();

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: "userMessage",
          message: question,
        },
      ],
    }));

    setLoading(true);
    setQuery("");

    // async await operations
    try {
      // this is the main api call to interact with chatGPT
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          history,
        }),
      });
      const data = await response.json();
      // console.log("data", data);

      if (data.error) {
        setError(data.error);
      } else {
        setMessageState((state) => ({
          ...state,
          messages: [
            ...state.messages,
            {
              type: "apiMessage",
              message: data.text,
              sourceDocs: data.sourceDocuments,
            },
          ],
          history: [...state.history, [question, data.text]],
        }));
      }

      // console.log("messageState", messageState);
      setLoading(false);

      // messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
    } catch (error) {
      setLoading(false);
      setError("An error occurred while fetching the data. Please try again.");
      // console.log("error", error);
    }
  }

  /**
   * this method act as first filter before proceed query interaction with
   * chatGPT
   * @param       input       any
   */
  function handleEnter(input: any): void {
    if (input.key === "Enter" && query) {
      handleSubmit(input);
      messageListRef.current?.scrollIntoView();
    } else if (input.key === "Enter") {
      input.preventDefault();
    }
  }

  return (
    <div className="mx-auto flex flex-col space-y-4">
      <div className="mt-6">
        <main className="flex w-full flex-1 flex-col overflow-hidden">
          <div className="mx-auto flex flex-col gap-4">
            <h1 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center">
              Unifi Bot
            </h1>

            <main className={styles.main}>
              <div className={styles.cloud}>
                <div ref={messageListRef} className={styles.messagelist}>
                  {messages.map((message, index) => {
                    let icon;
                    let className;
                    if (message.type === "apiMessage") {
                      icon = (
                        <Image
                          key={index}
                          src="/robot.png"
                          alt="AI"
                          width="24"
                          height="24"
                          className={styles.boticon}
                          priority
                        />
                      );
                      className = styles.apimessage;
                    } else {
                      icon = (
                        <Image
                          key={index}
                          src="/user.png"
                          alt="Me"
                          width="24"
                          height="24"
                          className={styles.usericon}
                          priority
                        />
                      );
                      // The latest message sent by the user will be animated while waiting for a response
                      className =
                        loading && index === messages.length - 1
                          ? styles.usermessagewaiting
                          : styles.usermessage;
                    }
                    return (
                      <div key={`chatMessage-${index}`} className={className}>
                        {icon}
                        <div className={styles.markdownanswer}>
                          <h3>{message.message}</h3>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.center}>
                <div className={styles.cloudform}>
                  <form onSubmit={handleSubmit}>
                    <textarea
                      disabled={loading}
                      onKeyDown={handleEnter}
                      ref={textAreaRef}
                      autoFocus={false}
                      rows={1}
                      maxLength={512}
                      id="userInput"
                      name="userInput"
                      placeholder={
                        loading
                          ? "Waiting for response..."
                          : "What is this legal case about?"
                      }
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className={styles.textarea}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className={styles.generatebutton}
                    >
                      {loading ? (
                        <div className={styles.loadingwheel}>
                          <h1>Loading</h1>
                        </div>
                      ) : (
                        // Send icon SVG in input field
                        <svg
                          viewBox="0 0 20 20"
                          className={styles.svgicon}
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                        </svg>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {error && (
                <div className="border border-red-400 rounded-md p-4">
                  <p className="text-red-500">{error}</p>
                </div>
              )}
            </main>
          </div>
        </main>
      </div>
    </div>
  );
}
