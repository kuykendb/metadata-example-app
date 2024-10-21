"use client"

import React, { useState } from "react"
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import CircularProgress from '@mui/material/CircularProgress';
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { AddMappingModal } from "@/components/MappingForm/AddMappingModal";
import { UpdateMappingModal } from "@/components/MappingForm/UpdateMappingModal";
import { useAppContext } from "@/context";
import { deleteMapping } from "@/app/actions";


export function MappingsTable() {
  const { loading, mappings, refreshMappings, pollMappingId } = useAppContext();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [updateMappingId, setUpdateMappingId] = useState<string | undefined>(undefined);


  const columns: GridColDef[] = [
    { field: "description", headerName: "Description", width: 150 },
    { field: "source", headerName: "Source", width: 150 },
    { field: "target", headerName: "Target", width: 150 },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params) => {
        if (params.row.status === "ask-for-input") {
          return <Chip label="Click to map" color="warning" onClick={() => {
            setUpdateMappingId(params.row.mapping_id);
          }} />;
        }
        const color = params.row.status === "auto-mapped" ? "success" : "info";
        return <Chip label={params.row.status || "user-mapped"} color={color} />;
      },
    },
    {
      field: "action",
      headerName: "Action",
      width: 150,
      renderCell: (params) => {
        return <Button variant="contained" onClick={async () => {
          await deleteMapping(params.row.id);
          await refreshMappings();
        }}>Delete</Button>;
      }
    },
  ];

  function getMappingDescription(mappingId: string): string | undefined {
    const mapping = mappings.find((m) => m.mapping_id === mappingId);
    return mapping?.description
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Metadata Mappings Demo
      </Typography>
      <Typography sx={{marginBottom: 2}} variant="body2" gutterBottom>
        Seeing README for more information.
      </Typography>
      <div style={{display: "inline-block"}}>
      <Button sx={{ marginBottom: 2 }} variant="contained" color="primary" onClick={() => setAddModalOpen(true)}>Simulate new metadata member</Button>
      {
        pollMappingId && 
        <span style={{marginLeft: 20, paddingBottom: 10}}>
            Waiting for updates from Inngest workflow for mapping &quot;{getMappingDescription(pollMappingId)}&quot;
            <CircularProgress sx={{marginLeft: 1}} size="12px" />
        </span>
      }
      </div>
      <DataGrid
        loading={loading}
        sx={{
          maxHeight: 500,
        }}
        slotProps={{
          loadingOverlay: {
            variant: "linear-progress",
            noRowsVariant: "skeleton",
          },
        }}
        rows={mappings}
        columns={columns} />
      <AddMappingModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <UpdateMappingModal mappingId={updateMappingId} onClose={() => setUpdateMappingId(undefined)} />
    </>
  );
}
