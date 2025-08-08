import React from 'react';
import { Button, ButtonProps, InputLabel, TextField } from '@mui/material';

const ShadcnButton: React.FC<ButtonProps> = (props) => {
  return <Button variant="contained" {...props} />;
};

const EmailField: React.FC<{
  form: { email: string };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  emailInvalid: boolean;
}> = ({ form, handleChange, emailInvalid }) => {
  return (
    <div>
      <InputLabel htmlFor="email">Email</InputLabel>
      <TextField
        id="email"
        label="Email"
        name="email"
        autoComplete="email"
        value={form.email}
        onChange={handleChange}
        required
        variant="outlined"
        fullWidth
        error={emailInvalid}
        helperText={emailInvalid ? 'Invalid email address' : ''}
      />
    </div>
  );
};

export { ShadcnButton, EmailField };
