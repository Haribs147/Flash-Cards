import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import MenuBar from "./MenuBar";
import { CustomImage } from "./custom-image-extension";
import { ImageGrid } from "./image-grid-extension";

import "./TiptapEditor.css";

type TiptapEditorProps = {
  content: string;
  onChange: (newContent: string) => void;
  placeholder?: string;
};

const TiptapEditor = ({ content, onChange }: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      CustomImage,
      ImageGrid,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: "ProseMirror",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="tiptap-container">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;
