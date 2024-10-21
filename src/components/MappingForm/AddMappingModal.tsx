"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useAppContext } from "@/context";
import { Modal, Box, TextField, Typography } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

type FormInputs = {
  description: string,
  source: string,
};

export function AddMappingModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const { addMapping } = useAppContext();
  const { register, handleSubmit, reset, } = useForm<FormInputs>();
  const [loading, setLoading] = useState(false);
  async function onSubmit(data: FormInputs) {
    setLoading(true);
    await addMapping(data.description, data.source);
    onClose();
    setLoading(false);
    reset();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2" mb={2}>
          Add metadata member
        </Typography>
        <Typography variant="body2" gutterBottom>
          Simulate metadata members being added to a source system, like a general ledger.
          New products, cost centers, periods or other members may be added to the general ledger
          and need to be mapped to other systems, like planning and forecasting systems.
          Simulate a new metadata member by providing a description and a source value.
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Description"
            variant="outlined"
            fullWidth
            margin="normal"
            size="small"
            {...register("description", {required: true})}
          />
          <TextField
            label="Source"
            variant="outlined"
            fullWidth
            margin="normal"
            size="small"
            {...register("source", {required: true})}
          />
          <LoadingButton loading={loading} type="submit" variant="contained" sx={{ mt: 2 }} fullWidth>
            Submit
          </LoadingButton>
        </form>
      </Box>
    </Modal>
  );
}
