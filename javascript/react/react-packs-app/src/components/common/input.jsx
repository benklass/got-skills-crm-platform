import React from "react";

// DA 26 02 2023 Added select for options input fields for Boolean isGold
const Input = ({
  name,
  label,
  error,
  options,
  useSelect,
  onChange,
  ...rest
}) => {
  return (
    <div className="form-group ">
      <label htmlFor={name}>{label}</label>
      {useSelect ? (
        <select
          {...rest}
          name={name}
          id={name}
          className="form-control bg-light"
          onChange={onChange}
        >
          {options &&
            options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>
      ) : (
        <input
          {...rest}
          name={name}
          id={name}
          className="form-control bg-light"
          onChange={onChange}
        />
      )}
      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
};

export default Input;
