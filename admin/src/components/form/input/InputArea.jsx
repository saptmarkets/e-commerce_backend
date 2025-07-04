import React from "react";
import { Input } from "@windmill/react-ui";

const InputArea = ({
  register,
  defaultValue,
  required,
  name,
  label,
  type,
  autoComplete,
  placeholder,
  step,
  min,
  max,
  pattern,
  onChange,
}) => {
  // Determine validation pattern based on input type
  let validationPattern;
  let validationMessage;
  
  if (pattern) {
    validationPattern = pattern;
    validationMessage = `Invalid format for ${label}`;
  } else if (type === 'number') {
    // Allow decimal numbers for number inputs
    validationPattern = /^[0-9]*\.?[0-9]*$/;
    validationMessage = `Please enter a valid number`;
  }

  return (
    <>
      <Input
        {...register(`${name}`, {
          required: required ? `${label} is required!` : false,
          pattern: validationPattern ? { 
            value: validationPattern, 
            message: validationMessage 
          } : undefined,
        })}
        defaultValue={defaultValue}
        type={type}
        placeholder={placeholder}
        name={name}
        autoComplete={autoComplete}
        className="mr-2 h-12 p-2"
        step={step}
        min={min}
        max={max}
        onChange={onChange}
      />
    </>
  );
};

export default InputArea;
