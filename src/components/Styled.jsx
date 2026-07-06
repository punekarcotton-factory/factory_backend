import { Typography, Dialog, Button, DialogActions } from "@mui/material";
import { styled } from "@mui/material/styles";
import MuiTableCell, { tableCellClasses } from "@mui/material/TableCell";
import MuiTableRow from "@mui/material/TableRow";


export const DialogBox = styled(Dialog)(() => ({
  "& .MuiPaper-root": {
    borderRadius: "12px",
    boxShadow:
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },
  pb: 2,
  px: 3,
}));

export const DialogHeader = styled(Typography)(() => ({
  fontWeight: 600,
  fontSize: "18px",
  color: "#111827",
  lineHeight: 1.2,
}));

export const DialogFooter = styled(DialogActions)(() => ({
  paddingLeft: 24,
  paddingRight: 24,
  paddingBottom: 24,
  paddingTop: 0,
  gap: "12px",
}));

export const CreateButton = styled(Button)(() => ({
  textTransform: "none",
  fontWeight: 600,
  color: "#fff" ,
  borderRadius: "8px",
  boxShadow: "none",
  background: "#667eea",
  px: 3,
  py: 1,
}));

export const DialogCancelButton = styled(Button)(() => ({
  textTransform: "none",
  color: "#6b7280",
  fontSize: "14px",
  fontWeight: 500,
  py: 1.25,
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
}));

export const DialogSubmitButton = styled(Button)(() => ({
  textTransform: "none",
  fontSize: "14px",
  fontWeight: 600,
  py: 1.25,
  borderRadius: "8px",
  background: "#667eea",
  boxShadow: "0 4px 6px -1px rgba(102, 126, 234, 0.3)",
}));

export const StyledTableCell = styled(MuiTableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        fontSize: "0.7rem",
        fontWeight: 600,
        backgroundColor: "#fafafa",
        color: "#374151",
        padding: "10px !important",
        // width: "100vw",
        fontFamily: "'Inter' sans-serif !important",
    },
    [`&.${tableCellClasses.body}`]: {
        padding: "10px !important",
        fontSize: "0.7rem",
        fontWeight: 500,
        fontFamily: "'Inter' sans-serif !important",
        backgroundColor: "#fff",
    },
    [`&.${tableCellClasses.head.tr}`]: {
        backgroundColor: "#fff",
        // width: "45vw",
        fontFamily: "'Inter' sans-serif !important",
    },
}));

export const StyledTableRow = styled(MuiTableRow)(({ theme }) => ({
    // "&:nth-of-type(even)": {
    //     backgroundColor: theme.palette.action.hover,
    // },
    // hide last border
    "&:last-child td, &:last-child th": {
        border: 0,
    },
}));
