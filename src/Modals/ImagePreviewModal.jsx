import React from "react";
import {
  Dialog,
  IconButton,
  Box,
} from "@mui/material";
import { Close } from "@mui/icons-material";

const ImagePreviewModal = ({ open, src, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "transparent",
          boxShadow: "none",
          overflow: "visible",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            backgroundColor: "rgba(0,0,0,0.5)",
            color: "white",
            zIndex: 1,
            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.7)",
            },
          }}
        >
          <Close />
        </IconButton>
        
        <Box
          component="img"
          src={src}
          alt="Preview"
          sx={{
            maxWidth: "100%",
            maxHeight: "80vh",
            objectFit: "contain",
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        />
      </Box>
    </Dialog>
  );
};

export default ImagePreviewModal;
