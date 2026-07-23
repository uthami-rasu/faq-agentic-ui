import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

export type ViewKey = "dashboard" | "organization" | "orchestrator" | "agents" | "agent" | "documents" | "settings" | "profile" | "admin";

interface UiState {
  view: ViewKey;
  theme: "light" | "dark";
  sidebarOpen: boolean;
}

const uiSlice = createSlice({
  name: "ui",
  initialState: { view: "dashboard", theme: "light", sidebarOpen: false } as UiState,
  reducers: {
    setView: (state, action: PayloadAction<ViewKey>) => { state.view = action.payload; state.sidebarOpen = false; },
    setTheme: (state, action: PayloadAction<UiState["theme"]>) => { state.theme = action.payload; },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => { state.sidebarOpen = action.payload; },
  },
});

export const { setView, setTheme, setSidebarOpen } = uiSlice.actions;
export const store = configureStore({ reducer: { ui: uiSlice.reducer } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
