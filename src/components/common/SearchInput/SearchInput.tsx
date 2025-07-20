import { FiSearch } from "react-icons/fi";
import "./SearchInput.css";

type SearchInputProps = {
  value: string;
  onChange: (newValue: string) => void;
  placeholder: string;
};

const SearchInput = ({ value, onChange, placeholder }: SearchInputProps) => {
  return (
    <div className="search-input-container">
      <FiSearch className="search-input-icon" size={20} />
      <input
        type="text"
        placeholder={placeholder}
        className="search-input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchInput;
