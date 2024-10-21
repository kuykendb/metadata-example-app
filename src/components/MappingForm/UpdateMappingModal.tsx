"use client";

import React from "react";
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
  target: string,
};

export function UpdateMappingModal({ onClose, mappingId }: { mappingId: string | undefined, onClose: () => void }) {
  const { register, handleSubmit, reset } = useForm<FormInputs>();
  const { updateMapping } = useAppContext();
  const [loading, setLoading] = React.useState(false);
  async function onSubmit(data: FormInputs) {
    if (mappingId === undefined) {
      return;
    }
    setLoading(true);
    await updateMapping(mappingId, data.target);
    onClose();
    setLoading(false);
    reset();
  };

  return (
    <Modal open={mappingId !== undefined} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2" mb={2}>
          Map value to a target
        </Typography>
        <Typography variant="body2" gutterBottom>
          Provide a target value to map the source value to. Some metadata members may need
          to be manually managed by users of the target systems while others can be auto-mapped.
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Target"
            variant="outlined"
            fullWidth
            margin="normal"
            size="small"
            {...register("target", { required: true })}
          />
          <LoadingButton loading={loading} type="submit" variant="contained" sx={{ mt: 2 }} fullWidth>
            Submit
          </LoadingButton>
        </form>
      </Box>
    </Modal>
  );
}
