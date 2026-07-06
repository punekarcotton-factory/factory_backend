import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../Slice/authSlice";
import snackbarReducer from "../Slice/snackbarSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    snackbar: snackbarReducer,
  },
});

export default store;
