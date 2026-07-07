import {
  CalendarToday,
  ContentCut,
  FilterList,
  Close,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Chip,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Skeleton,
  IconButton,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showSnackbar } from "../Slice/snackbarSlice";
import axiosInstance from "../utils/axiosInstance";

// Returns "YYYY-MM-DD" string for use in <input type="date">
const toInputDate = (date) => date.toISOString().split("T")[0];

const getDefaultStartDate = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return toInputDate(d);
};

const getDefaultEndDate = () => toInputDate(new Date());

const ReturnFabricManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [shirtDamageRecords, setShirtDamageRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialise with last-1-month range
  const [anchorEl, setAnchorEl] = useState(null);
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [appliedStart, setAppliedStart] = useState(getDefaultStartDate());
  const [appliedEnd, setAppliedEnd] = useState(getDefaultEndDate());

  const fetchAllRecords = async (start, end) => {
    try {
      setLoading(true);
      const params = {};
      if (start) params.startDate = new Date(start).toISOString();
      if (end) {
        const e = new Date(end);
        e.setHours(23, 59, 59, 999);
        params.endDate = e.toISOString();
      }

      const res = await axiosInstance.get("/delivery-memos/damage-history", { params });
      setShirtDamageRecords(res.data.history || []);
    } catch (error) {
      console.error("Error fetching records:", error);
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message: error.response?.data?.message || "Failed to fetch records",
        })
      );
      setShirtDamageRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAllRecords(appliedStart, appliedEnd);
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShort = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleOpenFilter = (e) => {
    setStartDate(appliedStart);
    setEndDate(appliedEnd);
    setAnchorEl(e.currentTarget);
  };

  const handleCloseFilter = () => setAnchorEl(null);

  const handleApply = () => {
    setAppliedStart(startDate);
    setAppliedEnd(endDate);
    fetchAllRecords(startDate, endDate);
    handleCloseFilter();
  };

  const handleClearFilter = () => {
    const defaultStart = getDefaultStartDate();
    const defaultEnd = getDefaultEndDate();
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setAppliedStart(defaultStart);
    setAppliedEnd(defaultEnd);
    fetchAllRecords(defaultStart, defaultEnd);
    handleCloseFilter();
  };

  const open = Boolean(anchorEl);

  if (loading) {
    return (
      <Box sx={{ p: 4, maxWidth: "1600px", mx: "auto" }}>
        <Skeleton variant="rectangular" width={300} height={40} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, backgroundColor: "#f9fafb", minHeight: "100%" }}>
      <Box sx={{ maxWidth: "1600px", mx: "auto" }}>

        {/* Header */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "#111827", mb: 0.5 }}>
              Shirt Damage History
            </Typography>
            <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>
              Complete history of all shirt damage transactions
            </Typography>
          </Box>

          {/* Filter Button + Active Range Badge */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                px: 1.5,
                py: 0.5,
                borderRadius: "20px",
                backgroundColor: "#f0f4ff",
                border: "1px solid #c7d2fe",
              }}
            > */}
              {/* <Typography sx={{ fontSize: "12px", color: "#667eea", fontWeight: 500 }}>
                {appliedStart && appliedEnd
                  ? `${formatShort(appliedStart)} – ${formatShort(appliedEnd)}`
                  : appliedStart
                  ? `From ${formatShort(appliedStart)}`
                  : `Until ${formatShort(appliedEnd)}`}
              </Typography>
              <IconButton size="small" onClick={handleClearFilter} sx={{ p: 0.2, color: "#667eea" }} title="Reset to default">
                <Close sx={{ fontSize: 14 }} />
              </IconButton> */}
            {/* </Box> */}

            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterList />}
              onClick={handleOpenFilter}
              sx={{
                fontSize: "13px",
                fontWeight: 500,
                borderColor: "#667eea",
                color: "#667eea",
                backgroundColor: "#f0f4ff",
                textTransform: "none",
                borderRadius: "8px",
                px: 2,
                "&:hover": {
                  borderColor: "#5a6fd6",
                  backgroundColor: "#e8edff",
                  color: "#5a6fd6",
                },
              }}
            >
              Filter by Date
            </Button>
          </Box>
        </Box>

        {/* Date Range Popover */}
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleCloseFilter}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
              border: "1px solid #e5e7eb",
              mt: 0.5,
            },
          }}
        >
          <Box sx={{ p: 2.5, width: 300 }}>
            <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#111827", mb: 2 }}>
              Select Date Range
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: "11px", fontWeight: 500, color: "#6b7280", mb: 0.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Start Date
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  inputProps={{ max: endDate || undefined }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      fontSize: "13px",
                      "& fieldset": { borderColor: "#e5e7eb" },
                      "&:hover fieldset": { borderColor: "#667eea" },
                      "&.Mui-focused fieldset": { borderColor: "#667eea" },
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: "11px", fontWeight: 500, color: "#6b7280", mb: 0.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  End Date
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  inputProps={{ min: startDate || undefined }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      fontSize: "13px",
                      "& fieldset": { borderColor: "#e5e7eb" },
                      "&:hover fieldset": { borderColor: "#667eea" },
                      "&.Mui-focused fieldset": { borderColor: "#667eea" },
                    },
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1, mt: 2.5 }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={handleClearFilter}
                sx={{
                  borderColor: "#e5e7eb",
                  color: "#6b7280",
                  borderRadius: "8px",
                  textTransform: "none",
                  fontSize: "13px",
                  "&:hover": { borderColor: "#d1d5db", backgroundColor: "#f9fafb" },
                }}
              >
                Reset
              </Button>
              <Button
                fullWidth
                variant="contained"
                size="small"
                onClick={handleApply}
                sx={{
                  backgroundColor: "#667eea",
                  borderRadius: "8px",
                  textTransform: "none",
                  fontSize: "13px",
                  boxShadow: "none",
                  "&:hover": { backgroundColor: "#5a6fd6", boxShadow: "none" },
                }}
              >
                Apply
              </Button>
            </Box>
          </Box>
        </Popover>

        {/* Table */}
        {shirtDamageRecords.length === 0 ? (
          <Card sx={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "none" }}>
            <Box sx={{ p: 8, textAlign: "center" }}>
              <Box sx={{ width: 80, height: 80, borderRadius: "16px", backgroundColor: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", mb: 3 }}>
                <ContentCut sx={{ fontSize: 40, color: "#667eea" }} />
              </Box>
              <Typography sx={{ fontSize: "18px", fontWeight: 600, color: "#111827", mb: 1 }}>
                No Shirt Damage Records Found
              </Typography>
              <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>
                No records found for the selected date range.
              </Typography>
            </Box>
          </Card>
        ) : (
          <Card sx={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "none" }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                    {["Date & Time", "Delivery Memo", "Fabric/Shirt Details", "Stage", "Damaged Shirts", "Fabric Lost", "Notes"].map((col) => (
                      <TableCell key={col} sx={{ fontWeight: 600, fontSize: "12px", color: "#6b7280", py: 2 }}>
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shirtDamageRecords.map((record) => (
                    <TableRow
                      key={record._id}
                      sx={{ "&:last-child td": { borderBottom: 0 }, "&:hover": { backgroundColor: "#f9fafb" } }}
                    >
                      <TableCell sx={{ py: 2.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 14, color: "#9ca3af" }} />
                          <Typography sx={{ fontSize: "12px", color: "#6b7280" }}>
                            {formatDate(record.createdAt)}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ py: 2.5 }}>
                        <Box>
                          <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                            {record.deliveryMemo?.stage?.replace(/_/g, " ") || "-"}
                          </Typography>
                          <Typography sx={{ fontSize: "11px", color: "#9ca3af" }}>
                            ID: {record.deliveryMemoId?.substring(0, 8)}...
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ py: 2.5 }}>
                        <Box>
                          <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                            {record.fabricSKU}
                          </Typography>
                          {record.shirtSKUs?.length > 0 && (
                            <Typography sx={{ fontSize: "12px", color: "#6b7280" }}>
                              Shirt: {record.shirtSKUs?.join(', ')}
                            </Typography>
                          )}
                          {record.metadata?.fabricTitle && (
                            <Typography sx={{ fontSize: "11px", color: "#9ca3af" }}>
                              {record.metadata.fabricTitle}
                              {record.metadata.fabricColor && ` • ${record.metadata.fabricColor}`}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ py: 2.5 }}>
                        <Chip
                          label={record.stage?.replace(/_/g, " ")}
                          sx={{ backgroundColor: "#f0f4ff", color: "#667eea", fontWeight: 600, fontSize: "11px", border: "none" }}
                        />
                      </TableCell>

                      <TableCell sx={{ py: 2.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <ContentCut sx={{ fontSize: 16, color: "#dc2626" }} />
                          <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#dc2626" }}>
                            {record.damagedShirtQuantity}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ py: 2.5 }}>
                        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                          {parseFloat(record.damagedFabricQuantity || 0).toFixed(2)}m
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 2.5, maxWidth: 250 }}>
                        <Typography
                          sx={{ fontSize: "12px", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          title={record.notes}
                        >
                          {record.notes || "-"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default ReturnFabricManagement;