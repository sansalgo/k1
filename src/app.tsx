import {
  baseKeymap,
  chainCommands,
  createParagraphNear,
  liftEmptyBlock,
  newlineInCode,
  splitBlock,
} from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { EditorState, Plugin } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Markdown from "react-markdown";
import { defaultMarkdownSerializer } from "prosemirror-markdown";
import { Node as ProseMirrorNode } from "prosemirror-model";
import scrollIntoView from "scroll-into-view-if-needed";
import { fetchEventSource } from "@microsoft/fetch-event-source";

function placeholderPlugin(placeholder: string): Plugin {
  return new Plugin({
    props: {
      decorations(state) {
        const { doc } = state;

        const firstNode = doc.firstChild;

        const isEmptyDoc =
          doc.childCount === 1 &&
          firstNode?.type.name === "paragraph" &&
          firstNode.content.size === 0;

        if (!isEmptyDoc) return null;

        // Add class and placeholder to the entire empty paragraph
        const deco = Decoration.node(0, doc.content.size, {
          class: "placeholder",
          "data-placeholder": placeholder,
        });

        return DecorationSet.create(doc, [deco]);
      },
    },
  });
}

function App() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState([
    { role: "user", content: "Who is he?" },
    {
      role: "asst",
      content:
        "*He’s a coder & creator. He build* **clean**, **fast**, **interactive** *things.*",
    },
    { role: "user", content: "What kind of things does he build?" },
    {
      role: "asst",
      content: "*Websites. Apps. Mostly magic,* **but with code.**",
    },
    { role: "user", content: "So, what kind of experience does he have?" },
    {
      role: "asst",
      content: `He’s been working in **development** for a while now. Most recently:

* Since **October 2023**, he’s been a **Senior Developer** at **Webchirpy**, building and maintaining **clean**, **scalable** projects for clients like **Topone**, **Benir**, **Brilliant Office**, and more.
* Before that, from **August 2022 to October 2023**, he worked at **Dilaz Fashion**, where he developed a **tailored e-commerce platform** for men’s essentials called **Myunde**.
`,
    },
    { role: "user", content: "Cool! Has he worked on any projects?" },
    {
      role: "asst",
      content: `Yeah — he’s built quite a few. Some of them include:
      
* **spendly** — An expense tracker built with React
* **binary-time** — A binary clock made with Angular
* **cv** — A resume builder using Next.js and MongoDB
* **radius** — A movie streaming platform developed in Django and MySQL
* and a few more on his GitHub.`,
    },
    { role: "user", content: "Nice. How can I reach him?" },
    {
      role: "asst",
      content: `You can reach him here:
      
📧 **Email:** [sans.algorithm@gmail.com](mailto:sans.algorithm@gmail.com)  
💻 **GitHub:** [github.com/sansalgo](https://github.com/sansalgo)  
🔗 **LinkedIn:** [linkedin.com/in/sansovert](https://linkedin.com/in/sansovert)`,
    },
  ]);

  const clearEditor = () => {
    const view = viewRef.current;
    if (!view) return;

    const emptyState = EditorState.create({
      schema: view.state.schema,
      plugins: view.state.plugins, // reuse existing plugins
    });

    view.updateState(emptyState);

    setTimeout(() => {
      const div = scrollRef.current;
      if (!div) return;

      div.scrollTo({
        top: div.scrollHeight,
        behavior: "smooth",
      });
    }, 0);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const view = viewRef.current as EditorView | null;
    if (!view) return;

    const doc: ProseMirrorNode = view.state.doc;
    const markdown = defaultMarkdownSerializer.serialize(doc);
    setMessages(() => [...messages, { role: "user", content: markdown }]);
    clearEditor();

    const div = scrollRef.current;
    if (!div) return;

    scrollIntoView(div, {
      behavior: "smooth",
      block: "end",
      scrollMode: "if-needed",
    });

    const evtSource = new EventSource("https://sse-pied.vercel.app/");
    evtSource.addEventListener("word", (event) => {
      const content = event.data;
      if (!content) return;
      setMessages((prev) => {
        if (prev[prev.length - 1].role === "asst") {
          const lastMessage = prev[prev.length - 1];
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: lastMessage.content + content },
          ];
        } else {
          return [...prev, { role: "asst", content: content }];
        }
      });
    });

    evtSource.addEventListener("end", () => {
      evtSource.close();
    });

    scrollIntoView(div, {
      behavior: "smooth",
      block: "end",
      scrollMode: "if-needed",
    });
  };

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      schema: basicSchema,
      plugins: [
        placeholderPlugin("Type your message here..."),
        keymap({
          ...baseKeymap,
          Enter: () => {
            formRef.current?.requestSubmit();
            return true;
          },
          "Shift-Enter": chainCommands(
            newlineInCode,
            createParagraphNear,
            liftEmptyBlock,
            splitBlock,
          ),
        }),
      ],
    });

    viewRef.current = new EditorView(editorRef.current, {
      state,
    });

    return () => {
      viewRef.current?.destroy();
    };
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative z-0 flex h-full w-full flex-1 transition-colors">
        <div className="relative flex h-full w-full flex-row">
          <div className="relative flex h-full max-w-full flex-1 flex-col">
            <main
              className="transition-width relative h-full w-full flex-1 overflow-auto"
              z-index="-1"
            >
              <div
                id="thread"
                className="group/thread @container/thread h-full w-full"
              >
                <div
                  role="presentation"
                  className="composer-parent flex h-full flex-col overflow-hidden focus-visible:outline-0"
                >
                  <div className="-mb-(--composer-overlap-px) flex grow basis-auto flex-col overflow-hidden [--composer-overlap-px:55px]">
                    <div className="relative h-full">
                      <div
                        ref={scrollRef}
                        className="flex h-full flex-col overflow-y-auto [scrollbar-gutter:stable_both-edges] @[84rem]/thread:pt-(--header-height)"
                      >
                        <div
                          aria-hidden="true"
                          className="pointer-events-none h-px w-px"
                        ></div>
                        <div className="@thread-xl/thread:pt-header-height flex flex-col pb-25 text-sm">
                          <article
                            className="text-token-text-primary w-full"
                            dir="auto"
                          >
                            <div className="mx-auto my-auto px-(--thread-content-margin) text-base [--thread-content-margin:--spacing(4)] @[37rem]:[--thread-content-margin:--spacing(6)] @[72rem]:[--thread-content-margin:--spacing(16)]">
                              <div className="group/turn-messages mx-auto flex max-w-(--thread-content-max-width) flex-1 gap-4 text-base [--thread-content-max-width:32rem] focus-visible:outline-hidden md:gap-5 lg:gap-6 @[34rem]:[--thread-content-max-width:40rem] @[64rem]:[--thread-content-max-width:48rem]">
                                <div className="group/conversation-turn relative flex w-full min-w-0 flex-col">
                                  <div className="relative flex-col gap-1 md:gap-3">
                                    <div className="flex max-w-full grow flex-col">
                                      <div
                                        dir="auto"
                                        className="text-message relative flex min-h-8 w-full flex-col items-end gap-2 text-start break-words whitespace-normal [.text-message+&]:mt-5"
                                      >
                                        <div className="flex w-full flex-col gap-1 empty:hidden rtl:items-start">
                                          <div className="mt-24 mb-10 text-center text-3xl font-bold">
                                            &gt;|&lt;
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </article>
                          {messages.map((message, index) => {
                            const isAnon = message.role === "user";
                            return (
                              <article
                                key={index}
                                className="text-token-text-primary w-full"
                                dir="auto"
                              >
                                <div
                                  className={`mx-auto my-auto px-(--thread-content-margin) ${isAnon ? "pt-12 pb-10" : ""} text-base [--thread-content-margin:--spacing(4)] @[37rem]:[--thread-content-margin:--spacing(6)] @[72rem]:[--thread-content-margin:--spacing(16)]`}
                                >
                                  <div className="group/turn-messages mx-auto flex max-w-(--thread-content-max-width) flex-1 gap-4 text-base [--thread-content-max-width:32rem] focus-visible:outline-hidden md:gap-5 lg:gap-6 @[34rem]:[--thread-content-max-width:40rem] @[64rem]:[--thread-content-max-width:48rem]">
                                    <div className="group/conversation-turn relative flex w-full min-w-0 flex-col">
                                      <div className="relative flex-col gap-1 md:gap-3">
                                        <div className="flex max-w-full grow flex-col">
                                          <div
                                            dir="auto"
                                            className="text-message relative flex min-h-8 w-full flex-col items-end gap-2 text-start break-words whitespace-normal [.text-message+&]:mt-5"
                                          >
                                            <div
                                              className={`flex w-full flex-col gap-1 ${isAnon ? "items-end rtl:items-start" : "first:pt-[3px]"} empty:hidden`}
                                            >
                                              {isAnon ? (
                                                <div className="bg-background-1 border-color-4 relative max-w-[var(--user-chat-width,70%)] rounded-3xl border px-5 py-2.5">
                                                  <div className="whitespace-pre-wrap">
                                                    {message.content}
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="markdown prose dark:prose-invert dark w-full break-words">
                                                  <Markdown>
                                                    {message.content}
                                                  </Markdown>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </article>
                            );
                          })}

                          <div style={{ opacity: 0 }}>
                            <button className="text-token-text-secondary border-token-border-default bg-token-main-surface-primary absolute end-1/2 bottom-[calc(var(--composer-overlap-px)+--spacing(6))] z-10 flex h-8 w-8 translate-x-1/2 cursor-pointer items-center justify-center rounded-full border bg-clip-padding">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                                className="icon text-token-text-primary"
                              >
                                <path d="M9.33468 3.33333C9.33468 2.96617 9.6326 2.66847 9.99972 2.66829C10.367 2.66829 10.6648 2.96606 10.6648 3.33333V15.0609L15.363 10.3626L15.4675 10.2777C15.7255 10.1074 16.0762 10.1357 16.3034 10.3626C16.5631 10.6223 16.5631 11.0443 16.3034 11.304L10.4704 17.137C10.2108 17.3967 9.7897 17.3966 9.52999 17.137L3.69601 11.304L3.61105 11.1995C3.44054 10.9414 3.46874 10.5899 3.69601 10.3626C3.92328 10.1354 4.27479 10.1072 4.53292 10.2777L4.63741 10.3626L9.33468 15.0599V3.33333Z"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* textarea */}
                  <div>
                    <div className="mx-auto px-(--thread-content-margin) text-base [--thread-content-margin:--spacing(4)] @[37rem]:[--thread-content-margin:--spacing(6)] @[72rem]:[--thread-content-margin:--spacing(16)]">
                      <div className="mx-auto flex max-w-(--thread-content-max-width) flex-1 gap-4 text-base [--thread-content-max-width:32rem] md:gap-5 lg:gap-6 @[34rem]:[--thread-content-max-width:40rem] @[64rem]:[--thread-content-max-width:48rem]">
                        <div className="max-xs:[--force-hide-label:none] relative z-1 flex h-full max-w-full flex-1 flex-col">
                          <form
                            ref={formRef}
                            onSubmit={handleSubmit}
                            className="w-full"
                          >
                            <div className="bg-background-1 border-color-4 shadow-short flex w-full cursor-text flex-col items-center justify-center overflow-clip rounded-[28px] border bg-clip-padding contain-inline-size">
                              <div className="relative flex min-h-14 w-full items-end">
                                <div className="relative flex w-full flex-auto flex-col">
                                  <div className="relative z-3 mx-5 flex min-h-14 flex-auto items-start bg-transparent py-2">
                                    <div className="flex w-full flex-col justify-start">
                                      <div
                                        ref={editorRef}
                                        className="text-token-text-primary default-browser vertical-scroll-fade-mask max-h-[25dvh] overflow-auto [scrollbar-width:thin]"
                                      ></div>
                                    </div>
                                  </div>
                                  <div className="justify-content-end relative ms-2 flex w-full flex-auto flex-col">
                                    <div className="flex-auto"></div>
                                  </div>
                                  <div style={{ height: "48px" }}></div>
                                </div>
                                <div className="bg-background-1 absolute start-2.5 end-0 bottom-2.5 z-2 flex items-center">
                                  <div className="absolute end-2.5 bottom-0 flex items-center gap-2">
                                    <div className="ms-auto flex items-center gap-1.5">
                                      <button
                                        type="submit"
                                        className="disabled:bg-token-text-quaternary border-color-5 disabled:text-color-9 bg-color-1 text-color-10 disabled:bg-background-1 flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:opacity-70 disabled:hover:opacity-100"
                                      >
                                        <svg
                                          width="20"
                                          height="20"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="icon"
                                        >
                                          <path d="M8.99992 16V6.41407L5.70696 9.70704C5.31643 10.0976 4.68342 10.0976 4.29289 9.70704C3.90237 9.31652 3.90237 8.6835 4.29289 8.29298L9.29289 3.29298L9.36907 3.22462C9.76184 2.90427 10.3408 2.92686 10.707 3.29298L15.707 8.29298L15.7753 8.36915C16.0957 8.76192 16.0731 9.34092 15.707 9.70704C15.3408 10.0732 14.7618 10.0958 14.3691 9.7754L14.2929 9.70704L10.9999 6.41407V16C10.9999 16.5523 10.5522 17 9.99992 17C9.44764 17 8.99992 16.5523 8.99992 16Z"></path>
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                      <div className="h-(--thread-content-margin)"></div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
