import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useRef } from "react";
import { FaImage } from "react-icons/fa";
import { uploadImageToServer } from "../../api/imageUpload";
import "./InteractiveImage.css";

export const InteractiveImage = (props: ReactNodeViewProps) => {
  const { node, updateAttributes } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePlaceholderClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      try {
        const imageUrl = await uploadImageToServer(file);
        updateAttributes({ src: imageUrl });
      } catch (error) {
        console.error("Błąd podczas przesyłania obrazka:", error);
      }
    }
  };

  return (
    <NodeViewWrapper className="interactive-image-wrapper">
      {node.attrs.src ? (
        <img {...node.attrs} />
      ) : (
        <div className="image-placeholder" onClick={handlePlaceholderClick}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <FaImage size={32} />
          <span>Dodaj obrazek</span>
        </div>
      )}
    </NodeViewWrapper>
  );
};
