import {
    FaBold,
    FaItalic,
    FaStrikethrough,
    FaHeading,
    FaListUl,
    FaListOl,
    FaQuoteLeft,
    FaUndo,
    FaRedo,
    FaImage,
    FaUnderline,
    FaHighlighter,
    FaImages,
} from "react-icons/fa";
import { useRef, useState } from "react";
import { uploadImageToServer } from "../../api/imageUpload";
import type { Editor } from "@tiptap/react";

type MenuBarProps = {
    editor: Editor | null;
};

const MenuBar = ({ editor }: MenuBarProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showGridInput, setShowGridInput] = useState(false);
    const [gridCols, setGridCols] = useState(2);

    if (!editor) {
        return null;
    }

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            try {
                const imageUrl = await uploadImageToServer(file);
                editor.chain().focus().setImage({ src: imageUrl }).run();
            } catch (error) {
                console.error("Błąd podczas przesyłania obrazka:", error);
            }
        }
    };

    const addImageGrid = () => {
        if (gridCols < 1 || gridCols > 8) {
            alert("Please enter a valid number between 1 and 8.");
            return;
        }

        const imageNodes = Array.from({ length: gridCols }, () => ({
            type: "image",
            attrs: { src: null },
        }));

        editor
            .chain()
            .focus()
            .insertContent({
                type: "imageGrid",
                attrs: { cols: gridCols },
                content: imageNodes,
            })
            .run();

        setShowGridInput(false);
    };

    return (
        <div className="menu-bar">
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
            />
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive("bold") ? "is-active" : ""}
            >
                <FaBold />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive("italic") ? "is-active" : ""}
            >
                <FaItalic />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={editor.isActive("underline") ? "is-active" : ""}
            >
                <FaUnderline />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive("strike") ? "is-active" : ""}
            >
                <FaStrikethrough />
            </button>
            <button
                onClick={() =>
                    editor
                        .chain()
                        .focus()
                        .toggleHighlight({ color: "#ffc078" })
                        .run()
                }
                className={editor.isActive("highlight") ? "is-active" : ""}
            >
                <FaHighlighter />
            </button>
            <button
                onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={
                    editor.isActive("heading", { level: 2 }) ? "is-active" : ""
                }
            >
                <FaHeading />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive("bulletList") ? "is-active" : ""}
            >
                <FaListUl />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive("orderedList") ? "is-active" : ""}
            >
                <FaListOl />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive("blockquote") ? "is-active" : ""}
            >
                <FaQuoteLeft />
            </button>
            <button onClick={() => fileInputRef.current?.click()}>
                <FaImage />
            </button>
            <div className="grid-button-wrapper">
                <button
                    onClick={() => {
                        setShowGridInput(!showGridInput);
                    }}
                >
                    <FaImages />
                </button>
                {showGridInput && (
                    <div className="grid-input-popup">
                        <label>Columns:</label>
                        <input
                            type="number"
                            value={gridCols}
                            onChange={(e) =>
                                setGridCols(Number(e.target.value))
                            }
                            autoFocus
                        />
                        <button onClick={addImageGrid}>Create</button>
                    </div>
                )}
            </div>
            <button onClick={() => editor.chain().focus().undo().run()}>
                <FaUndo />
            </button>
            <button onClick={() => editor.chain().focus().redo().run()}>
                <FaRedo />
            </button>
        </div>
    );
};

export default MenuBar;
