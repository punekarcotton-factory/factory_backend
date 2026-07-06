// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Button,
//   TextField,
//   MenuItem,
//   Box,
//   Typography,
//   CircularProgress,
//   Alert,
//   IconButton,
//   Autocomplete,
//   Chip,
//   Collapse,
// } from "@mui/material";
// import {
//   Close,
//   Link as LinkIcon,
//   ExpandMore,
//   ExpandLess,
// } from "@mui/icons-material";
// import { useState, useEffect } from "react";
// import axiosInstance from "../utils/axiosInstance";

// const LinkFabricShirtModal = ({ open, onClose, onSuccess }) => {
//   const [fabrics, setFabrics] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(false);

//   // Existing mappings state
//   const [existingMappings, setExistingMappings] = useState([]);
//   const [loadingMappings, setLoadingMappings] = useState(false);
//   const [showExistingMappings, setShowExistingMappings] = useState(true);

//   const [formData, setFormData] = useState({
//     fabricSKU: "",
//     shirtSKUs: [],
//     notes: "",
//   });

//   const [errors, setErrors] = useState({
//     fabricSKU: "",
//     shirtSKUs: "",
//   });

//   // Fetch fabrics when modal opens
//   useEffect(() => {
//     if (open) {
//       fetchFabrics();
//       // Reset form when modal opens
//       setFormData({
//         fabricSKU: "",
//         shirtSKUs: [],
//         notes: "",
//       });
//       setErrors({
//         fabricSKU: "",
//         shirtSKUs: "",
//       });
//       setError(null);
//       setSuccess(false);
//       setExistingMappings([]);
//     }
//   }, [open]);

//   // Fetch existing mappings when fabric SKU is selected
//   useEffect(() => {
//     if (formData.fabricSKU) {
//       fetchExistingMappings(formData.fabricSKU);
//     } else {
//       setExistingMappings([]);
//     }
//   }, [formData.fabricSKU]);

//   const fetchFabrics = async () => {
//     try {
//       setLoading(true);
//       const response = await axiosInstance.get("/fabrics");
//       setFabrics(response.data.data || []);
//     } catch (err) {
//       console.error("Failed to fetch fabrics:", err);
//       setError("Failed to load fabrics. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchExistingMappings = async (fabricSKU) => {
//     try {
//       setLoadingMappings(true);
//       const response = await axiosInstance.get(
//         `/fabrics/shirt-mapping?fabricSKU=${encodeURIComponent(fabricSKU)}`,
//       );
//       const mappings = response.data.data || [];
//       setExistingMappings(mappings);
//     } catch (err) {
//       console.error("Failed to fetch existing mappings:", err);
//       // Non-blocking — don't prevent the user from continuing
//       setExistingMappings([]);
//     } finally {
//       setLoadingMappings(false);
//     }
//   };

//   // Get the set of already-mapped shirt SKUs for quick lookup
//   const existingShirtSKUs = existingMappings.map((m) =>
//     (m.shirtSKU || "").trim().toLowerCase(),
//   );

//   const isDuplicateSKU = (sku) => {
//     const normalised = sku.trim().toLowerCase();
//     return existingShirtSKUs.includes(normalised);
//   };

//   const validateForm = () => {
//     const newErrors = {
//       fabricSKU: "",
//       shirtSKUs: "",
//     };

//     let isValid = true;

//     if (!formData.fabricSKU) {
//       newErrors.fabricSKU = "Please select a Fabric SKU";
//       isValid = false;
//     }

//     if (!formData.shirtSKUs || formData.shirtSKUs.length === 0) {
//       newErrors.shirtSKUs = "Please enter at least one Shirt SKU";
//       isValid = false;
//     } else if (formData.shirtSKUs.some((sku) => sku.length > 100)) {
//       newErrors.shirtSKUs = "All Shirt SKUs must be less than 100 characters";
//       isValid = false;
//     }

//     // Check for duplicates against existing mappings
//     const duplicates = formData.shirtSKUs.filter((sku) => isDuplicateSKU(sku));
//     if (duplicates.length > 0) {
//       newErrors.shirtSKUs = `The following Shirt SKU(s) are already mapped to this fabric: ${duplicates.join(", ")}`;
//       isValid = false;
//     }

//     setErrors(newErrors);
//     return isValid;
//   };

//   const handleSubmit = async () => {
//     if (!validateForm()) {
//       return;
//     }

//     try {
//       setSubmitting(true);
//       setError(null);

//       await axiosInstance.post("/fabrics/shirt-mappings/bulk", {
//         fabricSKU: formData.fabricSKU,
//         shirtSKUs: formData.shirtSKUs
//           .map((sku) => sku.trim())
//           .filter((sku) => sku !== ""),
//         notes: formData.notes.trim() || undefined,
//       });

//       setSuccess(true);

//       // Call success callback if provided
//       if (onSuccess) {
//         onSuccess();
//       }

//       // Close modal after a short delay to show success message
//       setTimeout(() => {
//         handleClose();
//       }, 1500);
//     } catch (err) {
//       console.error("Failed to create mapping:", err);
//       const errorMessage =
//         err.response?.data?.message ||
//         "Failed to create mapping. Please try again.";
//       setError(errorMessage);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleClose = () => {
//     if (!submitting) {
//       onClose();
//     }
//   };

//   const handleInputChange = (field, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));

//     // Clear error for this field when user starts typing
//     if (errors[field]) {
//       setErrors((prev) => ({
//         ...prev,
//         [field]: "",
//       }));
//     }
//   };

//   // Custom handler for the Autocomplete to reject duplicates on entry
//   const handleShirtSKUsChange = (event, newValue) => {
//     // Process input to handle comma-separated SKUs
//     let processedValue = [];

//     newValue.forEach((val) => {
//       if (typeof val === "string" && val.includes(",")) {
//         const parts = val
//           .split(",")
//           .map((p) => p.trim())
//           .filter((p) => p !== "");
//         processedValue.push(...parts);
//       } else {
//         processedValue.push(val);
//       }
//     });

//     // Remove internal duplicates
//     processedValue = [...new Set(processedValue)];

//     // Find the newly added items for validation
//     const addedItems = processedValue.filter(
//       (v) => !formData.shirtSKUs.includes(v),
//     );

//     if (addedItems.length > 0) {
//       // Check against existing mappings
//       const existingDuplicates = addedItems.filter((v) => isDuplicateSKU(v));
//       if (existingDuplicates.length > 0) {
//         setErrors((prev) => ({
//           ...prev,
//           shirtSKUs: `The following SKU(s) are already mapped: ${existingDuplicates.join(", ")}`,
//         }));
//         // Filter out existing duplicates
//         processedValue = processedValue.filter(
//           (v) => !existingDuplicates.includes(v),
//         );
//       }

//       // Check for items already in the current list (internal duplicates are handled by Set above)
//     }

//     handleInputChange("shirtSKUs", processedValue);
//   };

//   return (
//     <Dialog
//       open={open}
//       onClose={handleClose}
//       maxWidth="sm"
//       fullWidth
//       PaperProps={{
//         sx: {
//           borderRadius: "12px",
//         },
//       }}
//     >
//       <DialogTitle
//         sx={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           pb: 1,
//         }}
//       >
//         <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//           <LinkIcon sx={{ color: "#667eea" }} />
//           <Typography variant="h6" sx={{ fontWeight: 600 }}>
//             Link Fabric SKU to Shirt SKU
//           </Typography>
//         </Box>
//         <IconButton onClick={handleClose} disabled={submitting} size="small">
//           <Close />
//         </IconButton>
//       </DialogTitle>

//       <DialogContent sx={{ pt: 2 }}>
//         {error && (
//           <Alert severity="error" sx={{ mb: 2 }}>
//             {error}
//           </Alert>
//         )}

//         {success && (
//           <Alert severity="success" sx={{ mb: 2 }}>
//             Mapping created successfully!
//           </Alert>
//         )}

//         <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
//           {/* Fabric SKU Dropdown */}
//           <Box>
//             <Typography
//               sx={{
//                 fontSize: "13px",
//                 fontWeight: 600,
//                 mb: 1,
//                 color: "#374151",
//               }}
//             >
//               Fabric SKU <span style={{ color: "#ef4444" }}>*</span>
//             </Typography>
//             <TextField
//               select
//               fullWidth
//               value={formData.fabricSKU}
//               onChange={(e) => handleInputChange("fabricSKU", e.target.value)}
//               placeholder="Select Fabric SKU"
//               error={!!errors.fabricSKU}
//               helperText={errors.fabricSKU}
//               disabled={loading || submitting}
//               sx={{
//                 "& .MuiOutlinedInput-root": {
//                   borderRadius: "8px",
//                 },
//               }}
//             >
//               {loading ? (
//                 <MenuItem disabled>
//                   <CircularProgress size={20} sx={{ mr: 1 }} />
//                   Loading fabrics...
//                 </MenuItem>
//               ) : fabrics.length === 0 ? (
//                 <MenuItem disabled>No fabrics available</MenuItem>
//               ) : (
//                 fabrics.map((fabric) => (
//                   <MenuItem key={fabric._id} value={fabric.sku}>
//                     <Box sx={{ display: "flex", flexDirection: "column" }}>
//                       <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>
//                         {fabric.sku}
//                       </Typography>
//                       <Typography
//                         sx={{ fontSize: "12px", color: "text.secondary" }}
//                       >
//                         {fabric.title} {fabric.color && `• ${fabric.color}`}
//                       </Typography>
//                     </Box>
//                   </MenuItem>
//                 ))
//               )}
//             </TextField>
//             <Typography
//               sx={{ fontSize: "11px", color: "#6b7280", mt: 0.5, ml: 0.5 }}
//             >
//               Select the Fabric SKU you want to link from the list
//             </Typography>
//           </Box>

//           {/* Existing Mappings Display */}
//           {formData.fabricSKU && (
//             <Box
//               sx={{
//                 backgroundColor: "#f9fafb",
//                 borderRadius: "8px",
//                 border: "1px solid #e5e7eb",
//                 overflow: "hidden",
//               }}
//             >
//               <Box
//                 sx={{
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "space-between",
//                   px: 2,
//                   py: 1,
//                   cursor: existingMappings.length > 0 ? "pointer" : "default",
//                 }}
//                 onClick={() =>
//                   existingMappings.length > 0 &&
//                   setShowExistingMappings(!showExistingMappings)
//                 }
//               >
//                 <Typography
//                   sx={{
//                     fontSize: "13px",
//                     fontWeight: 600,
//                     color: "#374151",
//                   }}
//                 >
//                   Already Mapped Shirt SKUs{" "}
//                   {loadingMappings ? (
//                     <CircularProgress size={12} sx={{ ml: 0.5 }} />
//                   ) : (
//                     <Chip
//                       label={existingMappings.length}
//                       size="small"
//                       sx={{
//                         ml: 0.5,
//                         height: 20,
//                         fontSize: "11px",
//                         fontWeight: 700,
//                         backgroundColor:
//                           existingMappings.length > 0 ? "#dbeafe" : "#f3f4f6",
//                         color:
//                           existingMappings.length > 0 ? "#1e40af" : "#6b7280",
//                       }}
//                     />
//                   )}
//                 </Typography>
//                 {existingMappings.length > 0 &&
//                   (showExistingMappings ? (
//                     <ExpandLess sx={{ fontSize: 18, color: "#6b7280" }} />
//                   ) : (
//                     <ExpandMore sx={{ fontSize: 18, color: "#6b7280" }} />
//                   ))}
//               </Box>

//               <Collapse
//                 in={showExistingMappings && existingMappings.length > 0}
//               >
//                 <Box
//                   sx={{
//                     px: 2,
//                     pb: 1.5,
//                     display: "flex",
//                     flexWrap: "wrap",
//                     gap: 0.5,
//                   }}
//                 >
//                   {existingMappings.map((mapping) => (
//                     <Chip
//                       key={mapping._id}
//                       label={mapping.shirtSKU}
//                       size="small"
//                       sx={{
//                         fontSize: "12px",
//                         fontWeight: 500,
//                         backgroundColor: "#e0e7ff",
//                         color: "#3730a3",
//                         height: 24,
//                       }}
//                     />
//                   ))}
//                 </Box>
//               </Collapse>

//               {!loadingMappings && existingMappings.length === 0 && (
//                 <Typography
//                   sx={{
//                     fontSize: "12px",
//                     color: "#6b7280",
//                     px: 2,
//                     pb: 1.5,
//                   }}
//                 >
//                   No shirt SKUs mapped to this fabric yet.
//                 </Typography>
//               )}
//             </Box>
//           )}

//           {/* Shirt SKU Input */}
//           <Box>
//             <Typography
//               sx={{
//                 fontSize: "13px",
//                 fontWeight: 600,
//                 mb: 1,
//                 color: "#374151",
//               }}
//             >
//               Shirt SKUs <span style={{ color: "#ef4444" }}>*</span>
//             </Typography>
//             {/* <Autocomplete
//               multiple
//               freeSolo
//               options={[]}
//               value={formData.shirtSKUs}
//               onChange={handleShirtSKUsChange}
//               disabled={submitting}
//               renderTags={(value, getTagProps) =>
//                 value.map((option, index) => (
//                   <Chip
//                     variant="outlined"
//                     label={option}
//                     {...getTagProps({ index })}
//                   />
//                 ))
//               }
//               renderInput={(params) => (
//                 <TextField
//                   {...params}
//                   placeholder="Type a Shirt SKU and press Enter"
//                   error={!!errors.shirtSKUs}
//                   helperText={errors.shirtSKUs}
//                   sx={{
//                     "& .MuiOutlinedInput-root": {
//                       borderRadius: "8px",
//                     },
//                   }}
//                 />
//               )}
//             /> */}
//             <Autocomplete
//               multiple
//               freeSolo
//               options={[]}
//               value={formData.shirtSKUs}
//               onChange={handleShirtSKUsChange}
//               disabled={submitting}
//               renderTags={(value, getTagProps) =>
//                 value.map((option, index) => (
//                   <Chip
//                     variant="outlined"
//                     label={option}
//                     {...getTagProps({ index })}
//                   />
//                 ))
//               }
//               renderInput={(params) => (
//                 <TextField
//                   {...params}
//                   placeholder="Type a Shirt SKU and press Enter"
//                   error={!!errors.shirtSKUs}
//                   helperText={errors.shirtSKUs}
//                   onKeyDown={(e) => {
//                     if (e.key === " ") {
//                       const inputVal = e.target.value.trim();
//                       if (inputVal) {
//                         e.preventDefault();
//                         handleShirtSKUsChange(e, [
//                           ...formData.shirtSKUs,
//                           inputVal,
//                         ]);
//                         setTimeout(() => {
//                           e.target.value = "";
//                           e.target.dispatchEvent(
//                             new Event("input", { bubbles: true }),
//                           );
//                         }, 0);
//                       }
//                     }
//                   }}
//                   sx={{
//                     "& .MuiOutlinedInput-root": {
//                       borderRadius: "8px",
//                     },
//                   }}
//                 />
//               )}
//             />
//             <Typography
//               sx={{ fontSize: "11px", color: "#6b7280", mt: 0.5, ml: 0.5 }}
//             >
//               Enter the Shirt SKUs that correspond to the selected fabric. Hit
//               Enter after each one.
//             </Typography>
//           </Box>

//           {/* Notes Input (Optional) */}
//           <Box>
//             <Typography
//               sx={{
//                 fontSize: "13px",
//                 fontWeight: 600,
//                 mb: 1,
//                 color: "#374151",
//               }}
//             >
//               Notes <span style={{ color: "#6b7280" }}>(Optional)</span>
//             </Typography>
//             <TextField
//               fullWidth
//               multiline
//               rows={3}
//               value={formData.notes}
//               onChange={(e) => handleInputChange("notes", e.target.value)}
//               placeholder="Add any additional notes..."
//               disabled={submitting}
//               sx={{
//                 "& .MuiOutlinedInput-root": {
//                   borderRadius: "8px",
//                 },
//               }}
//             />
//           </Box>

//           {/* Helper Text */}
//           <Alert severity="info" sx={{ fontSize: "12px" }}>
//             Each Fabric SKU can be linked to one or more Shirt SKUs depending on
//             your product configuration.
//           </Alert>
//         </Box>
//       </DialogContent>

//       <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
//         <Button
//           onClick={handleClose}
//           disabled={submitting}
//           sx={{
//             textTransform: "none",
//             fontWeight: 600,
//             color: "#6b7280",
//             "&:hover": {
//               backgroundColor: "#f3f4f6",
//             },
//           }}
//         >
//           Cancel
//         </Button>
//         <Button
//           onClick={handleSubmit}
//           variant="contained"
//           disabled={submitting || loading}
//           sx={{
//             textTransform: "none",
//             fontWeight: 600,
//             backgroundColor: "#667eea",
//             "&:hover": {
//               backgroundColor: "#5568d3",
//             },
//             minWidth: 120,
//           }}
//         >
//           {submitting ? (
//             <>
//               <CircularProgress size={16} sx={{ mr: 1, color: "white" }} />
//               Saving...
//             </>
//           ) : (
//             "Save Mapping"
//           )}
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default LinkFabricShirtModal;


import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Autocomplete,
  Chip,
  Collapse,
} from "@mui/material";
import {
  Close,
  Link as LinkIcon,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

const LinkFabricShirtModal = ({ open, onClose, onSuccess }) => {
  const [fabrics, setFabrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Existing mappings state
  const [existingMappings, setExistingMappings] = useState([]);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [showExistingMappings, setShowExistingMappings] = useState(true);

  // Controlled input value for the Autocomplete text field
  const [inputValue, setInputValue] = useState("");

  const [formData, setFormData] = useState({
    fabricSKU: "",
    shirtSKUs: [],
    notes: "",
  });

  const [errors, setErrors] = useState({
    fabricSKU: "",
    shirtSKUs: "",
  });

  // Fetch fabrics when modal opens
  useEffect(() => {
    if (open) {
      fetchFabrics();
      setFormData({ fabricSKU: "", shirtSKUs: [], notes: "" });
      setErrors({ fabricSKU: "", shirtSKUs: "" });
      setError(null);
      setSuccess(false);
      setExistingMappings([]);
      setInputValue("");
    }
  }, [open]);

  // Fetch existing mappings when fabric SKU is selected
  useEffect(() => {
    if (formData.fabricSKU) {
      fetchExistingMappings(formData.fabricSKU);
    } else {
      setExistingMappings([]);
    }
  }, [formData.fabricSKU]);

  const fetchFabrics = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/fabrics");
      setFabrics(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch fabrics:", err);
      setError("Failed to load fabrics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingMappings = async (fabricSKU) => {
    try {
      setLoadingMappings(true);
      const response = await axiosInstance.get(
        `/fabrics/shirt-mapping?fabricSKU=${encodeURIComponent(fabricSKU)}`
      );
      const mappings = response.data.data || [];
      setExistingMappings(mappings);
    } catch (err) {
      console.error("Failed to fetch existing mappings:", err);
      setExistingMappings([]);
    } finally {
      setLoadingMappings(false);
    }
  };

  const existingShirtSKUs = existingMappings.map((m) =>
    (m.shirtSKU || "").trim().toLowerCase()
  );

  const isDuplicateSKU = (sku) =>
    existingShirtSKUs.includes(sku.trim().toLowerCase());

  // Commit a raw string value into the chips list
  const commitSKU = (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    // Split on commas to allow bulk entry
    const parts = [...new Set(trimmed.split(",").map((p) => p.trim()).filter(Boolean))];

    const existingDuplicates = parts.filter((v) => isDuplicateSKU(v));
    if (existingDuplicates.length > 0) {
      setErrors((prev) => ({
        ...prev,
        shirtSKUs: `The following SKU(s) are already mapped: ${existingDuplicates.join(", ")}`,
      }));
    }

    const toAdd = parts.filter((v) => !existingDuplicates.includes(v));
    const merged = [...new Set([...formData.shirtSKUs, ...toAdd])];

    setFormData((prev) => ({ ...prev, shirtSKUs: merged }));
    if (errors.shirtSKUs && toAdd.length > 0) {
      setErrors((prev) => ({ ...prev, shirtSKUs: "" }));
    }
    setInputValue(""); // clear the controlled input — no stale text left
  };

  const validateForm = (skus = formData.shirtSKUs) => {
    const newErrors = { fabricSKU: "", shirtSKUs: "" };
    let isValid = true;

    if (!formData.fabricSKU) {
      newErrors.fabricSKU = "Please select a Fabric SKU";
      isValid = false;
    }

    if (!skus || skus.length === 0) {
      newErrors.shirtSKUs = "Please enter at least one Shirt SKU";
      isValid = false;
    } else if (skus.some((sku) => sku.length > 100)) {
      newErrors.shirtSKUs = "All Shirt SKUs must be less than 100 characters";
      isValid = false;
    }

    const duplicates = skus.filter((sku) => isDuplicateSKU(sku));
    if (duplicates.length > 0) {
      newErrors.shirtSKUs = `The following Shirt SKU(s) are already mapped to this fabric: ${duplicates.join(", ")}`;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    // Commit any text still sitting in the input before validating
    let finalSKUs = formData.shirtSKUs;
    if (inputValue.trim()) {
      const trimmed = inputValue.trim();
      const parts = [...new Set(trimmed.split(",").map((p) => p.trim()).filter(Boolean))];
      finalSKUs = [...new Set([...formData.shirtSKUs, ...parts])];
      setFormData((prev) => ({ ...prev, shirtSKUs: finalSKUs }));
      setInputValue("");
    }

    if (!validateForm(finalSKUs)) return;

    try {
      setSubmitting(true);
      setError(null);

      await axiosInstance.post("/fabrics/shirt-mappings/bulk", {
        fabricSKU: formData.fabricSKU,
        shirtSKUs: finalSKUs.map((sku) => sku.trim()).filter(Boolean),
        notes: formData.notes.trim() || undefined,
      });

      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => handleClose(), 1500);
    } catch (err) {
      console.error("Failed to create mapping:", err);
      setError(
        err.response?.data?.message || "Failed to create mapping. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) onClose();
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Called by MUI Autocomplete when tags change (Enter key, backspace, etc.)
  const handleShirtSKUsChange = (event, newValue) => {
    let processedValue = [];
    newValue.forEach((val) => {
      if (typeof val === "string" && val.includes(",")) {
        const parts = val.split(",").map((p) => p.trim()).filter(Boolean);
        processedValue.push(...parts);
      } else {
        processedValue.push(val);
      }
    });

    processedValue = [...new Set(processedValue)];

    const addedItems = processedValue.filter((v) => !formData.shirtSKUs.includes(v));
    if (addedItems.length > 0) {
      const existingDuplicates = addedItems.filter((v) => isDuplicateSKU(v));
      if (existingDuplicates.length > 0) {
        setErrors((prev) => ({
          ...prev,
          shirtSKUs: `The following SKU(s) are already mapped: ${existingDuplicates.join(", ")}`,
        }));
        processedValue = processedValue.filter((v) => !existingDuplicates.includes(v));
      }
    }

    handleInputChange("shirtSKUs", processedValue);
    setInputValue(""); // always clear input when a tag is committed via Enter
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "12px" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LinkIcon sx={{ color: "#667eea" }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Link Fabric SKU to Shirt SKU
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={submitting} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Mapping created successfully!
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Fabric SKU Dropdown */}
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 600, mb: 1, color: "#374151" }}>
              Fabric SKU <span style={{ color: "#ef4444" }}>*</span>
            </Typography>
            <TextField
              select
              fullWidth
              value={formData.fabricSKU}
              onChange={(e) => handleInputChange("fabricSKU", e.target.value)}
              placeholder="Select Fabric SKU"
              error={!!errors.fabricSKU}
              helperText={errors.fabricSKU}
              disabled={loading || submitting}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            >
              {loading ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Loading fabrics...
                </MenuItem>
              ) : fabrics.length === 0 ? (
                <MenuItem disabled>No fabrics available</MenuItem>
              ) : (
                fabrics.map((fabric) => (
                  <MenuItem key={fabric._id} value={fabric.sku}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>
                        {fabric.sku}
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "text.secondary" }}>
                        {fabric.title} {fabric.color && `• ${fabric.color}`}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
            </TextField>
            <Typography sx={{ fontSize: "11px", color: "#6b7280", mt: 0.5, ml: 0.5 }}>
              Select the Fabric SKU you want to link from the list
            </Typography>
          </Box>

          {/* Existing Mappings Display */}
          {formData.fabricSKU && (
            <Box
              sx={{
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1,
                  cursor: existingMappings.length > 0 ? "pointer" : "default",
                }}
                onClick={() =>
                  existingMappings.length > 0 &&
                  setShowExistingMappings(!showExistingMappings)
                }
              >
                <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                  Already Mapped Shirt SKUs{" "}
                  {loadingMappings ? (
                    <CircularProgress size={12} sx={{ ml: 0.5 }} />
                  ) : (
                    <Chip
                      label={existingMappings.length}
                      size="small"
                      sx={{
                        ml: 0.5,
                        height: 20,
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor: existingMappings.length > 0 ? "#dbeafe" : "#f3f4f6",
                        color: existingMappings.length > 0 ? "#1e40af" : "#6b7280",
                      }}
                    />
                  )}
                </Typography>
                {existingMappings.length > 0 &&
                  (showExistingMappings ? (
                    <ExpandLess sx={{ fontSize: 18, color: "#6b7280" }} />
                  ) : (
                    <ExpandMore sx={{ fontSize: 18, color: "#6b7280" }} />
                  ))}
              </Box>

              <Collapse in={showExistingMappings && existingMappings.length > 0}>
                <Box sx={{ px: 2, pb: 1.5, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {existingMappings.map((mapping) => (
                    <Chip
                      key={mapping._id}
                      label={mapping.shirtSKU}
                      size="small"
                      sx={{
                        fontSize: "12px",
                        fontWeight: 500,
                        backgroundColor: "#e0e7ff",
                        color: "#3730a3",
                        height: 24,
                      }}
                    />
                  ))}
                </Box>
              </Collapse>

              {!loadingMappings && existingMappings.length === 0 && (
                <Typography sx={{ fontSize: "12px", color: "#6b7280", px: 2, pb: 1.5 }}>
                  No shirt SKUs mapped to this fabric yet.
                </Typography>
              )}
            </Box>
          )}

          {/* Shirt SKU Input */}
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 600, mb: 1, color: "#374151" }}>
              Shirt SKUs <span style={{ color: "#ef4444" }}>*</span>
            </Typography>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={formData.shirtSKUs}
              inputValue={inputValue}
              onInputChange={(event, newInputValue, reason) => {
                if (reason === "input" || reason === "reset") {
                  setInputValue(newInputValue);
                }
              }}
              onChange={handleShirtSKUsChange}
              disabled={submitting}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Type a Shirt SKU and press Enter"
                  error={!!errors.shirtSKUs}
                  helperText={errors.shirtSKUs}
                  onKeyDown={(e) => {
                    // Commit on Space
                    if (e.key === " ") {
                      e.preventDefault();
                      commitSKU(inputValue);
                    }
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                />
              )}
            />
            <Typography sx={{ fontSize: "11px", color: "#6b7280", mt: 0.5, ml: 0.5 }}>
              Enter the Shirt SKUs that correspond to the selected fabric. Hit
              Enter after each one.
            </Typography>
          </Box>

          {/* Notes Input (Optional) */}
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 600, mb: 1, color: "#374151" }}>
              Notes <span style={{ color: "#6b7280" }}>(Optional)</span>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add any additional notes..."
              disabled={submitting}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
          </Box>

          <Alert severity="info" sx={{ fontSize: "12px" }}>
            Each Fabric SKU can be linked to one or more Shirt SKUs depending on
            your product configuration.
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button
          onClick={handleClose}
          disabled={submitting}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "#6b7280",
            "&:hover": { backgroundColor: "#f3f4f6" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || loading}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: "#667eea",
            "&:hover": { backgroundColor: "#5568d3" },
            minWidth: 120,
          }}
        >
          {submitting ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1, color: "white" }} />
              Saving...
            </>
          ) : (
            "Save Mapping"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LinkFabricShirtModal;