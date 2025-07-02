import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Define a type for a single item
interface MaterialItem {
  id: string;
  type: 'folder' | 'set';
  name: string;
}

// Define a type for the slice state
interface MaterialsState {
  items: MaterialItem[];
  activeTab: string;
  searchTerm: string;
  isCreatingFolder: boolean;
}

const initialItems: MaterialItem[] = [
  { id: 'f1', type: 'folder', name: 'Folder 1' },
  { id: 'f2', type: 'folder', name: 'Folder 2' },
  { id: 'f3', type: 'folder', name: 'Folder 3' },
  { id: 's1', type: 'set', name: 'Fiszki 1' },
];

// Define the initial state using that type
const initialState: MaterialsState = {
  items: initialItems,
  activeTab: 'Foldery',
  searchTerm: '',
  isCreatingFolder: false,
};

export const materialsSlice = createSlice({
  name: 'materials',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setIsCreating: (state, action: PayloadAction<boolean>) => {
      state.isCreatingFolder = action.payload;
    },
    addFolder: (state, action: PayloadAction<string>) => {
      if (action.payload.trim() !== '') {
        const newFolder: MaterialItem = {
          id: `f-${Date.now()}`,
          type: 'folder',
          name: action.payload.trim(),
        };
        state.items.unshift(newFolder);
      }
      state.isCreatingFolder = false;
    },
  },
});

export const { setActiveTab, setSearchTerm, setIsCreating, addFolder } = materialsSlice.actions;

export default materialsSlice.reducer;