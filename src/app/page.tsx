"use client"

import React from "react";
import { MappingsTable } from "@/components/MappingsTable";
import Box from "@mui/material/Box";

export default function Home() {
  return (
    <Box sx={{ padding: 8 }}>
      <MappingsTable /> 
    </Box>
  );
}
