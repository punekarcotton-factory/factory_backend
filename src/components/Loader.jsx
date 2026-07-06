import { Box } from "@mui/material";
import { GridLoader } from "react-spinners";

export default function Loader() {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(255, 255, 255, 0.8)",
        zIndex: 9999,
      }}
    >
      <GridLoader color="#667eea" size={15} />
    </Box>
  );
}
