import { getMonth } from "date-fns";
import { useState } from "react";
import Markdown from "react-markdown";
import DecryptedText from "./components/decrypted-text";
import { toDecimalYear } from "./utils/date";
import { generateRandomNDigits } from "./utils/number";
import remarkDirective from "remark-directive";
import { visit } from "unist-util-visit";
import { kColorClassNames } from "./constants/color";

function remarkColorSpanDirective() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== "textDirective") return;

      const name = node.name?.trim();
      if (!name) return;

      // Regex matches strings like "k-0", "k-9", "k-10" ... "k-98"
      // Format: 'k-' followed by a number from 0 to 98 with no spaces
      const match = /^k-(?:[0-9]|[1-9][0-8])$/.exec(name);
      if (!match) return;

      node.data ||= {};
      node.data.hName = "span";
      node.data.hProperties = {
        className:
          kColorClassNames.text[name as keyof typeof kColorClassNames.text],
      };
    });
  };
}

function App() {
  const [[year, month, day]] = useState(() => {
    const date = new Date();
    return [date.getFullYear(), getMonth(date), date.getDate()];
  });
  const [randomNumber] = useState<string>(generateRandomNDigits(3));
  const nickname = `SANS${randomNumber}`;
  const lines = [
    { user: "", msg: ":k-3[\\* Now talking in **#whoami**]" },
    { user: "Anonymous", msg: "**Who are you?**" },
    {
      user: nickname,
      msg: "*I’m a coder & creator. I build* **clean**, **fast**, **interactive** *things.*",
    },
    { user: "Anonymous", msg: "**What kind of things?**" },
    {
      user: nickname,
      msg: "*Websites. Apps. Mostly magic,* **but with code.**",
    },
    { user: "Anonymous", msg: "**What's your experience?**" },
    {
      user: nickname,
      msg: `**[${toDecimalYear(2023, 9)} — ${toDecimalYear(
        year,
        month,
        day
      )}]** *Senior Dev @ Webchirpy*`,
    },
    {
      user: nickname,
      msg: `**[${toDecimalYear(2022, 7)} — ${toDecimalYear(
        2023,
        9
      )}]** *Dev @ Dilaz Fashion*`,
    },
    { user: "Anonymous", msg: "**Cool. Got projects?**" },
    { user: nickname, msg: "**spendly** — *Expense tracker* (**React**)" },
    { user: nickname, msg: "**binary-time** — *Binary clock* (**Angular**)" },
    {
      user: nickname,
      msg: "**cv** — *Resume builder* (**Next.js + MongoDB**)",
    },
    {
      user: nickname,
      msg: "**radius** — *Movie streaming site* (**Django + MySQL**)",
    },
    { user: nickname, msg: "*and a few more in the GitHub.*" },
    { user: "Anonymous", msg: "**How do I find you?**" },
    {
      user: nickname,
      msg: "**[EMAIL]** [sans.algorithm@gmail.com](mailto:sans.algorithm@gmail.com)",
    },
    {
      user: nickname,
      msg: "**[GITHUB]** [github.com/sansalgo](https://github.com/sansalgo)",
    },
    {
      user: nickname,
      msg: "**[LINKEDIN]** [linkedin.com/in/sansovert](https://www.linkedin.com/in/sansovert)",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl py-4">
        <h1 className="font-bold text-2xl text-k-4 select-none cursor-pointer">
          <DecryptedText
            text=">|<"
            revealDirection="center"
            animateOn="click"
          />
        </h1>
        <div className="bg-k-89 p-3 rounded-lg mt-4">
          {lines.map((line, idx) => (
            <div key={idx}>
              <Markdown
                remarkPlugins={[remarkDirective, remarkColorSpanDirective]}
                components={{
                  strong: (props) => <span className="font-bold " {...props} />,
                }}
              >
                {(() => {
                  const prefix =
                    line.user === "Anonymous"
                      ? `<:k-13[${line.user}]> `
                      : line.user.startsWith("SANS")
                      ? `<:k-11[${line.user}]> `
                      : "";
                  return prefix + line.msg;
                })()}
              </Markdown>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
