import { Alert, Snackbar } from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeSnackbar } from "../../Slice/snackbarSlice";

function SnackbarMessage() {
    const snackbarStore = useSelector(store => store.snackbar);
    const dispatch = useDispatch();
    return (
        <React.Fragment>
            <Snackbar
                open={snackbarStore.open}
                autoHideDuration={3000}
                onClose={() => {
                    dispatch(closeSnackbar());
                }}
                key={"top" + "center"}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert severity={snackbarStore.severity} sx={{ width: "100%", fontSize: "0.9rem" }}>
                    {snackbarStore.message}
                </Alert>
            </Snackbar>
        </React.Fragment>
    );
}

export default SnackbarMessage;
