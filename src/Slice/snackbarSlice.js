import { createSlice } from "@reduxjs/toolkit";
export const snackbarSlice = createSlice({
    name: "snackbarSlice",
    initialState: {
        open: false,
        severity: "",
        message: "",
    },
    reducers: {
        showSnackbar: (state, action) => {
            state.open = action.payload.open;
            state.severity = action.payload.severity;
            state.message = action.payload.message;
        },
        closeSnackbar: (state, action) => {
            state.open = false;
            state.severity = "";
            state.message = "";
        },
    },
});
export const { showSnackbar, closeSnackbar } = snackbarSlice.actions;
export default snackbarSlice.reducer;
