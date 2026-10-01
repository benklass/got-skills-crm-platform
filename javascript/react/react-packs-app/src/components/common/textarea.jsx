import React from "react";

const Textarea = ({
  name,
  label,
  error,
  options,

  onChange,
  ...rest
}) => {
  return (
    <div className="form-group ">
      <label htmlFor={name}>{label}</label>

      <textarea
        {...rest}
        name={name}
        id={name}
        className="form-control bg-light"
        onChange={onChange}
      />

      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
};

export default Textarea;
