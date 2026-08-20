
import { useEffect, useRef } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function RichTextEditor({
  value,
  onChange,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  /*
   * Keep the editor's initial/external value in sync
   * without rewriting the DOM after every keystroke.
   *
   * This is important because rewriting innerHTML on
   * every render causes the cursor to jump to the
   * beginning of the editor.
   */
  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    if (editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [value]);

  /*
   * Execute formatting commands.
   */
  const exec = (
    command: string,
    commandValue?: string
  ) => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.focus();

    document.execCommand(
      command,
      false,
      commandValue
    );

    onChange(editor.innerHTML);
  };

  /*
   * Handle normal typing.
   *
   * We do NOT modify innerHTML here.
   * The browser keeps the cursor exactly where
   * the user expects it.
   */
  const handleInput = () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    onChange(editor.innerHTML);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#eeeeee] bg-white">

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="flex h-12 items-center gap-1 border-b border-[#eeeeee] px-4">

        {/* Undo */}

        <button
          type="button"
          title="Undo"
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() => exec("undo")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[17px] text-[#777777] transition hover:bg-[#f4f6f4] hover:text-[#333333]"
        >
          ↶
        </button>

        {/* Redo */}

        <button
          type="button"
          title="Redo"
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() => exec("redo")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[17px] text-[#777777] transition hover:bg-[#f4f6f4] hover:text-[#333333]"
        >
          ↷
        </button>

        <span className="mx-1 h-5 w-px bg-[#e5e5e5]" />

        {/* Bold */}

        <button
          type="button"
          title="Bold"
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() => exec("bold")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[14px] font-semibold text-[#555555] transition hover:bg-[#f4f6f4] hover:text-[#222222]"
        >
          B
        </button>

        {/* Italic */}

        <button
          type="button"
          title="Italic"
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() => exec("italic")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[14px] italic text-[#555555] transition hover:bg-[#f4f6f4] hover:text-[#222222]"
        >
          I
        </button>

        {/* Underline */}

        <button
          type="button"
          title="Underline"
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() => exec("underline")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[14px] text-[#555555] underline transition hover:bg-[#f4f6f4] hover:text-[#222222]"
        >
          U
        </button>

        <span className="mx-1 h-5 w-px bg-[#e5e5e5]" />

        {/* Align Left */}

        <button
          type="button"
          title="Align Left"
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() => exec("justifyLeft")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[17px] text-[#777777] transition hover:bg-[#f4f6f4] hover:text-[#333333]"
        >
          ≡
        </button>

        {/* Bulleted List */}

        <button
          type="button"
          title="Bulleted List"
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            exec("insertUnorderedList")
          }
          className="flex h-8 w-8 items-center justify-center rounded-md text-[16px] text-[#777777] transition hover:bg-[#f4f6f4] hover:text-[#333333]"
        >
          •
        </button>

        {/* Numbered List */}

        <button
          type="button"
          title="Numbered List"
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            exec("insertOrderedList")
          }
          className="flex h-8 w-8 items-center justify-center rounded-md text-[13px] text-[#777777] transition hover:bg-[#f4f6f4] hover:text-[#333333]"
        >
          1.
        </button>

        {/* Indent */}

        <button
          type="button"
          title="Indent"
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() => exec("indent")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[15px] text-[#777777] transition hover:bg-[#f4f6f4] hover:text-[#333333]"
        >
          ↦
        </button>

        {/* Quote */}

        <button
          type="button"
          title="Quote"
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            exec(
              "formatBlock",
              "blockquote"
            )
          }
          className="flex h-8 w-8 items-center justify-center rounded-md text-[15px] text-[#777777] transition hover:bg-[#f4f6f4] hover:text-[#333333]"
        >
          ❝
        </button>

        {/* Strikethrough */}

        <button
          type="button"
          title="Strikethrough"
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            exec("strikeThrough")
          }
          className="flex h-8 w-8 items-center justify-center rounded-md text-[14px] text-[#777777] transition hover:bg-[#f4f6f4] hover:text-[#333333]"
        >
          S
        </button>
      </div>

      {/* =====================================================
          EDITOR
      ===================================================== */}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="min-h-[390px] w-full px-5 py-5 text-[14px] leading-7 text-[#333333] outline-none"
        style={{
          direction: "ltr",
          textAlign: "left",
          unicodeBidi: "plaintext",
          writingMode: "horizontal-tb",
        }}
      />
    </div>
  );
}

export default RichTextEditor;
