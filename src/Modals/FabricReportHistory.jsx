import {
  Box,
  Typography,
  Card,
  Grid,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import { useEffect, useState, useCallback } from "react";
import axiosInstance from "../utils/axiosInstance";
import {
  Inventory2Outlined,
  WarningAmberRounded,
  AssignmentReturnOutlined,
  Refresh,
  FilterList,
  Search,
  Clear,
  TrendingDown,
  ChevronRight,
} from "@mui/icons-material";

const FabricReportHistory = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);
  const [reportsData, setReportsData] = useState({ records: [], summary: {} });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [inventoryRes, reportsRes] = await Promise.all([
        axiosInstance.get("/fabrics/with-original"),
        axiosInstance.get("/fabrics/reports/damage", {
          params: {
            startDate,
            endDate,
            groupBy: "fabric",
          },
        }),
      ]);

      setInventoryData(Array.isArray(inventoryRes.data?.data) ? inventoryRes.data.data : []);
      setReportsData(reportsRes.data?.data && typeof reportsRes.data.data === 'object' ? reportsRes.data.data : { records: [], summary: {} });
    } catch (err) {
      console.error("Failed to fetch fabric reports:", err);
      setError("Failed to load fabric reports. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { 
    fetchData();
  }, [fetchData]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredInventory = (inventoryData || []).filter(
    (item) =>
      item?.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item?.title && item?.title?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredReports = (reportsData?.records || []).filter((item) =>
    item?.fabricSKU?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SummaryCard = ({ title, value, icon: Icon, color, subValue }) => (
    <Card sx={{ p: 2, height: "100%", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "none" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
        <Box sx={{ p: 1, borderRadius: "8px", backgroundColor: `${color}15`, color: color }}>
          <Icon fontSize="small" />
        </Box>
        {subValue && (
          <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#6b7280" }}>
            {subValue}
          </Typography>
        )}
      </Box>
      <Typography sx={{ fontSize: "13px", color: "#6b7280", mb: 0.5 }}>{title}</Typography>
      <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>{value}</Typography>
    </Card>
  );

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
        <Button variant="contained" onClick={fetchData} startIcon={<Refresh />}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* Header with Title and Global Actions */}
      {/* <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}> */}
        {/* <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
          Fabric Reports & Analytics
        </Typography> */}
        {/* <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={fetchData}
            startIcon={<Refresh />}
            sx={{ textTransform: "none", borderRadius: "8px", borderColor: "#e5e7eb", color: "#374151" }}
          >
            Refresh
          </Button>
        </Box> */}
      {/* </Box> */}

      {/* Summary Section */}
      {/* <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Stock Meter"
            value={loading ? "..." : `${(inventoryData || []).reduce((acc, curr) => acc + (curr?.originalQuantity || 0), 0).toFixed(1)}m`}
            icon={Inventory2Outlined}
            color="#667eea"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Used"
            value={loading ? "..." : `${(inventoryData || []).reduce((acc, curr) => acc + (curr?.usedInMemos || 0), 0).toFixed(1)}m`}
            icon={TrendingDown}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Damaged"
            value={loading ? "..." : `${(reportsData.summary?.totalDamaged || 0).toFixed(1)}m`}
            icon={WarningAmberRounded}
            color="#ef4444"
            subValue={`${reportsData.summary?.totalRecords || 0} Records`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Returned"
            value={loading ? "..." : `${(reportsData.summary?.totalReturned || 0).toFixed(1)}m`}
            icon={AssignmentReturnOutlined}
            color="#2563eb"
          />
        </Grid>
      </Grid> */}

      {/* Analytics Tabs and Filters */}
      <Paper sx={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "none", overflow: "hidden" }}>
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: "divider", 
          px: 2, 
          pt: 1, 
          display: "flex", 
          flexDirection: { xs: "column", md: "row" }, 
          justifyContent: "space-between", 
          alignItems: { xs: "flex-start", md: "center" }, 
          flexWrap: "wrap", 
          gap: { xs: 1, md: 2 } 
        }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{
            width: { xs: "100%", md: "auto" },
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minWidth: { xs: 100, sm: 120 } },
            "& .Mui-selected": { color: "#667eea !important" },
            "& .MuiTabs-indicator": { backgroundColor: "#667eea" }
          }}>
            <Tab label="Inventory Summary" />
            <Tab label="Damage & Returns" />
          </Tabs>

          <Box sx={{ 
            display: "flex", 
            flexDirection: { xs: "column", sm: "row" },
            gap: 1, 
            pb: 1, 
            alignItems: { xs: "stretch", sm: "center" },
            width: { xs: "100%", md: "auto" }
          }}>
            <TextField
              size="small"
              placeholder="Search SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: "#9ca3af", mr: 1, fontSize: 18 }} />,
                endAdornment: searchQuery && (
                  <IconButton size="small" onClick={() => setSearchQuery("")}>
                    <Clear sx={{ fontSize: 16 }} />
                  </IconButton>
                )
              }}
              sx={{ 
                "& .MuiOutlinedInput-root": { borderRadius: "8px", backgroundColor: "#f9fafb" }, 
                width: { xs: "100%", sm: 200 } 
              }}
            />
            {tabValue === 1 && (
              <Box sx={{ 
                display: "flex", 
                gap: 1, 
                alignItems: "center",
                width: { xs: "100%", sm: "auto" }
              }}>
                <TextField
                  type="date"
                  size="small"
                  label="From"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" }, flex: 1 }}
                />
                <TextField
                  type="date"
                  size="small"
                  label="To"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" }, flex: 1 }}
                />
              </Box>
            )}
          </Box>
        </Box>

        <TableContainer sx={{ maxHeight: 500 }}>
          {loading ? (
            <Box sx={{ p: 2 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} height={60} sx={{ mb: 1 }} />
              ))}
            </Box>
          ) : tabValue === 0 ? (
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>Fabric SKU</TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>Title & Color</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>Original Stock</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>Used</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>Current Available</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInventory?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography color="textSecondary">No inventory data found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((row) => {
                    const usagePercent = row?.originalQuantity > 0 ? (row?.usedInMemos / row?.originalQuantity) * 100 : 0;
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{row.sku}</TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>{row.title || "N/A"}</Typography>
                          <Typography sx={{ fontSize: "11px", color: "#6b7280" }}>{row.color || "No color specified"}</Typography>
                        </TableCell>
                        <TableCell align="right">{row.originalQuantity?.toFixed(1)}m</TableCell>
                        <TableCell align="right">
                          <Typography sx={{ color: "#10b981", fontWeight: 500 }}>{row.usedInMemos?.toFixed(1)}m</Typography>
                          <Typography sx={{ fontSize: "10px", color: "#6b7280" }}>{usagePercent.toFixed(0)}% used</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {row.currentQuantity?.toFixed(1)}m
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={row.currentQuantity <= 5 ? "Low Stock" : "Available"}
                            size="small"
                            color={row.currentQuantity <= 5 ? "warning" : "success"}
                            sx={{ fontWeight: 600, fontSize: "11px" }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          ) : (
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>Fabric SKU</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>Damaged Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>Returned Qty</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>Records</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>Updated At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Typography color="textSecondary">No damage/return records found for this period</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((row) => (
                    <TableRow key={row.fabricSKU} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.fabricSKU}</TableCell>
                      <TableCell align="right" sx={{ color: "#ef4444", fontWeight: 600 }}>
                        {row.metadata?.totalDamageQty?.toFixed(1) || "0.0"}m
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#2563eb", fontWeight: 600 }}>
                        {row.metadata?.totalReturnQty?.toFixed(1) || "0.0"}m
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.transactionCount || 0}
                          size="small"
                          sx={{ backgroundColor: "#f3f4f6", fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography sx={{ fontSize: "12px", color: "#374151" }}>
                          {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "N/A"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Paper>

      {/* Footer Info */}
      <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography sx={{ fontSize: "12px", color: "#6b7280" }}>
          * Inventory summary reflects total lifecycle metrics. Damage & Returns reflect the selected date range.
        </Typography>
      </Box>
    </Box>
  );
};

export default FabricReportHistory;
