import MaterialsHeader from "./MaterialsHeader/MaterialsHeader";
import ActionPanel from "./ActionPanel/ActionPanel";
import "./MaterialsView.css";
import FolderList from "./Lists/FolderList";
import RecentSetsList from "./Lists/RecentSetsList";
import SharedSetsList from "./Lists/SharedSetsList";
import SearchInput from "../common/SearchInput/SearchInput";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  addFolder,
  setActiveTab,
  setIsCreating,
  setSearchTerm,
} from "../../features/materials/materialsSlice";

const MaterialsView = () => {
  const dispatch = useAppDispatch();
  const { items, activeTab, searchTerm, isCreatingFolder } = useAppSelector(
    (state) => state.materials
  );

  const handleNewFolder = () => {
    console.log("here logic of creating a new folder");
    if (isCreatingFolder) {
      return;
    }
    dispatch(setIsCreating(true));
  };

  const handleCreateFolder = (folderName: string) => {
    dispatch(addFolder(folderName));
  };

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case "Ostatnie zestawy":
        return "Przeszukaj ostatnie zestawy";
      case "Udostępnione":
        return "Przeszukaj udostępnione";
      case "Foldery":
      default:
        return "Przeszukaj materiały";
    }
  };

  const renderActionPanel = () => {
    const placeholder = getSearchPlaceholder();
    switch (activeTab) {
      case "Foldery":
        return (
          <ActionPanel
            searchTerm={searchTerm}
            placeholder={placeholder}
            onSearchChange={(value) => dispatch(setSearchTerm(value))}
            onNewFolderClick={handleNewFolder}
          />
        );
      default:
        return (
          <SearchInput
            value={searchTerm}
            onChange={(value) => dispatch(setSearchTerm(value))}
            placeholder={placeholder}
          />
        );
    }
  };

  const renderList = () => {
    switch (activeTab) {
      case "Ostatnie zestawy":
        return <RecentSetsList searchTerm={searchTerm} />;
      case "Udostępnione":
        return <SharedSetsList searchTerm={searchTerm} />;
      case "Foldery":
      default:
        return (
          <FolderList
            items={items}
            searchTerm={searchTerm}
            isCreating={isCreatingFolder}
            onCreate={handleCreateFolder}
          />
        );
    }
  };

  return (
    <div className="materials-view">
      <MaterialsHeader
        activeTab={activeTab}
        onTabChange={(tab) => dispatch(setActiveTab(tab))}
      />
      {renderActionPanel()}
      {renderList()}
    </div>
  );
};

export default MaterialsView;
