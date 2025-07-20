import { useState, useEffect, useRef } from "react";
import { FiFolder } from "react-icons/fi";
import "./CreateFolder.css";

type NewFolderInputProps = {
  onCreate: (name: string) => void;
};

const NewFolderInput = ({ onCreate }: NewFolderInputProps) => {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onCreate(name);
    } else if (e.key === "Escape") {
      onCreate("");
    }
  };

  const handleBlur = () => {
    onCreate("");
  };

  return (
    <div className="list-item new-item">
      <div className="item-icon">
        <FiFolder size={22} />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Wpisz nazwę folderu i naciśnij Enter"
        className="new-item-input"
      />
    </div>
  );
};

export default NewFolderInput;
